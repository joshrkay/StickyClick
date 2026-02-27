import { useEffect } from "react";
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
  const metafieldsSet = await admin.graphql(
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
            ownerId: (await admin.graphql(`#graphql { shop { id } }`).then(r => r.json())).data.shop.id
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

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data, shopify]);

  const handleSubmit = (event: React.FormEvent) => {
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
                      defaultValue={settings.enabled ? "true" : "false"}
                    />

                    <TextField
                      label="Button Text"
                      name="buttonText"
                      defaultValue={settings.buttonText}
                      autoComplete="off"
                    />

                    <FormLayout.Group>
                      <TextField
                        label="Primary Color (Hex)"
                        name="primaryColor"
                        defaultValue={settings.primaryColor}
                        autoComplete="off"
                        prefix="#"
                      />
                      <TextField
                        label="Text Color (Hex)"
                        name="textColor"
                        defaultValue={settings.textColor}
                        autoComplete="off"
                        prefix="#"
                      />
                    </FormLayout.Group>

                    <Select
                      label="Position"
                      name="position"
                      options={[
                        { label: "Bottom Right", value: "BOTTOM_RIGHT" },
                        { label: "Bottom Left", value: "BOTTOM_LEFT" },
                      ]}
                      defaultValue={settings.position}
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
                  style={{ display: 'flex', alignItems: 'flex-end', justifyContent: settings.position === 'BOTTOM_LEFT' ? 'flex-start' : 'flex-end' }}
                >
                  {/* Mock live preview based on current props (simplified for now to just show saved state, 
                      real-time preview would need state management outside the form) 
                  */}
                  <div style={{
                    backgroundColor: settings.primaryColor,
                    color: settings.textColor,
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {settings.buttonText}
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
