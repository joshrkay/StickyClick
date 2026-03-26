import { useEffect, useState, useCallback, type FormEvent } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  TextField,
  Select,
  Banner,
  DataTable,
  Badge,
  InlineStack,
  Box,
  FormLayout,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getFeatureTier } from "../billing.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tier = await getFeatureTier(request);

  if (tier !== "premium") {
    return { tier, tests: [], testStats: null };
  }

  const tests = await prisma.aBTest.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get stats for the running test
  const runningTest = tests.find((t) => t.status === "running");
  let testStats = null;

  if (runningTest) {
    const since = runningTest.startDate || runningTest.createdAt;
    const [variantACounts, variantBCounts] = await Promise.all([
      prisma.stickyClickEvent.groupBy({
        by: ["eventType"],
        where: {
          shop: session.shop,
          testVariant: "A",
          createdAt: { gte: since },
        },
        _count: true,
        _sum: { value: true },
      }),
      prisma.stickyClickEvent.groupBy({
        by: ["eventType"],
        where: {
          shop: session.shop,
          testVariant: "B",
          createdAt: { gte: since },
        },
        _count: true,
        _sum: { value: true },
      }),
    ]);

    const getStats = (counts: typeof variantACounts) => ({
      impressions:
        counts.find((c) => c.eventType === "impression")?._count ?? 0,
      clicks: counts.find((c) => c.eventType === "click")?._count ?? 0,
      addToCarts:
        counts.find((c) => c.eventType === "add_to_cart")?._count ?? 0,
      revenue:
        (
          (counts.find((c) => c.eventType === "add_to_cart")?._sum?.value ??
            0) / 100
        ).toFixed(2),
    });

    testStats = {
      testId: runningTest.id,
      testName: runningTest.name,
      variantA: getStats(variantACounts),
      variantB: getStats(variantBCounts),
    };
  }

  return { tier, tests: tests.map(serializeTest), testStats };
};

function serializeTest(test: {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  startDate: Date | null;
  endDate: Date | null;
}) {
  return {
    id: test.id,
    name: test.name,
    status: test.status,
    createdAt: test.createdAt.toISOString(),
    startDate: test.startDate?.toISOString() ?? null,
    endDate: test.endDate?.toISOString() ?? null,
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tier = await getFeatureTier(request);

  if (tier !== "premium") {
    return { status: "error", message: "Premium plan required" };
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = String(formData.get("name") || "").trim();
    if (!name || name.length > 100) {
      return { status: "error", message: "Test name is required (max 100 chars)" };
    }

    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const validPositions = ["BOTTOM_RIGHT", "BOTTOM_LEFT"];

    const parseVariantConfig = (prefix: string) => {
      const color = String(formData.get(`${prefix}_primaryColor`) || "#000000");
      const text = String(formData.get(`${prefix}_textColor`) || "#FFFFFF");
      const btnText = String(formData.get(`${prefix}_buttonText`) || "Add to Cart").slice(0, 50);
      const pos = String(formData.get(`${prefix}_position`) || "BOTTOM_RIGHT");

      if (!hexColorRegex.test(color) || !hexColorRegex.test(text)) {
        return null;
      }
      if (!validPositions.includes(pos)) {
        return null;
      }

      return JSON.stringify({
        primaryColor: color,
        textColor: text,
        buttonText: btnText,
        position: pos,
      });
    };

    const variantAConfig = parseVariantConfig("variantA");
    const variantBConfig = parseVariantConfig("variantB");

    if (!variantAConfig || !variantBConfig) {
      return { status: "error", message: "Invalid color format or position value" };
    }

    await prisma.aBTest.create({
      data: {
        shop: session.shop,
        name,
        variantAConfig,
        variantBConfig,
        status: "draft",
      },
    });

    return { status: "success", message: "Test created" };
  }

  if (intent === "start") {
    const testId = Number(formData.get("testId"));

    // Verify the test belongs to this shop
    const test = await prisma.aBTest.findFirst({
      where: { id: testId, shop: session.shop },
    });
    if (!test) {
      return { status: "error", message: "Test not found" };
    }

    // Stop any currently running tests
    await prisma.aBTest.updateMany({
      where: { shop: session.shop, status: "running" },
      data: { status: "completed", endDate: new Date() },
    });

    await prisma.aBTest.update({
      where: { id: testId },
      data: { status: "running", startDate: new Date() },
    });

    return { status: "success", message: "Test started" };
  }

  if (intent === "stop") {
    const testId = Number(formData.get("testId"));

    // Verify the test belongs to this shop
    const test = await prisma.aBTest.findFirst({
      where: { id: testId, shop: session.shop },
    });
    if (!test) {
      return { status: "error", message: "Test not found" };
    }

    await prisma.aBTest.update({
      where: { id: testId },
      data: { status: "completed", endDate: new Date() },
    });

    return { status: "success", message: "Test stopped" };
  }

  return { status: "error", message: "Unknown action" };
};

export default function ABTesting() {
  const { tier, tests, testStats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isLoading =
    fetcher.state === "submitting" || fetcher.state === "loading";

  const [form, setForm] = useState({
    name: "",
    variantA_primaryColor: "#000000",
    variantA_textColor: "#FFFFFF",
    variantA_buttonText: "Add to Cart",
    variantA_position: "BOTTOM_RIGHT",
    variantB_primaryColor: "#1d4ed8",
    variantB_textColor: "#FFFFFF",
    variantB_buttonText: "Buy Now",
    variantB_position: "BOTTOM_RIGHT",
  });

  const update = useCallback(
    (field: string) => (value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  useEffect(() => {
    if (fetcher.data?.status === "success") {
      shopify.toast.show(fetcher.data.message || "Done");
    }
    if (fetcher.data?.status === "error") {
      shopify.toast.show(fetcher.data.message || "Error", { isError: true });
    }
  }, [fetcher.data, shopify]);

  if (tier !== "premium") {
    return (
      <Page>
        <TitleBar title="A/B Testing" />
        <Banner tone="warning">
          A/B Testing is available on the Premium plan. Upgrade to optimize your
          button configuration.
        </Banner>
      </Page>
    );
  }

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    fetcher.submit(formEl);
  };

  return (
    <Page>
      <TitleBar title="A/B Testing" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            {testStats && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Running: {testStats.testName}
                  </Text>
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric"]}
                    headings={["Metric", "Variant A", "Variant B"]}
                    rows={[
                      [
                        "Impressions",
                        String(testStats.variantA.impressions),
                        String(testStats.variantB.impressions),
                      ],
                      [
                        "Clicks",
                        String(testStats.variantA.clicks),
                        String(testStats.variantB.clicks),
                      ],
                      [
                        "Add to Carts",
                        String(testStats.variantA.addToCarts),
                        String(testStats.variantB.addToCarts),
                      ],
                      [
                        "Revenue",
                        `$${testStats.variantA.revenue}`,
                        `$${testStats.variantB.revenue}`,
                      ],
                    ]}
                  />
                </BlockStack>
              </Card>
            )}

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Create New A/B Test
                </Text>
                <fetcher.Form method="post" onSubmit={handleCreate}>
                  <input type="hidden" name="intent" value="create" />
                  <FormLayout>
                    <TextField
                      label="Test Name"
                      name="name"
                      value={form.name}
                      onChange={update("name")}
                      autoComplete="off"
                    />

                    <Text as="h3" variant="headingSm">
                      Variant A
                    </Text>
                    <FormLayout.Group>
                      <TextField
                        label="Primary Color"
                        name="variantA_primaryColor"
                        value={form.variantA_primaryColor}
                        onChange={update("variantA_primaryColor")}
                        autoComplete="off"
                      />
                      <TextField
                        label="Text Color"
                        name="variantA_textColor"
                        value={form.variantA_textColor}
                        onChange={update("variantA_textColor")}
                        autoComplete="off"
                      />
                    </FormLayout.Group>
                    <TextField
                      label="Button Text"
                      name="variantA_buttonText"
                      value={form.variantA_buttonText}
                      onChange={update("variantA_buttonText")}
                      autoComplete="off"
                    />
                    <Select
                      label="Position"
                      name="variantA_position"
                      options={[
                        { label: "Bottom Right", value: "BOTTOM_RIGHT" },
                        { label: "Bottom Left", value: "BOTTOM_LEFT" },
                      ]}
                      value={form.variantA_position}
                      onChange={update("variantA_position")}
                    />

                    <Text as="h3" variant="headingSm">
                      Variant B
                    </Text>
                    <FormLayout.Group>
                      <TextField
                        label="Primary Color"
                        name="variantB_primaryColor"
                        value={form.variantB_primaryColor}
                        onChange={update("variantB_primaryColor")}
                        autoComplete="off"
                      />
                      <TextField
                        label="Text Color"
                        name="variantB_textColor"
                        value={form.variantB_textColor}
                        onChange={update("variantB_textColor")}
                        autoComplete="off"
                      />
                    </FormLayout.Group>
                    <TextField
                      label="Button Text"
                      name="variantB_buttonText"
                      value={form.variantB_buttonText}
                      onChange={update("variantB_buttonText")}
                      autoComplete="off"
                    />
                    <Select
                      label="Position"
                      name="variantB_position"
                      options={[
                        { label: "Bottom Right", value: "BOTTOM_RIGHT" },
                        { label: "Bottom Left", value: "BOTTOM_LEFT" },
                      ]}
                      value={form.variantB_position}
                      onChange={update("variantB_position")}
                    />

                    <Button submit variant="primary" loading={isLoading}>
                      Create Test
                    </Button>
                  </FormLayout>
                </fetcher.Form>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  All Tests
                </Text>
                {tests.length === 0 ? (
                  <Text as="p" tone="subdued">
                    No tests yet. Create one above.
                  </Text>
                ) : (
                  <BlockStack gap="300">
                    {tests.map(
                      (test: {
                        id: number;
                        name: string;
                        status: string;
                        createdAt: string;
                      }) => (
                        <InlineStack
                          key={test.id}
                          align="space-between"
                          blockAlign="center"
                        >
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="span" fontWeight="semibold">
                              {test.name}
                            </Text>
                            <Badge
                              tone={
                                test.status === "running"
                                  ? "success"
                                  : test.status === "draft"
                                    ? "info"
                                    : undefined
                              }
                            >
                              {test.status}
                            </Badge>
                          </InlineStack>
                          <Box>
                            {test.status === "draft" && (
                              <fetcher.Form method="post">
                                <input
                                  type="hidden"
                                  name="intent"
                                  value="start"
                                />
                                <input
                                  type="hidden"
                                  name="testId"
                                  value={String(test.id)}
                                />
                                <Button submit size="slim">
                                  Start
                                </Button>
                              </fetcher.Form>
                            )}
                            {test.status === "running" && (
                              <fetcher.Form method="post">
                                <input
                                  type="hidden"
                                  name="intent"
                                  value="stop"
                                />
                                <input
                                  type="hidden"
                                  name="testId"
                                  value={String(test.id)}
                                />
                                <Button submit size="slim" tone="critical">
                                  Stop
                                </Button>
                              </fetcher.Form>
                            )}
                          </Box>
                        </InlineStack>
                      ),
                    )}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
