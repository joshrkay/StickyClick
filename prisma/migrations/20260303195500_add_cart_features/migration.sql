-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "showCartSummary" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ShopSettings" ADD COLUMN     "enableQuantitySelector" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ShopSettings" ADD COLUMN     "openCartDrawer" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ShopSettings" ADD COLUMN     "showFreeShippingBar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ShopSettings" ADD COLUMN     "freeShippingGoal" INTEGER NOT NULL DEFAULT 5000;
