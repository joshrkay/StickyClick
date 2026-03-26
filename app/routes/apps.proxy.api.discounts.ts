import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.public.appProxy(request);

  if (!admin || !session?.shop) {
    return new Response(JSON.stringify({ discounts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const settings = await prisma.shopSettings.findUnique({
    where: { shop: session.shop },
    select: { showDiscountBadge: true },
  });

  if (!settings?.showDiscountBadge) {
    return new Response(JSON.stringify({ discounts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const graphqlResponse = await admin.graphql(
      `#graphql
        query StickyClickActiveDiscounts {
          automaticDiscountNodes(first: 5, query: "status:active") {
            nodes {
              automaticDiscount {
                ... on DiscountAutomaticBasic {
                  title
                  summary
                  status
                }
                ... on DiscountAutomaticBxgy {
                  title
                  summary
                  status
                }
                ... on DiscountAutomaticFreeShipping {
                  title
                  summary
                  status
                }
              }
            }
          }
        }`,
    );

    const json = await graphqlResponse.json();
    const nodes = json.data?.automaticDiscountNodes?.nodes || [];
    const discounts = nodes
      .map((n: { automaticDiscount: { title?: string; summary?: string } }) => ({
        title: n.automaticDiscount?.title || "",
        summary: n.automaticDiscount?.summary || "",
      }))
      .filter((d: { title: string }) => d.title);

    return new Response(JSON.stringify({ discounts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch automatic discounts:", error);
    return new Response(JSON.stringify({ discounts: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
