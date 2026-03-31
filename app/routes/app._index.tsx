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
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getFeatureTier } from "../billing.server";
import prisma from "../db.server";
import { SettingsSchema } from "../schemas/settings";
import { sanitizeSettingsForTier } from "../utils/tier-gating";
import { pickSettings } from "../utils/settings-fields";
import { DEFAULT_SETTINGS } from "../utils/settings-defaults";
import { toVariantGid } from "../utils/variant-gid.server";
import { useI18n } from "../i18n";

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
    let data = sanitizeSettingsForTier(tier, result.data);

    if (data.upsellEnabled && data.upsellProductId) {
      const gid = toVariantGid(String(data.upsellProductId));
      if (!gid) {
        return {
          status: "error",
          errors: { upsellProductId: ["settings.errorInvalidVariant"] },
          settings: null,
        };
      }
      const variantRes = await admin.graphql(
        `#graphql
          query StickyClickUpsellVariant($id: ID!) {
            node(id: $id) {
              ... on ProductVariant { id }
            }
          }`,
        { variables: { id: gid } },
      );
      const variantJson = await variantRes.json();
      if (!variantJson.data?.node?.id) {
        return {
          status: "error",
          errors: {
            upsellProductId: ["settings.errorVariantNotFound"],
          },
          settings: null,
        };
      }
      data = { ...data, upsellProductId: gid };
    }

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
        errors: { form: ["settings.errorSyncFailed"] },
      };
    }

    return { settings, status: "success", errors: null };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { status: "error", errors: { form: ["settings.errorSaveFailed"] }, settings: null };
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
    lowStockEnabled: settings.lowStockEnabled ? "true" : "false",
    lowStockThreshold: String(settings.lowStockThreshold || 10),
    showDiscountBadge: settings.showDiscountBadge ? "true" : "false",
    smartUpsellEnabled: settings.smartUpsellEnabled ? "true" : "false",
    smartUpsellStrategy: String(settings.smartUpsellStrategy ?? "same_collection"),
    multiCurrencyEnabled: settings.multiCurrencyEnabled ? "true" : "false",
  };
}

export default function Index() {
  const { settings, tier } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const { t } = useI18n();

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";
  const isProOrHigher = tier === "pro" || tier === "premium";
  const isPremium = tier === "premium";

  const [form, setForm] = useState(() => toFormState(settings));
  const update = useCallback(
    (field: string) => (value: string) => setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const handlePickUpsellVariant = useCallback(async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: "variant",
        action: "select",
        multiple: false,
      });
      const first = selected?.[0];
      if (first && typeof first.id === "string") {
        update("upsellProductId")(first.id);
      }
    } catch {
      shopify.toast.show(t("settings.toastPickerError"), { isError: true });
    }
  }, [shopify, update, t]);

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show(t("settings.toastSaved"));
    }
    if (fetcher.data?.status === "error") {
      const errors = fetcher.data.errors as Record<string, string[]> | null;
      const rawMsg =
        errors?.form?.[0] || errors?.upsellProductId?.[0] || "settings.toastSaveFailed";
      // Server returns translation keys; resolve them client-side
      const msg = rawMsg.startsWith("settings.") ? t(rawMsg) : rawMsg;
      shopify.toast.show(msg, { isError: true });
    }
  }, [fetcher.data, shopify, t]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const formEl = event.target as HTMLFormElement;
    fetcher.submit(formEl);
  };

  return (
    <Page>
      <TitleBar title={t("settings.title")} />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">{t("settings.heading")}</Text>

                <fetcher.Form method="post" onSubmit={handleSubmit}>
                  <FormLayout>
                    <Select label={t("settings.status")} name="enabled" options={[{ label: t("settings.enabled"), value: "true" }, { label: t("settings.disabled"), value: "false" }]} value={form.enabled} onChange={update("enabled")} />

                    <TextField label={t("settings.buttonText")} name="buttonText" value={form.buttonText} onChange={update("buttonText")} autoComplete="off" />

                    <FormLayout.Group>
                      <TextField label={t("settings.primaryColor")} name="primaryColor" value={form.primaryColor} onChange={update("primaryColor")} autoComplete="off" />
                      <TextField label={t("settings.textColor")} name="textColor" value={form.textColor} onChange={update("textColor")} autoComplete="off" />
                    </FormLayout.Group>

                    <Select label={t("settings.position")} name="position" options={[{ label: t("settings.bottomRight"), value: "BOTTOM_RIGHT" }, { label: t("settings.bottomLeft"), value: "BOTTOM_LEFT" }]} value={form.position} onChange={update("position")} />

                    <Select label={t("settings.showCartSummary")} name="showCartSummary" options={[{ label: t("settings.enabled"), value: "true" }, { label: t("settings.disabled"), value: "false" }]} value={form.showCartSummary} onChange={update("showCartSummary")} disabled={!isProOrHigher} />

                    <Select label={t("settings.enableFreeShippingBar")} name="showFreeShippingBar" options={[{ label: t("settings.enabled"), value: "true" }, { label: t("settings.disabled"), value: "false" }]} value={form.showFreeShippingBar} onChange={update("showFreeShippingBar")} disabled={!isProOrHigher} />

                    <TextField label={t("settings.freeShippingGoal")} name="freeShippingGoal" value={form.freeShippingGoal} onChange={update("freeShippingGoal")} autoComplete="off" helpText={t("settings.freeShippingGoalHelp")} disabled={!isProOrHigher} />

                    <Select label={t("settings.countdownTimer")} name="countdownEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.countdownEnabled} onChange={update("countdownEnabled")} disabled={!isProOrHigher} />

                    {form.countdownEnabled === "true" && (
                      <>
                        <TextField label={t("settings.countdownLabel")} name="countdownText" value={form.countdownText} onChange={update("countdownText")} autoComplete="off" disabled={!isProOrHigher} />
                        <TextField label={t("settings.countdownEndTime")} name="countdownEndTime" value={form.countdownEndTime} onChange={update("countdownEndTime")} autoComplete="off" helpText={t("settings.countdownEndTimeHelp")} disabled={!isProOrHigher} />
                        <TextField label={t("settings.countdownDuration")} name="countdownDuration" value={form.countdownDuration} onChange={update("countdownDuration")} autoComplete="off" helpText={t("settings.countdownDurationHelp")} disabled={!isProOrHigher} />
                      </>
                    )}

                    <Select label={t("settings.trustBadges")} name="trustBadgesEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.trustBadgesEnabled} onChange={update("trustBadgesEnabled")} disabled={!isProOrHigher} />

                    {form.trustBadgesEnabled === "true" && (
                      <>
                        <ChoiceList
                          title={t("settings.selectBadges")}
                          allowMultiple
                          choices={[
                            { label: t("settings.badgeSecureCheckout"), value: "secure_checkout" },
                            { label: t("settings.badgeMoneyBack"), value: "money_back" },
                            { label: t("settings.badgeFreeReturns"), value: "free_returns" },
                            { label: t("settings.badgeFastShipping"), value: "fast_shipping" },
                            { label: t("settings.badgeSatisfaction"), value: "satisfaction_guaranteed" },
                            { label: t("settings.badgeSslEncrypted"), value: "ssl_encrypted" },
                          ]}
                          selected={form.trustBadgesList.split(",")}
                          onChange={(selected: string[]) => update("trustBadgesList")(selected.join(","))}
                          disabled={!isProOrHigher}
                        />
                        <input type="hidden" name="trustBadgesList" value={form.trustBadgesList} />
                        <Select label={t("settings.badgeStyle")} name="trustBadgesStyle" options={[{ label: t("settings.badgeIconText"), value: "icon_text" }, { label: t("settings.badgeIconOnly"), value: "icon_only" }, { label: t("settings.badgeTextOnly"), value: "text_only" }]} value={form.trustBadgesStyle} onChange={update("trustBadgesStyle")} disabled={!isProOrHigher} />
                      </>
                    )}

                    <Select label={t("settings.lowStockBadge")} name="lowStockEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.lowStockEnabled} onChange={update("lowStockEnabled")} helpText={t("settings.lowStockBadgeHelp")} disabled={!isProOrHigher} />

                    {form.lowStockEnabled === "true" && (
                      <TextField label={t("settings.lowStockThresholdLabel")} name="lowStockThreshold" value={form.lowStockThreshold} onChange={update("lowStockThreshold")} autoComplete="off" helpText={t("settings.lowStockThresholdHelp")} disabled={!isProOrHigher} />
                    )}

                    <Select label={t("settings.discountBadge")} name="showDiscountBadge" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.showDiscountBadge} onChange={update("showDiscountBadge")} helpText={t("settings.discountBadgeHelp")} disabled={!isProOrHigher} />

                    <Select label={t("settings.multiCurrency")} name="multiCurrencyEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.multiCurrencyEnabled} onChange={update("multiCurrencyEnabled")} helpText={t("settings.multiCurrencyHelp")} disabled={!isProOrHigher} />

                    <Select label={t("settings.smartUpsell")} name="smartUpsellEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.smartUpsellEnabled} onChange={update("smartUpsellEnabled")} helpText={t("settings.smartUpsellHelp")} disabled={!isPremium} />

                    {form.smartUpsellEnabled === "true" && (
                      <Select label={t("settings.smartUpsellStrategy")} name="smartUpsellStrategy" options={[{ label: t("settings.smartUpsellSameCollection"), value: "same_collection" }, { label: t("settings.smartUpsellBestSelling"), value: "best_selling" }, { label: t("settings.smartUpsellHighestPrice"), value: "highest_price" }]} value={form.smartUpsellStrategy} onChange={update("smartUpsellStrategy")} disabled={!isPremium} />
                    )}

                    <Select label="Enable Quantity Selector" name="enableQuantitySelector" options={[{ label: "Enabled", value: "true" }, { label: "Disabled", value: "false" }]} value={form.enableQuantitySelector} onChange={update("enableQuantitySelector")} disabled={!isPremium} />

                    <Select label={t("settings.openCartDrawer")} name="openCartDrawer" options={[{ label: t("settings.enabled"), value: "true" }, { label: t("settings.disabled"), value: "false" }]} value={form.openCartDrawer} onChange={update("openCartDrawer")} helpText={t("settings.openCartDrawerHelp")} disabled={!isPremium} />

                    <Select label={t("settings.analyticsTracking")} name="analyticsEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.analyticsEnabled} onChange={update("analyticsEnabled")} helpText={t("settings.analyticsTrackingHelp")} disabled={!isPremium} />

                    <Card>
                      <BlockStack gap="150">
                        <Text as="h3" variant="headingSm">{t("settings.featurePackaging")}</Text>
                        <Text as="p" tone="subdued">{t("settings.currentPlan", { tier: tier.toUpperCase() })}</Text>
                        <Text as="p">{t("settings.basicFeatures")}</Text>
                        <Text as="p">{t("settings.proFeatures")}</Text>
                        <Text as="p">{t("settings.premiumFeatures")}</Text>
                      </BlockStack>
                    </Card>

                    {!isProOrHigher && (
                      <Banner tone="warning">{t("settings.proBanner")}</Banner>
                    )}

                    {!isPremium && (
                      <Banner tone="info">{t("settings.premiumBanner")}</Banner>
                    )}

                    <Select label={t("settings.upsell")} name="upsellEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.upsellEnabled} onChange={update("upsellEnabled")} disabled={!isProOrHigher} />

                    <InlineStack gap="300" blockAlign="end" wrap={false}>
                      <Box minWidth="0" width="100%">
                        <TextField
                          label={t("settings.upsellVariant")}
                          name="upsellProductId"
                          value={form.upsellProductId}
                          onChange={update("upsellProductId")}
                          autoComplete="off"
                          helpText={t("settings.upsellVariantHelp")}
                          disabled={!isProOrHigher}
                        />
                      </Box>
                      <Button submit={false} onClick={() => void handlePickUpsellVariant()} disabled={!isProOrHigher}>
                        {t("settings.browse")}
                      </Button>
                    </InlineStack>

                    <Select label={t("settings.quickBuy")} name="quickBuyEnabled" options={[{ label: t("settings.disabled"), value: "false" }, { label: t("settings.enabled"), value: "true" }]} value={form.quickBuyEnabled} onChange={update("quickBuyEnabled")} disabled={!isProOrHigher} />

                    <Box paddingBlockStart="400">
                      <Button submit variant="primary" loading={isLoading}>{t("settings.saveSettings")}</Button>
                    </Box>
                  </FormLayout>
                </fetcher.Form>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">{t("settings.preview")}</Text>
                <Box background="bg-surface-secondary" padding="400" borderRadius="200" minHeight="100px">
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: form.position === "BOTTOM_LEFT" ? "flex-start" : "flex-end", minHeight: "100px" }}>
                    <div style={{ backgroundColor: form.primaryColor, color: form.textColor, padding: "10px 20px", borderRadius: "4px", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                      {form.buttonText}
                      {form.upsellEnabled === "true" && form.upsellProductId ? t("settings.upsellPreviewSuffix") : ""}
                    </div>
                  </div>
                </Box>
                <Text as="p" tone="subdued">{t("settings.previewNote")}</Text>
              </BlockStack>
            </Card>

            {isPremium && (
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">{t("settings.analyticsCard")}</Text>
                  <Text as="p" tone="subdued">{t("settings.analyticsCardDesc")}</Text>
                  <Button url="/app/analytics">{t("settings.viewAnalyticsDashboard")}</Button>
                </BlockStack>
              </Card>
            )}

            {isPremium && (
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">A/B Testing</Text>
                  <Text as="p" tone="subdued">Test different button configurations to optimize conversions.</Text>
                  <Button url="/app/ab-testing">Manage A/B Tests</Button>
                </BlockStack>
              </Card>
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
