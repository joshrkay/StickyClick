import type { ActionFunctionArgs } from "react-router";

/**
 * Analytics are ingested only via the App Proxy (signed by Shopify).
 * @see routes/apps.proxy.api.events.ts — storefront URL /apps/stickyclick/api/events
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  return new Response(
    "This endpoint is disabled. Use the App Proxy path configured for StickyClick analytics.",
    { status: 410 },
  );
};
