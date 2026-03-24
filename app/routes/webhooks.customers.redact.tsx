import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * Mandatory GDPR: delete customer personal data. Our analytics rows are shop-scoped only (no customer id).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.webhook(request);
  return new Response();
};
