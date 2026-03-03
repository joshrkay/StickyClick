import { describe, it, expect, beforeEach } from "vitest";
import { toggleSticky } from "./helpers";

describe("toggleSticky", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.className = "sticky-click-hidden";
  });

  it("adds sticky-click-visible and removes sticky-click-hidden when show=true", () => {
    toggleSticky(container, true);
    expect(container.classList.contains("sticky-click-visible")).toBe(true);
    expect(container.classList.contains("sticky-click-hidden")).toBe(false);
  });

  it("adds sticky-click-hidden and removes sticky-click-visible when show=false", () => {
    toggleSticky(container, true);
    toggleSticky(container, false);
    expect(container.classList.contains("sticky-click-hidden")).toBe(true);
    expect(container.classList.contains("sticky-click-visible")).toBe(false);
  });

  it("is idempotent on repeated calls with same value", () => {
    toggleSticky(container, true);
    toggleSticky(container, true);
    expect(container.className).toBe("sticky-click-visible");
  });
});
