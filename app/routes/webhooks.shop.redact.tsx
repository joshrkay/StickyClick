import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { deleteShopPersistedData } from "../shop-data.server";

/**
 * Mandatory GDPR: erase shop data after the retention window post-uninstall.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await authenticate.webhook(request);
  await deleteShopPersistedData(shop);
  return new Response();
};
