import { describe, it, expect } from "vitest";
import { sanitizeSettingsForTier } from "./tier-gating";
import type { SettingsOutput } from "../schemas/settings";

const allEnabled: SettingsOutput = {
  enabled: true,
  primaryColor: "#FF0000",
  textColor: "#FFFFFF",
  buttonText: "Buy Now",
  position: "BOTTOM_RIGHT",
  upsellEnabled: true,
  upsellProductId: "12345",
  quickBuyEnabled: true,
  showCartSummary: true,
  showFreeShippingBar: true,
  enableQuantitySelector: true,
  openCartDrawer: true,
  freeShippingGoal: 5000,
  countdownEnabled: true,
  countdownEndTime: null,
  countdownDuration: 900,
  countdownText: "Hurry!",
  trustBadgesEnabled: true,
  trustBadgesList: "secure_checkout,money_back",
  trustBadgesStyle: "icon_text",
  analyticsEnabled: true,
  lowStockEnabled: true,
  lowStockThreshold: 10,
  showDiscountBadge: true,
  smartUpsellEnabled: true,
  smartUpsellStrategy: "same_collection",
  multiCurrencyEnabled: true,
};

describe("sanitizeSettingsForTier", () => {
  describe("basic tier", () => {
    it("disables all Pro features", () => {
      const result = sanitizeSettingsForTier("basic", allEnabled);
      expect(result.upsellEnabled).toBe(false);
      expect(result.quickBuyEnabled).toBe(false);
      expect(result.showCartSummary).toBe(false);
      expect(result.showFreeShippingBar).toBe(false);
      expect(result.countdownEnabled).toBe(false);
      expect(result.trustBadgesEnabled).toBe(false);
      expect(result.lowStockEnabled).toBe(false);
      expect(result.showDiscountBadge).toBe(false);
      expect(result.multiCurrencyEnabled).toBe(false);
    });

    it("disables all Premium features", () => {
      const result = sanitizeSettingsForTier("basic", allEnabled);
      expect(result.enableQuantitySelector).toBe(false);
      expect(result.openCartDrawer).toBe(false);
      expect(result.analyticsEnabled).toBe(false);
      expect(result.smartUpsellEnabled).toBe(false);
    });

    it("preserves core fields", () => {
      const result = sanitizeSettingsForTier("basic", allEnabled);
      expect(result.enabled).toBe(true);
      expect(result.primaryColor).toBe("#FF0000");
      expect(result.textColor).toBe("#FFFFFF");
      expect(result.buttonText).toBe("Buy Now");
      expect(result.position).toBe("BOTTOM_RIGHT");
      expect(result.freeShippingGoal).toBe(5000);
    });
  });

  describe("pro tier", () => {
    it("preserves Pro features", () => {
      const result = sanitizeSettingsForTier("pro", allEnabled);
      expect(result.upsellEnabled).toBe(true);
      expect(result.quickBuyEnabled).toBe(true);
      expect(result.showCartSummary).toBe(true);
      expect(result.showFreeShippingBar).toBe(true);
      expect(result.countdownEnabled).toBe(true);
      expect(result.trustBadgesEnabled).toBe(true);
      expect(result.lowStockEnabled).toBe(true);
      expect(result.showDiscountBadge).toBe(true);
      expect(result.multiCurrencyEnabled).toBe(true);
    });

    it("disables Premium features", () => {
      const result = sanitizeSettingsForTier("pro", allEnabled);
      expect(result.enableQuantitySelector).toBe(false);
      expect(result.openCartDrawer).toBe(false);
      expect(result.analyticsEnabled).toBe(false);
      expect(result.smartUpsellEnabled).toBe(false);
    });
  });

  describe("premium tier", () => {
    it("preserves all features", () => {
      const result = sanitizeSettingsForTier("premium", allEnabled);
      expect(result.upsellEnabled).toBe(true);
      expect(result.quickBuyEnabled).toBe(true);
      expect(result.showCartSummary).toBe(true);
      expect(result.showFreeShippingBar).toBe(true);
      expect(result.enableQuantitySelector).toBe(true);
      expect(result.openCartDrawer).toBe(true);
      expect(result.countdownEnabled).toBe(true);
      expect(result.trustBadgesEnabled).toBe(true);
      expect(result.analyticsEnabled).toBe(true);
      expect(result.lowStockEnabled).toBe(true);
      expect(result.showDiscountBadge).toBe(true);
      expect(result.smartUpsellEnabled).toBe(true);
      expect(result.multiCurrencyEnabled).toBe(true);
    });
  });

  it("does not mutate the input object", () => {
    const input = { ...allEnabled };
    sanitizeSettingsForTier("basic", input);
    expect(input.upsellEnabled).toBe(true);
    expect(input.enableQuantitySelector).toBe(true);
    expect(input.countdownEnabled).toBe(true);
    expect(input.analyticsEnabled).toBe(true);
  });
});
