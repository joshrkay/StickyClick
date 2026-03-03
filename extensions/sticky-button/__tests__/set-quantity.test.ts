import { describe, it, expect } from "vitest";
import { clampQuantity } from "./helpers";

describe("clampQuantity", () => {
  it("returns the value when within range", () => {
    expect(clampQuantity(5)).toBe(5);
  });

  it("clamps to 1 when value is 0", () => {
    expect(clampQuantity(0)).toBe(1);
  });

  it("clamps to 1 when value is negative", () => {
    expect(clampQuantity(-5)).toBe(1);
  });

  it("clamps to 99 when value exceeds max", () => {
    expect(clampQuantity(100)).toBe(99);
  });

  it("defaults to 1 for NaN input", () => {
    expect(clampQuantity("abc")).toBe(1);
  });

  it("defaults to 1 for undefined", () => {
    expect(clampQuantity(undefined)).toBe(1);
  });
});
