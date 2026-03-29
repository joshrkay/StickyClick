import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return new Response(JSON.stringify({ variant: null, config: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const activeTest = await prisma.aBTest.findFirst({
      where: { shop, status: "running" },
      orderBy: { createdAt: "desc" },
    });

    if (!activeTest) {
      return new Response(JSON.stringify({ variant: null, config: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return both variant configs so the client can choose based on its
    // persisted cookie, ensuring a stable assignment across page loads.
    let variantAConfig;
    let variantBConfig;
    try {
      variantAConfig = JSON.parse(activeTest.variantAConfig);
      variantBConfig = JSON.parse(activeTest.variantBConfig);
    } catch {
      return new Response(JSON.stringify({ variant: null, config: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        testId: activeTest.id,
        variantAConfig,
        variantBConfig,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch A/B test config:", error);
    return new Response(JSON.stringify({ variant: null, config: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
