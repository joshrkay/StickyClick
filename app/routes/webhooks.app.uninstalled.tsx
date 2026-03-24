import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { deleteShopPersistedData } from "../shop-data.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, admin } = await authenticate.webhook(request);

  await deleteShopPersistedData(shop);

  if (session && admin) {
    try {
      const shopRes = await admin.graphql(`#graphql { shop { id } }`);
      const shopJson = await shopRes.json();
      const ownerId = shopJson.data?.shop?.id as string | undefined;
      if (ownerId) {
        await admin.graphql(
          `#graphql
            mutation StickyClickMetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
              metafieldsDelete(metafields: $metafields) {
                userErrors { field message }
              }
            }`,
          {
            variables: {
              metafields: [
                {
                  ownerId,
                  namespace: "stickyclick",
                  key: "settings",
                },
              ],
            },
          },
        );
      }
    } catch {
      // Best-effort cleanup; shop data is already removed from our DB.
    }
  }

  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response();
};
