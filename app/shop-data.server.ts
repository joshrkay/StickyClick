import prisma from "./db.server";

/**
 * Deletes all app-persisted rows for a shop (analytics events and settings).
 * Idempotent: safe if rows are already absent.
 */
export async function deleteShopPersistedData(shop: string) {
  await prisma.$transaction([
    prisma.stickyClickEvent.deleteMany({ where: { shop } }),
    prisma.shopSettings.deleteMany({ where: { shop } }),
  ]);
}
