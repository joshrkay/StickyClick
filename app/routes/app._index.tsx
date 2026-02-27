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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
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

  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "true";
  const primaryColor = formData.get("primaryColor") as string;
  const textColor = formData.get("textColor") as string;
  const buttonText = formData.get("buttonText") as string;
  const position = formData.get("position") as string;

  const settings = await prisma.shopSettings.update({
    where: { shop: session.shop },
    data: {
      enabled,
      primaryColor,
      textColor,
      buttonText,
      position,
    },
  });

  // Sync to App Metafield via GraphQL
  const shopResponse = await admin.graphql(`#graphql { shop { id } }`);
  const shopJson = await shopResponse.json();
  const shopId = shopJson.data.shop.id;

  await admin.graphql(
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
              enabled,
              primaryColor,
              textColor,
              buttonText,
              position
            }),
            ownerId: shopId
          }
        ]
      }
    }
  );

  return { settings, status: "success" };
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
