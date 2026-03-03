import { describe, it, expect, beforeEach } from "vitest";
import { formatMoney } from "./helpers";

describe("refreshCartSummary logic", () => {
  let cartCountEl: HTMLElement;
  let cartSubtotalEl: HTMLElement;
  let shippingContainer: HTMLElement;
  let shippingText: HTMLElement;
  let shippingProgress: HTMLElement;

  function setupDOM() {
    document.body.innerHTML = `
      <span id="sticky-cart-count">0 items</span>
      <span id="sticky-cart-subtotal">$0.00</span>
      <div id="sticky-shipping-bar-container" style="display:none">
        <p id="sticky-shipping-text"></p>
        <div id="sticky-shipping-progress-fill" style="width:0%"></div>
      </div>
    `;
    cartCountEl = document.getElementById("sticky-cart-count")!;
    cartSubtotalEl = document.getElementById("sticky-cart-subtotal")!;
    shippingContainer = document.getElementById("sticky-shipping-bar-container")!;
    shippingText = document.getElementById("sticky-shipping-text")!;
    shippingProgress = document.getElementById("sticky-shipping-progress-fill")!;
  }

  /**
   * Replicate refreshCartSummary DOM update logic from sticky-button.js:126-156.
   * Only the DOM update portion — fetch is excluded since we pass cart data directly.
   */
  function updateCartSummary(
    showCartSummary: boolean,
    showFreeShippingBar: boolean,
    freeShippingGoal: number,
    cart: { item_count: number; total_price: number; currency: string },
  ) {
    if (!showCartSummary && !showFreeShippingBar) return;

    if (showCartSummary && cartCountEl && cartSubtotalEl) {
      cartCountEl.textContent = `${cart.item_count || 0} item${cart.item_count === 1 ? "" : "s"}`;
      cartSubtotalEl.textContent = formatMoney(cart.total_price || 0, cart.currency);
    }

    if (showFreeShippingBar && shippingContainer && shippingText && shippingProgress) {
      const total = cart.total_price || 0;
      const remaining = freeShippingGoal - total;
      const percent = Math.min(100, (total / freeShippingGoal) * 100);

      shippingContainer.style.display = "block";
      shippingProgress.style.width = `${percent}%`;

      if (remaining <= 0) {
        shippingText.innerHTML = "<strong>You unlocked Free Shipping!</strong>";
      } else {
        shippingText.innerHTML = `Add <strong>${formatMoney(remaining, cart.currency)}</strong> for Free Shipping`;
      }
    }
  }

  beforeEach(() => {
    setupDOM();
  });

  it("shows singular 'item' for 1 item", () => {
    updateCartSummary(true, false, 5000, { item_count: 1, total_price: 2500, currency: "USD" });
    expect(cartCountEl.textContent).toBe("1 item");
  });

  it("shows plural 'items' for multiple items", () => {
    updateCartSummary(true, false, 5000, { item_count: 3, total_price: 7500, currency: "USD" });
    expect(cartCountEl.textContent).toBe("3 items");
  });

  it("formats subtotal with currency", () => {
    updateCartSummary(true, false, 5000, { item_count: 1, total_price: 2500, currency: "USD" });
    expect(cartSubtotalEl.textContent).toContain("25.00");
  });

  it("calculates shipping progress percentage correctly", () => {
    updateCartSummary(false, true, 10000, { item_count: 1, total_price: 5000, currency: "USD" });
    expect(shippingProgress.style.width).toBe("50%");
  });

  it("caps shipping progress at 100%", () => {
    updateCartSummary(false, true, 5000, { item_count: 2, total_price: 7000, currency: "USD" });
    expect(shippingProgress.style.width).toBe("100%");
  });

  it("shows unlock message when shipping goal is met", () => {
    updateCartSummary(false, true, 5000, { item_count: 2, total_price: 5000, currency: "USD" });
    expect(shippingText.innerHTML).toContain("You unlocked Free Shipping!");
  });

  it("shows remaining amount when below goal", () => {
    updateCartSummary(false, true, 5000, { item_count: 1, total_price: 2000, currency: "USD" });
    expect(shippingText.innerHTML).toContain("for Free Shipping");
    expect(shippingText.innerHTML).toContain("30.00");
  });

  it("does nothing when both features are disabled", () => {
    updateCartSummary(false, false, 5000, { item_count: 5, total_price: 10000, currency: "USD" });
    expect(cartCountEl.textContent).toBe("0 items");
    expect(shippingContainer.style.display).toBe("none");
  });
});
