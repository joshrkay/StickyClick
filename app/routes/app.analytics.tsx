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
import { useI18n } from "../i18n";

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
  const { t } = useI18n();

  if (tier !== "premium") {
    return (
      <Page>
        <TitleBar title={t("analytics.title")} />
        <Banner tone="warning">
          {t("analytics.premiumBanner")}
        </Banner>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title={t("analytics.title")} />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">{t("analytics.performance")}</Text>
                  <Box width="150px">
                    <Select
                      label=""
                      labelHidden
                      options={[
                        { label: t("analytics.last7days"), value: "7" },
                        { label: t("analytics.last14days"), value: "14" },
                        { label: t("analytics.last30days"), value: "30" },
                      ]}
                      value={days}
                      onChange={(val) => setSearchParams({ days: val })}
                    />
                  </Box>
                </InlineStack>

                {stats && (
                  <DataTable
                    columnContentTypes={["text", "numeric"]}
                    headings={[t("analytics.metric"), t("analytics.value")]}
                    rows={[
                      [t("analytics.impressions"), String(stats.impressions)],
                      [t("analytics.buttonClicks"), String(stats.clicks)],
                      [t("analytics.addToCarts"), String(stats.addToCarts)],
                      [t("analytics.ctr"), `${stats.ctr}%`],
                      [t("analytics.conversionRate"), `${stats.conversionRate}%`],
                      [t("analytics.estimatedRevenue"), `$${stats.revenue}`],
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
