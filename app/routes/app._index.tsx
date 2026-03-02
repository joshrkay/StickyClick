import { useEffect, useState, type FormEvent } from "react";
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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { z } from "zod";

const SettingsSchema = z.object({
  enabled: z.string().transform((val) => val === "true"),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  buttonText: z.string().min(1).max(50),
  position: z.enum(["BOTTOM_RIGHT", "BOTTOM_LEFT"]),
  upsellEnabled: z.string().transform((val) => val === "true"),
  upsellProductId: z.string().optional().nullable(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  try {
    let settings = await prisma.shopSettings.findUnique({
      where: { shop: session.shop },
    });

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shop: session.shop,
          enabled: true,
          primaryColor: "#000000",
          textColor: "#FFFFFF",
          buttonText: "Add to Cart",
          position: "BOTTOM_RIGHT",
        },
      });
    }

    return { settings, error: null };
  } catch (error) {
    console.error("Failed to load settings:", error);
    throw new Response("Failed to load settings", { status: 500 });
  }
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
        settings: null 
      };
    }

    const data = result.data;

    const settings = await prisma.shopSettings.update({
      where: { shop: session.shop },
      data: {
        enabled: data.enabled,
        primaryColor: data.primaryColor,
        textColor: data.textColor,
        buttonText: data.buttonText,
        position: data.position,
        upsellEnabled: data.upsellEnabled,
        upsellProductId: data.upsellProductId,
      },
    });

    // Sync to App Metafield via GraphQL
    const shopResponse = await admin.graphql(`#graphql { shop { id } }`);
    const shopJson = await shopResponse.json();
    
    if (!shopJson.data?.shop?.id) {
        throw new Error("Failed to fetch shop ID for metafield sync");
    }
    
    const shopId = shopJson.data.shop.id;

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
              value: JSON.stringify({
                enabled: data.enabled,
                primaryColor: data.primaryColor,
                textColor: data.textColor,
                buttonText: data.buttonText,
                position: data.position,
                upsellEnabled: data.upsellEnabled,
                upsellProductId: data.upsellProductId
              }),
              ownerId: shopId
            }
          ]
        }
      }
    );

    const metafieldJson = await metafieldResponse.json();
    if (metafieldJson.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error("Metafield sync errors:", metafieldJson.data.metafieldsSet.userErrors);
        // We don't fail the request here since DB update succeeded, but we log it
    }

    return { settings, status: "success", errors: null };

  } catch (error) {
    console.error("Failed to save settings:", error);
    return { status: "error", errors: { form: ["Failed to save settings. Please try again."] }, settings: null };
  }
};


export default function Index() {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";

  const [enabled, setEnabled] = useState(settings.enabled ? "true" : "false");
  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [textColor, setTextColor] = useState(settings.textColor);
  const [position, setPosition] = useState(settings.position);
  const [upsellEnabled, setUpsellEnabled] = useState(settings.upsellEnabled ? "true" : "false");
  const [upsellProductId, setUpsellProductId] = useState(settings.upsellProductId || "");

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data, shopify]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    fetcher.submit(form);
  };

  return (
    <Page>
      <TitleBar title="StickyClick Settings" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingMd">
                  Configure your sticky button
                </Text>
                
                <fetcher.Form method="post" onSubmit={handleSubmit}>
                  <FormLayout>
                    <Select
                      label="Status"
                      name="enabled"
                      options={[
                        { label: "Enabled", value: "true" },
                        { label: "Disabled", value: "false" },
                      ]}
                      value={enabled}
                      onChange={setEnabled}
                    />

                    <TextField
                      label="Button Text"
                      name="buttonText"
                      value={buttonText}
                      onChange={setButtonText}
                      autoComplete="off"
                    />

                    <FormLayout.Group>
                      <TextField
                        label="Primary Color (Hex)"
                        name="primaryColor"
                        value={primaryColor}
                        onChange={setPrimaryColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Text Color (Hex)"
                        name="textColor"
                        value={textColor}
                        onChange={setTextColor}
                        autoComplete="off"
                      />
                    </FormLayout.Group>

                    <Select
                      label="Position"
                      name="position"
                      options={[
                        { label: "Bottom Right", value: "BOTTOM_RIGHT" },
                        { label: "Bottom Left", value: "BOTTOM_LEFT" },
                      ]}
                      value={position}
                      onChange={setPosition}
                    />

                    <Select
                      label="Upsell"
                      name="upsellEnabled"
                      options={[
                        { label: "Disabled", value: "false" },
                        { label: "Enabled", value: "true" },
                      ]}
                      value={upsellEnabled}
                      onChange={setUpsellEnabled}
                    />

                    <TextField
                      label="Upsell Variant ID (Shopify GID or numeric variant id)"
                      name="upsellProductId"
                      value={upsellProductId}
                      onChange={setUpsellProductId}
                      autoComplete="off"
                      helpText="Example: 1234567890"
                    />

                    <Box paddingBlockStart="400">
                      <Button submit variant="primary" loading={isLoading}>
                        Save Settings
                      </Button>
                    </Box>
                  </FormLayout>
                </fetcher.Form>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Preview
                </Text>
                <Box
                  background="bg-surface-secondary"
                  padding="400"
                  borderRadius="200"
                  minHeight="100px"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent:
                        position === "BOTTOM_LEFT"
                          ? "flex-start"
                          : "flex-end",
                      minHeight: "100px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: primaryColor,
                        color: textColor,
                        padding: "10px 20px",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      {buttonText}
                      {upsellEnabled === "true" && upsellProductId ? " + Upsell" : ""}
                    </div>
                  </div>
                </Box>
                <Text as="p" tone="subdued">
                  Note: Save to update the preview.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
