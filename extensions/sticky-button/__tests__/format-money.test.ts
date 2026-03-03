import { describe, it, expect } from "vitest";
import { formatMoney } from "./helpers";

describe("formatMoney", () => {
  it("converts 5000 cents to $50.00", () => {
    const result = formatMoney(5000, "USD");
    expect(result).toContain("50.00");
  });

  it("handles zero cents", () => {
    const result = formatMoney(0, "USD");
    expect(result).toContain("0.00");
  });

  it("handles 199 cents as $1.99", () => {
    const result = formatMoney(199, "USD");
    expect(result).toContain("1.99");
  });

  it("falls back to $X.XX on invalid currency code", () => {
    const result = formatMoney(5000, "INVALID");
    expect(result).toBe("$50.00");
  });

  it("handles null cents as $0.00", () => {
    const result = formatMoney(null, "USD");
    expect(result).toContain("0.00");
  });

  it("handles undefined cents as $0.00", () => {
    const result = formatMoney(undefined, "USD");
    expect(result).toContain("0.00");
  });
});
