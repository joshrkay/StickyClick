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
      });
      expect(result.upsellEnabled).toBe(true);
      expect(result.quickBuyEnabled).toBe(true);
      expect(result.showCartSummary).toBe(true);
      expect(result.enableQuantitySelector).toBe(true);
      expect(result.openCartDrawer).toBe(true);
      expect(result.showFreeShippingBar).toBe(true);
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
});
