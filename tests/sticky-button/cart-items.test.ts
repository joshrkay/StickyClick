import { describe, it, expect } from "vitest";
import { buildCartItems } from "./helpers";

const baseOpts = {
  mainVariantId: "12345",
  quantity: 1,
  enableQuantitySelector: false,
  upsellEnabled: false,
  upsellVariantId: "",
  upsellChecked: false,
};

describe("buildCartItems", () => {
  it("builds single item with quantity 1 when selector is disabled", () => {
    const items = buildCartItems({ ...baseOpts, quantity: 5 });
    expect(items).toEqual([{ id: 12345, quantity: 1 }]);
  });

  it("uses actual quantity when selector is enabled", () => {
    const items = buildCartItems({ ...baseOpts, quantity: 3, enableQuantitySelector: true });
    expect(items).toEqual([{ id: 12345, quantity: 3 }]);
  });

  it("includes upsell when enabled, has variant ID, and checkbox checked", () => {
    const items = buildCartItems({
      ...baseOpts,
      upsellEnabled: true,
      upsellVariantId: "67890",
      upsellChecked: true,
    });
    expect(items).toHaveLength(2);
    expect(items[1]).toEqual({ id: 67890, quantity: 1 });
  });

  it("excludes upsell when checkbox is unchecked", () => {
    const items = buildCartItems({
      ...baseOpts,
      upsellEnabled: true,
      upsellVariantId: "67890",
      upsellChecked: false,
    });
    expect(items).toHaveLength(1);
  });

  it("excludes upsell when variant ID is empty", () => {
    const items = buildCartItems({
      ...baseOpts,
      upsellEnabled: true,
      upsellVariantId: "",
      upsellChecked: true,
    });
    expect(items).toHaveLength(1);
  });

  it("upsell always has quantity 1 regardless of main quantity", () => {
    const items = buildCartItems({
      ...baseOpts,
      quantity: 10,
      enableQuantitySelector: true,
      upsellEnabled: true,
      upsellVariantId: "67890",
      upsellChecked: true,
    });
    expect(items[0].quantity).toBe(10);
    expect(items[1].quantity).toBe(1);
  });
});
