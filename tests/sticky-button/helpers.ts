/**
 * Test-only copies of pure functions from sticky-button.js.
 * These replicate the exact algorithms from the runtime code
 * so they can be imported in vitest without modifying the extension.
 *
 * Keep in sync with: extensions/sticky-button/assets/sticky-button.js
 */

export function formatMoney(
  cents: number | null | undefined,
  currencyCode?: string,
): string {
  const amount = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency:
        currencyCode || "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function clampQuantity(nextQty: unknown): number {
  return Math.max(1, Math.min(99, Number(nextQty) || 1));
}

export function buildCartItems(opts: {
  mainVariantId: string;
  quantity: number;
  enableQuantitySelector: boolean;
  upsellEnabled: boolean;
  upsellVariantId: string;
  upsellChecked: boolean;
}): Array<{ id: number; quantity: number }> {
  const items = [
    {
      id: Number(opts.mainVariantId),
      quantity: opts.enableQuantitySelector ? opts.quantity : 1,
    },
  ];
  if (opts.upsellEnabled && opts.upsellVariantId && opts.upsellChecked) {
    items.push({ id: Number(opts.upsellVariantId), quantity: 1 });
  }
  return items;
}

/**
 * Replicate toggleSticky logic from sticky-button.js:170-178
 */
export function toggleSticky(container: HTMLElement, show: boolean): void {
  if (show) {
    container.classList.remove("sticky-click-hidden");
    container.classList.add("sticky-click-visible");
  } else {
    container.classList.add("sticky-click-hidden");
    container.classList.remove("sticky-click-visible");
  }
}

/**
 * Replicate openCartDrawer logic from sticky-button.js:101-124
 */
export function openCartDrawer(): boolean {
  const drawerSelectors = [
    "cart-drawer",
    "cart-notification",
    "[data-cart-drawer]",
    "#CartDrawer",
    ".cart-drawer",
  ];

  const drawer = drawerSelectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean);

  if (!drawer) {
    document.dispatchEvent(new CustomEvent("cart:open"));
    document.dispatchEvent(new CustomEvent("cart-drawer:open"));
    return false;
  }

  drawer.classList.add("is-open", "active");
  drawer.setAttribute("open", "true");
  drawer.dispatchEvent(new CustomEvent("cart:open"));
  return true;
}
