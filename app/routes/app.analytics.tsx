import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  DataTable,
  Select,
  Banner,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getFeatureTier } from "../billing.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tier = await getFeatureTier(request);

  if (tier !== "premium") {
    return { tier, stats: null };
  }

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 7));
  const since = new Date(Date.now() - days * 86400000);

  const counts = await prisma.stickyClickEvent.groupBy({
    by: ["eventType"],
    where: { shop: session.shop, createdAt: { gte: since } },
    _count: true,
    _sum: { value: true },
  });

  const impressions = counts.find((c) => c.eventType === "impression")?._count ?? 0;
  const clicks = counts.find((c) => c.eventType === "click")?._count ?? 0;
  const addToCarts = counts.find((c) => c.eventType === "add_to_cart")?._count ?? 0;
  const revenueSum = counts.find((c) => c.eventType === "add_to_cart")?._sum?.value ?? 0;

  return {
    tier,
    stats: {
      impressions,
      clicks,
      addToCarts,
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0",
      conversionRate: clicks > 0 ? ((addToCarts / clicks) * 100).toFixed(1) : "0.0",
      revenue: (revenueSum / 100).toFixed(2),
      days,
    },
  };
};

export default function Analytics() {
  const { tier, stats } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const days = searchParams.get("days") || "7";

  if (tier !== "premium") {
    return (
      <Page>
        <TitleBar title="Analytics" />
        <Banner tone="warning">
          Analytics is available on the Premium plan. Upgrade to see how your sticky button performs.
        </Banner>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Analytics" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">StickyClick Performance</Text>
                  <Box width="150px">
                    <Select
                      label=""
                      labelHidden
                      options={[
                        { label: "Last 7 days", value: "7" },
                        { label: "Last 14 days", value: "14" },
                        { label: "Last 30 days", value: "30" },
                      ]}
                      value={days}
                      onChange={(val) => setSearchParams({ days: val })}
                    />
                  </Box>
                </InlineStack>

                {stats && (
                  <DataTable
                    columnContentTypes={["text", "numeric"]}
                    headings={["Metric", "Value"]}
                    rows={[
                      ["Impressions (sticky bar shown)", String(stats.impressions)],
                      ["Button Clicks", String(stats.clicks)],
                      ["Add to Carts", String(stats.addToCarts)],
                      ["Click-through Rate", `${stats.ctr}%`],
                      ["Conversion Rate (click → cart)", `${stats.conversionRate}%`],
                      ["Estimated Revenue", `$${stats.revenue}`],
                    ]}
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
