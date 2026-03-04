import { useEffect, useState, useCallback, type FormEvent } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  FormLayout,
  Select,
  TextField,
  Banner,
  ChoiceList,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getFeatureTier } from "../billing.server";
import prisma from "../db.server";
import { SettingsSchema } from "../schemas/settings";
import { sanitizeSettingsForTier } from "../utils/tier-gating";
import { pickSettings } from "../utils/settings-fields";
import { DEFAULT_SETTINGS } from "../utils/settings-defaults";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const defaults = {
    id: 0,
    shop: session.shop,
    ...DEFAULT_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let settings;
  try {
    settings = await prisma.shopSettings.findUnique({
      where: { shop: session.shop },
    });

    if (!settings) {
      settings = await prisma.shopSettings.create({ data: defaults });
    }
  } catch (error) {
    console.error("Failed to load settings from database:", error);
    settings = defaults;
  }

  let tier: Awaited<ReturnType<typeof getFeatureTier>> = "basic";
  try {
    tier = await getFeatureTier(request);
  } catch (error) {
    console.error("Failed to check billing tier:", error);
  }

  // Apply tier-gating so the UI (and any future metafield reads) reflect
  // the merchant's actual plan, not raw DB defaults.
  const gatedSettings = sanitizeSettingsForTier(
    tier,
    pickSettings(settings as unknown as Record<string, unknown>),
  );

  return {
    settings: { ...settings, ...gatedSettings },
    tier,
    error: null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const rawData = Object.fromEntries(formData);

    const result = SettingsSchema.safeParse(rawData);

    if (!result.success) {
      return {
        status: "error",
        errors: result.error.flatten().fieldErrors,
        settings: null,
      };
    }

    const tier = await getFeatureTier(request);
    const data = sanitizeSettingsForTier(tier, result.data);

    const settings = await prisma.shopSettings.update({
      where: { shop: session.shop },
      data: pickSettings(data as unknown as Record<string, unknown>),
    });

    const shopResponse = await admin.graphql(`#graphql { shop { id } }`);
    const { data: shopData } = await shopResponse.json();

    if (!shopData?.shop?.id) {
      throw new Error("Failed to fetch shop ID for metafield sync");
    }

    const metafieldResponse = await admin.graphql(
      `#graphql
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
            }
            userErrors {
              field
              message
            }
          }
        }`,
      {
        variables: {
          metafields: [
            {
              namespace: "stickyclick",
              key: "settings",
              type: "json",
              value: JSON.stringify(pickSettings(data as unknown as Record<string, unknown>)),
              ownerId: shopData.shop.id,
            },
          ],
        },
      },
    );

    const metafieldJson = await metafieldResponse.json();
    if (metafieldJson.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("Metafield sync errors:", metafieldJson.data.metafieldsSet.userErrors);
      return {
        settings,
        status: "error",
        errors: { form: ["Settings saved to database but failed to sync to your storefront. Please try saving again."] },
      };
    }

    return { settings, status: "success", errors: null };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { status: "error", errors: { form: ["Failed to save settings. Please try again."] }, settings: null };
  }
};

function toFormState(settings: Record<string, unknown>): Record<string, string> {
  return {
    enabled: settings.enabled ? "true" : "false",
    buttonText: String(settings.buttonText ?? ""),
    primaryColor: String(settings.primaryColor ?? ""),
    textColor: String(settings.textColor ?? ""),
    position: String(settings.position ?? ""),
    upsellEnabled: settings.upsellEnabled ? "true" : "false",
    upsellProductId: String(settings.upsellProductId ?? ""),
    quickBuyEnabled: settings.quickBuyEnabled ? "true" : "false",
    showCartSummary: settings.showCartSummary ? "true" : "false",
    enableQuantitySelector: settings.enableQuantitySelector ? "true" : "false",
    openCartDrawer: settings.openCartDrawer ? "true" : "false",
    showFreeShippingBar: settings.showFreeShippingBar ? "true" : "false",
    freeShippingGoal: String(settings.freeShippingGoal || 5000),
    countdownEnabled: settings.countdownEnabled ? "true" : "false",
    countdownEndTime: String(settings.countdownEndTime ?? ""),
    countdownDuration: String(settings.countdownDuration || 0),
    countdownText: String(settings.countdownText ?? "Offer ends in"),
    trustBadgesEnabled: settings.trustBadgesEnabled ? "true" : "false",
    trustBadgesList: String(settings.trustBadgesList ?? "secure_checkout,money_back"),
    trustBadgesStyle: String(settings.trustBadgesStyle ?? "icon_text"),
    analyticsEnabled: settings.analyticsEnabled ? "true" : "false",
  };
}

export default function Index() {
  const { settings, tier } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const isProOrHigher = tier === "pro" || tier === "premium";
  const isPremium = tier === "premium";

  const [form, setForm] = useState(() => toFormState(settings));
  const update = useCallback(
    (field: string) => (value: string) => setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Settings saved");
    }
    if (fetcher.data?.status === "error") {
      const errors = fetcher.data.errors as Record<string, string[]> | null;
      const msg = errors?.form?.[0] || "Failed to save settings";
      shopify.toast.show(msg, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formEl = event.target as HTMLFormElement;
    fetcher.submit(formEl);
  };

  return (
    <Page>
      <TitleBar title="StickyClick Settings" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">Configure your sticky button</Text>

                <fetcher.Form method="post" onSubmit={handleSubmit}>
                  <FormLayout>
                    <Select label="Status" name="enabled" options={[{ label: "Enabled", value: "true" }, { label: "Disabled", value: "false" }]} value={form.enabled} onChange={update("enabled")} />

                    <TextField label="Button Text" name="buttonText" value={form.buttonText} onChange={update("buttonText")} autoComplete="off" />

                    <FormLayout.Group>
                      <TextField label="Primary Color (Hex)" name="primaryColor" value={form.primaryColor} onChange={update("primaryColor")} autoComplete="off" />
                      <TextField label="Text Color (Hex)" name="textColor" value={form.textColor} onChange={update("textColor")} autoComplete="off" />
                    </FormLayout.Group>

                    <Select label="Position" name="position" options={[{ label: "Bottom Right", value: "BOTTOM_RIGHT" }, { label: "Bottom Left", value: "BOTTOM_LEFT" }]} value={form.position} onChange={update("position")} />

                    <Select label="Show Cart Summary" name="showCartSummary" options={[{ label: "Enabled", value: "true" }, { label: "Disabled", value: "false" }]} value={form.showCartSummary} onChange={update("showCartSummary")} disabled={!isProOrHigher} />

                    <Select label="Enable Free Shipping Bar" name="showFreeShippingBar" options={[{ label: "Enabled", value: "true" }, { label: "Disabled", value: "false" }]} value={form.showFreeShippingBar} onChange={update("showFreeShippingBar")} disabled={!isProOrHigher} />

                    <TextField label="Free Shipping Goal (cents)" name="freeShippingGoal" value={form.freeShippingGoal} onChange={update("freeShippingGoal")} autoComplete="off" helpText="e.g. 5000 = $50.00" disabled={!isProOrHigher} />

                    <Select label="Countdown Timer" name="countdownEnabled" options={[{ label: "Disabled", value: "false" }, { label: "Enabled", value: "true" }]} value={form.countdownEnabled} onChange={update("countdownEnabled")} disabled={!isProOrHigher} />

                    {form.countdownEnabled === "true" && (
                      <>
                        <TextField label="Countdown Label" name="countdownText" value={form.countdownText} onChange={update("countdownText")} autoComplete="off" disabled={!isProOrHigher} />
                        <TextField label="Sale End Date/Time (ISO 8601)" name="countdownEndTime" value={form.countdownEndTime} onChange={update("countdownEndTime")} autoComplete="off" helpText="e.g. 2026-03-15T23:59:00Z. Leave blank for evergreen timer." disabled={!isProOrHigher} />
                        <TextField label="Evergreen Duration (seconds)" name="countdownDuration" value={form.countdownDuration} onChange={update("countdownDuration")} autoComplete="off" helpText="Per-session countdown. e.g. 900 = 15 minutes. Only used if end date is blank." disabled={!isProOrHigher} />
                      </>
                    )}

                    <Select label="Trust Badges" name="trustBadgesEnabled" options={[{ label: "Disabled", value: "false" }, { label: "Enabled", value: "true" }]} value={form.trustBadgesEnabled} onChange={update("trustBadgesEnabled")} disabled={!isProOrHigher} />

                    {form.trustBadgesEnabled === "true" && (
                      <>
                        <ChoiceList
                          title="Select Badges"
                          allowMultiple
                          choices={[
                            { label: "Secure Checkout", value: "secure_checkout" },
                            { label: "Money-back Guarantee", value: "money_back" },
                            { label: "Free Returns", value: "free_returns" },
                            { label: "Fast Shipping", value: "fast_shipping" },
                            { label: "Satisfaction Guaranteed", value: "satisfaction_guaranteed" },
                            { label: "SSL Encrypted", value: "ssl_encrypted" },
                          ]}
                          selected={form.trustBadgesList.split(",")}
                          onChange={(selected: string[]) => update("trustBadgesList")(selected.join(","))}
                          disabled={!isProOrHigher}
                        />
                        <input type="hidden" name="trustBadgesList" value={form.trustBadgesList} />
                        <Select label="Badge Style" name="trustBadgesStyle" options={[{ label: "Icon + Text", value: "icon_text" }, { label: "Icon Only", value: "icon_only" }, { label: "Text Only", value: "text_only" }]} value={form.trustBadgesStyle} onChange={update("trustBadgesStyle")} disabled={!isProOrHigher} />
                      </>
                    )}

                    <Select label="Enable Quantity Selector" name="enableQuantitySelector" options={[{ label: "Enabled", value: "true" }, { label: "Disabled", value: "false" }]} value={form.enableQuantitySelector} onChange={update("enableQuantitySelector")} disabled={!isPremium} />

                    <Select label="Open Cart Drawer after add" name="openCartDrawer" options={[{ label: "Enabled", value: "true" }, { label: "Disabled", value: "false" }]} value={form.openCartDrawer} onChange={update("openCartDrawer")} helpText="When disabled, Add to Cart redirects to /cart (unless Quick Buy is enabled)." disabled={!isPremium} />

                    <Select label="Analytics Tracking" name="analyticsEnabled" options={[{ label: "Disabled", value: "false" }, { label: "Enabled", value: "true" }]} value={form.analyticsEnabled} onChange={update("analyticsEnabled")} helpText="Track add-to-cart events from the sticky button." disabled={!isPremium} />

                    <Card>
                      <BlockStack gap="150">
                        <Text as="h3" variant="headingSm">Feature Packaging</Text>
                        <Text as="p" tone="subdued">Current plan: {tier.toUpperCase()}</Text>
                        <Text as="p">Basic: Sticky button core (status, text, colors, position)</Text>
                        <Text as="p">Pro: Upsell, Quick Buy, Cart Summary, Free Shipping Bar, Countdown Timer, Trust Badges</Text>
                        <Text as="p">Premium: Quantity Selector, Cart Drawer controls, Analytics Dashboard</Text>
                      </BlockStack>
                    </Card>

                    {!isProOrHigher && (
                      <Banner tone="warning">Pro unlocks Upsell, Quick Buy, Cart Summary, Free Shipping Bar, Countdown Timer, and Trust Badges.</Banner>
                    )}

                    {!isPremium && (
                      <Banner tone="info">Premium unlocks Quantity Selector, Cart Drawer controls, and Analytics Dashboard.</Banner>
                    )}

                    <Select label="Upsell" name="upsellEnabled" options={[{ label: "Disabled", value: "false" }, { label: "Enabled", value: "true" }]} value={form.upsellEnabled} onChange={update("upsellEnabled")} disabled={!isProOrHigher} />

                    <TextField
                      label="Upsell Variant ID (Shopify GID or numeric variant id)"
                      name="upsellProductId"
                      value={form.upsellProductId}
                      onChange={update("upsellProductId")}
                      autoComplete="off"
                      helpText="Example: 1234567890"
                      disabled={!isProOrHigher}
                    />

                    <Select label="Quick Buy (Skip Cart → Checkout)" name="quickBuyEnabled" options={[{ label: "Disabled", value: "false" }, { label: "Enabled", value: "true" }]} value={form.quickBuyEnabled} onChange={update("quickBuyEnabled")} disabled={!isProOrHigher} />

                    <Box paddingBlockStart="400">
                      <Button submit variant="primary" loading={isLoading}>Save Settings</Button>
                    </Box>
                  </FormLayout>
                </fetcher.Form>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">Preview</Text>
                <Box background="bg-surface-secondary" padding="400" borderRadius="200" minHeight="100px">
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: form.position === "BOTTOM_LEFT" ? "flex-start" : "flex-end", minHeight: "100px" }}>
                    <div style={{ backgroundColor: form.primaryColor, color: form.textColor, padding: "10px 20px", borderRadius: "4px", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                      {form.buttonText}
                      {form.upsellEnabled === "true" && form.upsellProductId ? " + Upsell" : ""}
                    </div>
                  </div>
                </Box>
                <Text as="p" tone="subdued">Note: Save to update storefront behavior.</Text>
              </BlockStack>
            </Card>

            {isPremium && (
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Analytics</Text>
                  <Text as="p" tone="subdued">View click and conversion data for your sticky button.</Text>
                  <Button url="/app/analytics">View Analytics Dashboard</Button>
                </BlockStack>
              </Card>
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
