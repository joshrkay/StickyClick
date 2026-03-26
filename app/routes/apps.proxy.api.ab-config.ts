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

    // Accept a preferred variant from the client (persisted in localStorage)
    const preferredVariant = url.searchParams.get("v");
    const variant =
      preferredVariant === "A" || preferredVariant === "B"
        ? preferredVariant
        : Math.random() < 0.5
          ? "A"
          : "B";

    const config =
      variant === "A"
        ? JSON.parse(activeTest.variantAConfig)
        : JSON.parse(activeTest.variantBConfig);

    return new Response(
      JSON.stringify({ variant, testId: activeTest.id, config }),
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
