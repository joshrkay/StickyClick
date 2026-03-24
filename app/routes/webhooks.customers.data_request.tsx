import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * Mandatory GDPR: customer requests a copy of their data.
 * StickyClick does not store customer-identifying records (only shop-scoped analytics with variant IDs).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.webhook(request);
  return new Response();
};
