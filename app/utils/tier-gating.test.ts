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
};

describe("sanitizeSettingsForTier", () => {
  describe("basic tier", () => {
    it("disables all Pro features", () => {
      const result = sanitizeSettingsForTier("basic", allEnabled);
      expect(result.upsellEnabled).toBe(false);
      expect(result.quickBuyEnabled).toBe(false);
      expect(result.showCartSummary).toBe(false);
      expect(result.showFreeShippingBar).toBe(false);
    });

    it("disables all Premium features", () => {
      const result = sanitizeSettingsForTier("basic", allEnabled);
      expect(result.enableQuantitySelector).toBe(false);
      expect(result.openCartDrawer).toBe(false);
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
    });

    it("disables Premium features", () => {
      const result = sanitizeSettingsForTier("pro", allEnabled);
      expect(result.enableQuantitySelector).toBe(false);
      expect(result.openCartDrawer).toBe(false);
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
    });
  });

  it("does not mutate the input object", () => {
    const input = { ...allEnabled };
    sanitizeSettingsForTier("basic", input);
    expect(input.upsellEnabled).toBe(true);
    expect(input.enableQuantitySelector).toBe(true);
  });
});
