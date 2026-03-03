import { describe, it, expect, beforeEach, vi } from "vitest";
import { openCartDrawer } from "./helpers";

describe("openCartDrawer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns false when no drawer element exists", () => {
    expect(openCartDrawer()).toBe(false);
  });

  it("dispatches cart:open event on document when no drawer found", () => {
    const spy = vi.fn();
    document.addEventListener("cart:open", spy);
    openCartDrawer();
    expect(spy).toHaveBeenCalled();
    document.removeEventListener("cart:open", spy);
  });

  it("returns true when cart-drawer element exists", () => {
    document.body.innerHTML = "<cart-drawer></cart-drawer>";
    expect(openCartDrawer()).toBe(true);
  });

  it("adds is-open and active classes and sets open attribute", () => {
    document.body.innerHTML = '<div id="CartDrawer"></div>';
    openCartDrawer();
    const drawer = document.getElementById("CartDrawer")!;
    expect(drawer.classList.contains("is-open")).toBe(true);
    expect(drawer.classList.contains("active")).toBe(true);
    expect(drawer.getAttribute("open")).toBe("true");
  });
});
