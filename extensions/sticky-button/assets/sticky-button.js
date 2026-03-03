document.addEventListener('DOMContentLoaded', () => {
  const stickyContainer = document.getElementById('sticky-click-container');
  const stickyButton = document.getElementById('sticky-click-btn');
  if (!stickyContainer || !stickyButton) return;

  let mainVariantId = String(stickyContainer.dataset.mainVariantId || '').replace(/\D/g, '');
  const upsellEnabled = String(stickyContainer.dataset.upsellEnabled || '') === 'true';
  const upsellVariantId = String(stickyContainer.dataset.upsellVariantId || '').replace(/\D/g, '');
  const quickBuyEnabled = String(stickyContainer.dataset.quickBuyEnabled || '') === 'true';
  const showCartSummary = String(stickyContainer.dataset.showCartSummary || '') !== 'false';
  const enableQuantitySelector = String(stickyContainer.dataset.enableQuantitySelector || '') !== 'false';
  const openCartDrawerEnabled = String(stickyContainer.dataset.openCartDrawer || '') !== 'false';
  const upsellCheckbox = document.getElementById('sticky-upsell-checkbox');

  const qtyDecreaseBtn = document.getElementById('sticky-qty-decrease');
  const qtyIncreaseBtn = document.getElementById('sticky-qty-increase');
  const qtyValueEl = document.getElementById('sticky-qty-value');
  const cartCountEl = document.getElementById('sticky-cart-count');
  const cartSubtotalEl = document.getElementById('sticky-cart-subtotal');

  let quantity = 1;

  // Find the native Add to Cart form/button to watch
  const nativeForm = document.querySelector('form[action*="/cart/add"]');
  const nativeButton = nativeForm ? nativeForm.querySelector('[type="submit"]') : null;
  const variantInput = nativeForm ? nativeForm.querySelector('input[name="id"], select[name="id"]') : null;

  // Keep sticky variant in sync with selected product variant
  if (variantInput) {
    const syncVariant = () => {
      const nextValue = String(variantInput.value || '').replace(/\D/g, '');
      if (nextValue) mainVariantId = nextValue;
    };

    variantInput.addEventListener('change', syncVariant);
    syncVariant();
  }

  const setQuantity = (nextQty) => {
    quantity = Math.max(1, Math.min(99, Number(nextQty) || 1));
    if (qtyValueEl) qtyValueEl.textContent = String(quantity);
  };

  if (enableQuantitySelector) {
    qtyDecreaseBtn?.addEventListener('click', () => setQuantity(quantity - 1));
    qtyIncreaseBtn?.addEventListener('click', () => setQuantity(quantity + 1));
  }

  if (!nativeButton) {
    console.warn('StickyClick: Native Add to Cart button not found. Using scroll depth fallback.');
    window.addEventListener('scroll', () => toggleSticky(window.scrollY > 300), { passive: true });
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => toggleSticky(!entry.isIntersecting));
    }, { threshold: 0 });

    observer.observe(nativeButton);
  }

  stickyButton.addEventListener('click', async () => {
    if (!mainVariantId) return;

    const items = [{ id: Number(mainVariantId), quantity: enableQuantitySelector ? quantity : 1 }];
    if (upsellEnabled && upsellVariantId && (!upsellCheckbox || upsellCheckbox.checked)) {
      items.push({ id: Number(upsellVariantId), quantity: 1 });
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      await refreshCartSummary();

      if (quickBuyEnabled) {
        window.location.href = '/checkout';
      } else if (openCartDrawerEnabled) {
        if (!openCartDrawer()) window.location.href = '/cart';
      } else {
        window.location.href = '/cart';
      }
    } catch (error) {
      console.error('StickyClick add-to-cart failed:', error);
      nativeButton?.click();
    }
  });

  function openCartDrawer() {
    const drawerSelectors = [
      'cart-drawer',
      'cart-notification',
      '[data-cart-drawer]',
      '#CartDrawer',
      '.cart-drawer'
    ];

    const drawer = drawerSelectors
      .map((selector) => document.querySelector(selector))
      .find(Boolean);

    if (!drawer) {
      document.dispatchEvent(new CustomEvent('cart:open'));
      document.dispatchEvent(new CustomEvent('cart-drawer:open'));
      return false;
    }

    drawer.classList.add('is-open', 'active');
    drawer.setAttribute('open', 'true');
    drawer.dispatchEvent(new CustomEvent('cart:open'));
    return true;
  }

  async function refreshCartSummary() {
    if (!showCartSummary || !cartCountEl || !cartSubtotalEl) return;

    try {
      const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const cart = await res.json();

      cartCountEl.textContent = `${cart.item_count || 0} item${cart.item_count === 1 ? '' : 's'}`;
      cartSubtotalEl.textContent = formatMoney(cart.total_price || 0, cart.currency);
    } catch (e) {
      console.warn('StickyClick: unable to refresh cart summary', e);
    }
  }

  function formatMoney(cents, currencyCode) {
    const amount = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode || (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD',
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  function toggleSticky(show) {
    if (show) {
      stickyContainer.classList.remove('sticky-click-hidden');
      stickyContainer.classList.add('sticky-click-visible');
    } else {
      stickyContainer.classList.add('sticky-click-hidden');
      stickyContainer.classList.remove('sticky-click-visible');
    }
  }

  setQuantity(1);
  refreshCartSummary();
});
