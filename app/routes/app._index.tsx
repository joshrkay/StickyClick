import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  TextField,
  Button,
} from "@shopify/polaris";
import { useState } from "react";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const settings = await db.shopSettings.findUnique({ where: { shop } });

  return {
    enabled: settings?.enabled ?? false,
    primaryColor: settings?.primaryColor ?? "#000000",
    textColor: settings?.textColor ?? "#FFFFFF",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  const enabled = formData.get("enabled") === "true";
  const primaryColor = (formData.get("primaryColor") as string) || "#000000";
  const textColor = (formData.get("textColor") as string) || "#FFFFFF";

  await db.shopSettings.upsert({
    where: { shop },
    update: { enabled, primaryColor, textColor },
    create: { shop, enabled, primaryColor, textColor },
  });

  return { status: "saved" };
};

export default function Index() {
  const { enabled, primaryColor, textColor } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const [formState, setFormState] = useState({
    enabled,
    primaryColor,
    textColor,
  });

  const handleSave = () => {
    const formData = new FormData();
    formData.set("enabled", String(formState.enabled));
    formData.set("primaryColor", formState.primaryColor);
    formData.set("textColor", formState.textColor);
    submit(formData, { method: "post" });
  };

  return (
    <Page title="StickyClick Settings">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Sticky Add-to-Cart Button</Text>
              <Button
                variant={formState.enabled ? "primary" : "secondary"}
                onClick={() =>
                  setFormState((s) => ({ ...s, enabled: !s.enabled }))
                }
              >
                {formState.enabled ? "Enabled" : "Disabled"}
              </Button>
              <TextField
                label="Primary Color"
                value={formState.primaryColor}
                onChange={(value) =>
                  setFormState((s) => ({ ...s, primaryColor: value }))
                }
                autoComplete="off"
              />
              <TextField
                label="Text Color"
                value={formState.textColor}
                onChange={(value) =>
                  setFormState((s) => ({ ...s, textColor: value }))
                }
                autoComplete="off"
              />
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
