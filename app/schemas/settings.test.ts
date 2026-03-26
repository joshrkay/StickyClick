import { describe, it, expect } from "vitest";
import { SettingsSchema } from "./settings";

const validInput = {
  enabled: "true",
  primaryColor: "#FF0000",
  textColor: "#FFFFFF",
  buttonText: "Add to Cart",
  position: "BOTTOM_RIGHT" as const,
  upsellEnabled: "false",
  upsellProductId: null,
  quickBuyEnabled: "false",
  showCartSummary: "false",
  enableQuantitySelector: "false",
  openCartDrawer: "false",
  showFreeShippingBar: "false",
  freeShippingGoal: "5000",
  countdownEnabled: "false",
  countdownEndTime: "",
  countdownDuration: "0",
  countdownText: "Offer ends in",
  trustBadgesEnabled: "false",
  trustBadgesList: "secure_checkout,money_back",
  trustBadgesStyle: "icon_text" as const,
  analyticsEnabled: "false",
  lowStockEnabled: "false",
  lowStockThreshold: "10",
  showDiscountBadge: "false",
  smartUpsellEnabled: "false",
  smartUpsellStrategy: "same_collection" as const,
  multiCurrencyEnabled: "false",
};

describe("SettingsSchema", () => {
  describe("boolean transforms", () => {
    it("transforms 'true' to boolean true", () => {
      const result = SettingsSchema.parse({ ...validInput, enabled: "true" });
      expect(result.enabled).toBe(true);
    });

    it("transforms 'false' to boolean false", () => {
      const result = SettingsSchema.parse({ ...validInput, enabled: "false" });
      expect(result.enabled).toBe(false);
    });

    it("transforms non-'true' string to false", () => {
      const result = SettingsSchema.parse({ ...validInput, enabled: "anything" });
      expect(result.enabled).toBe(false);
    });

    it("transforms all boolean fields consistently", () => {
      const result = SettingsSchema.parse({
        ...validInput,
        upsellEnabled: "true",
        quickBuyEnabled: "true",
        showCartSummary: "true",
        enableQuantitySelector: "true",
        openCartDrawer: "true",
        showFreeShippingBar: "true",
        countdownEnabled: "true",
        trustBadgesEnabled: "true",
        analyticsEnabled: "true",
      });
      expect(result.upsellEnabled).toBe(true);
      expect(result.quickBuyEnabled).toBe(true);
      expect(result.showCartSummary).toBe(true);
      expect(result.enableQuantitySelector).toBe(true);
      expect(result.openCartDrawer).toBe(true);
      expect(result.showFreeShippingBar).toBe(true);
      expect(result.countdownEnabled).toBe(true);
      expect(result.trustBadgesEnabled).toBe(true);
      expect(result.analyticsEnabled).toBe(true);
    });
  });

  describe("hex color validation", () => {
    it("accepts valid 6-digit hex color", () => {
      const result = SettingsSchema.parse({ ...validInput, primaryColor: "#aAbBcC" });
      expect(result.primaryColor).toBe("#aAbBcC");
    });

    it("rejects hex color without hash", () => {
      const result = SettingsSchema.safeParse({ ...validInput, primaryColor: "FF0000" });
      expect(result.success).toBe(false);
    });

    it("rejects 3-character hex color", () => {
      const result = SettingsSchema.safeParse({ ...validInput, primaryColor: "#FFF" });
      expect(result.success).toBe(false);
    });

    it("rejects hex color with invalid characters", () => {
      const result = SettingsSchema.safeParse({ ...validInput, primaryColor: "#GGGGGG" });
      expect(result.success).toBe(false);
    });
  });

  describe("buttonText length", () => {
    it("rejects empty buttonText", () => {
      const result = SettingsSchema.safeParse({ ...validInput, buttonText: "" });
      expect(result.success).toBe(false);
    });

    it("rejects buttonText over 50 characters", () => {
      const result = SettingsSchema.safeParse({ ...validInput, buttonText: "A".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("accepts buttonText at max length (50)", () => {
      const result = SettingsSchema.parse({ ...validInput, buttonText: "A".repeat(50) });
      expect(result.buttonText).toBe("A".repeat(50));
    });
  });

  describe("position enum", () => {
    it("accepts BOTTOM_RIGHT", () => {
      const result = SettingsSchema.parse({ ...validInput, position: "BOTTOM_RIGHT" });
      expect(result.position).toBe("BOTTOM_RIGHT");
    });

    it("accepts BOTTOM_LEFT", () => {
      const result = SettingsSchema.parse({ ...validInput, position: "BOTTOM_LEFT" });
      expect(result.position).toBe("BOTTOM_LEFT");
    });

    it("rejects invalid position", () => {
      const result = SettingsSchema.safeParse({ ...validInput, position: "CENTER" });
      expect(result.success).toBe(false);
    });
  });

  describe("freeShippingGoal", () => {
    it("parses string as integer", () => {
      const result = SettingsSchema.parse({ ...validInput, freeShippingGoal: "7500" });
      expect(result.freeShippingGoal).toBe(7500);
    });

    it("defaults to 5000 on invalid input", () => {
      const result = SettingsSchema.parse({ ...validInput, freeShippingGoal: "abc" });
      expect(result.freeShippingGoal).toBe(5000);
    });
  });

  describe("upsellProductId", () => {
    it("accepts null", () => {
      const result = SettingsSchema.parse({ ...validInput, upsellProductId: null });
      expect(result.upsellProductId).toBeNull();
    });

    it("accepts undefined (optional)", () => {
      const withoutUpsell = Object.fromEntries(
        Object.entries(validInput).filter(([key]) => key !== "upsellProductId"),
      );
      const result = SettingsSchema.parse(withoutUpsell);
      expect(result.upsellProductId).toBeUndefined();
    });

    it("accepts a string value", () => {
      const result = SettingsSchema.parse({ ...validInput, upsellProductId: "1234567890" });
      expect(result.upsellProductId).toBe("1234567890");
    });
  });

  describe("countdownEndTime", () => {
    it("transforms valid ISO date string", () => {
      const result = SettingsSchema.parse({ ...validInput, countdownEndTime: "2026-03-15T23:59:00Z" });
      expect(result.countdownEndTime).toBe("2026-03-15T23:59:00.000Z");
    });

    it("transforms empty string to null", () => {
      const result = SettingsSchema.parse({ ...validInput, countdownEndTime: "" });
      expect(result.countdownEndTime).toBeNull();
    });

    it("transforms invalid date to null", () => {
      const result = SettingsSchema.parse({ ...validInput, countdownEndTime: "not-a-date" });
      expect(result.countdownEndTime).toBeNull();
    });
  });

  describe("countdownDuration", () => {
    it("parses string as integer", () => {
      const result = SettingsSchema.parse({ ...validInput, countdownDuration: "900" });
      expect(result.countdownDuration).toBe(900);
    });

    it("clamps to max 86400", () => {
      const result = SettingsSchema.parse({ ...validInput, countdownDuration: "100000" });
      expect(result.countdownDuration).toBe(86400);
    });

    it("defaults to 0 on invalid input", () => {
      const result = SettingsSchema.parse({ ...validInput, countdownDuration: "abc" });
      expect(result.countdownDuration).toBe(0);
    });
  });

  describe("trustBadgesList", () => {
    it("accepts valid comma-separated badges", () => {
      const result = SettingsSchema.parse({ ...validInput, trustBadgesList: "secure_checkout,free_returns,fast_shipping" });
      expect(result.trustBadgesList).toBe("secure_checkout,free_returns,fast_shipping");
    });

    it("accepts a single badge", () => {
      const result = SettingsSchema.parse({ ...validInput, trustBadgesList: "money_back" });
      expect(result.trustBadgesList).toBe("money_back");
    });

    it("rejects invalid badge names", () => {
      const result = SettingsSchema.safeParse({ ...validInput, trustBadgesList: "invalid_badge" });
      expect(result.success).toBe(false);
    });
  });

  describe("trustBadgesStyle", () => {
    it("accepts icon_text", () => {
      const result = SettingsSchema.parse({ ...validInput, trustBadgesStyle: "icon_text" });
      expect(result.trustBadgesStyle).toBe("icon_text");
    });

    it("accepts icon_only", () => {
      const result = SettingsSchema.parse({ ...validInput, trustBadgesStyle: "icon_only" });
      expect(result.trustBadgesStyle).toBe("icon_only");
    });

    it("rejects invalid style", () => {
      const result = SettingsSchema.safeParse({ ...validInput, trustBadgesStyle: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});
