/* global Shopify */
document.addEventListener('DOMContentLoaded', () => {
  const stickyContainer = document.getElementById('sticky-click-container');
  const stickyButton = document.getElementById('sticky-click-btn');
  if (!stickyContainer || !stickyButton) return;

  let mainVariantId = String(stickyContainer.dataset.mainVariantId || '').replace(/\D/g, '');
  const upsellEnabled = String(stickyContainer.dataset.upsellEnabled || '') === 'true';
  const upsellVariantId = String(stickyContainer.dataset.upsellVariantId || '').replace(/\D/g, '');
  const quickBuyEnabled = String(stickyContainer.dataset.quickBuyEnabled || '') === 'true';
  const showCartSummary = String(stickyContainer.dataset.showCartSummary || '') === 'true';
  const enableQuantitySelector = String(stickyContainer.dataset.enableQuantitySelector || '') === 'true';
  const openCartDrawerEnabled = String(stickyContainer.dataset.openCartDrawer || '') === 'true';

  const showFreeShippingBar = String(stickyContainer.dataset.showFreeShippingBar || '') === 'true';
  const freeShippingGoal = Number(stickyContainer.dataset.freeShippingGoal) || 5000;

  // Countdown timer settings
  const countdownEnabled = String(stickyContainer.dataset.countdownEnabled || '') === 'true';
  const countdownEndTime = stickyContainer.dataset.countdownEndTime || '';
  const countdownDuration = Number(stickyContainer.dataset.countdownDuration) || 0;

  // Trust badges settings
  const trustBadgesEnabled = String(stickyContainer.dataset.trustBadgesEnabled || '') === 'true';
  const trustBadgesStyle = stickyContainer.dataset.trustBadgesStyle || 'icon_text';

  // Low stock settings
  const lowStockEnabled = String(stickyContainer.dataset.lowStockEnabled || '') === 'true';

  // Discount badge setting
  const showDiscountBadge = String(stickyContainer.dataset.showDiscountBadge || '') === 'true';

  // Smart upsell settings
  const smartUpsellEnabled = String(stickyContainer.dataset.smartUpsellEnabled || '') === 'true';

  // Multi-currency settings
  const multiCurrencyEnabled = String(stickyContainer.dataset.multiCurrencyEnabled || '') === 'true';
  const currencyCode = stickyContainer.dataset.currencyCode || '';

  // Analytics settings
  const analyticsEnabled = String(stickyContainer.dataset.analyticsEnabled || '') === 'true';
  const shopDomain = stickyContainer.dataset.shopDomain || (window.Shopify && Shopify.shop) || window.location.hostname;

  // A/B test variant (assigned after fetching config)
  let abTestVariant = null;

  // Translated strings from data attributes (set in Liquid)
  const tFreeShippingUnlocked = stickyContainer.dataset.tFreeShippingUnlocked || 'You unlocked Free Shipping!';
  const tAddForFreeShipping = stickyContainer.dataset.tAddForFreeShipping || 'Add {amount} for Free Shipping';
  const tItem = stickyContainer.dataset.tItem || 'item';
  const tItems = stickyContainer.dataset.tItems || 'items';
  const tBadges = {
    secure_checkout: { icon: '\uD83D\uDD12', text: stickyContainer.dataset.tBadgeSecureCheckout || 'Secure Checkout' },
    money_back: { icon: '\uD83D\uDCB0', text: stickyContainer.dataset.tBadgeMoneyBack || 'Money-back Guarantee' },
    free_returns: { icon: '\u21BA', text: stickyContainer.dataset.tBadgeFreeReturns || 'Free Returns' },
    fast_shipping: { icon: '\uD83D\uDE9A', text: stickyContainer.dataset.tBadgeFastShipping || 'Fast Shipping' },
    satisfaction_guaranteed: { icon: '\u2705', text: stickyContainer.dataset.tBadgeSatisfaction || '100% Satisfaction' },
    ssl_encrypted: { icon: '\uD83D\uDD10', text: stickyContainer.dataset.tBadgeSslEncrypted || 'SSL Encrypted' },
  };

  const upsellCheckbox = document.getElementById('sticky-upsell-checkbox');
  const qtyDecreaseBtn = document.getElementById('sticky-qty-decrease');
  const qtyIncreaseBtn = document.getElementById('sticky-qty-increase');
  const qtyValueEl = document.getElementById('sticky-qty-value');
  const cartCountEl = document.getElementById('sticky-cart-count');
  const cartSubtotalEl = document.getElementById('sticky-cart-subtotal');

  // Shipping bar elements
  const shippingContainer = document.getElementById('sticky-shipping-bar-container');
  const shippingText = document.getElementById('sticky-shipping-text');
  const shippingProgress = document.getElementById('sticky-shipping-progress-fill');
  const shippingGoalText = document.getElementById('sticky-shipping-goal-text');

  let quantity = 1;

  // Find the native Add to Cart form/button to watch
  const nativeForm = document.querySelector('form[action*="/cart/add"]');
  const nativeButton = nativeForm ? nativeForm.querySelector('[type="submit"]') : null;
  const variantInput = nativeForm ? nativeForm.querySelector('input[name="id"], select[name="id"]') : null;

  // Price display element
  const priceEl = stickyContainer.querySelector('.sticky-price');

  // Build variant-to-price map for price sync on variant change
  let variantPriceMap = {};
  try {
    const productJsonEl = document.querySelector(
      '[data-product-json], script[type="application/json"][data-product-id], script[type="application/json"][data-product]'
    );
    if (productJsonEl) {
      const productData = JSON.parse(productJsonEl.textContent || '{}');
      if (productData.variants) {
        productData.variants.forEach(function (v) {
          variantPriceMap[String(v.id)] = v.price;
        });
      }
    }
  } catch (e) {
    // Product JSON not available; price won't update on variant change
  }

  // Keep sticky variant in sync with selected product variant
  if (variantInput) {
    const syncVariant = () => {
      const nextValue = String(variantInput.value || '').replace(/\D/g, '');
      if (nextValue) {
        mainVariantId = nextValue;
        // Update displayed price if variant data is available
        if (priceEl && variantPriceMap[nextValue] !== undefined) {
          priceEl.textContent = ' - ' + formatMoney(variantPriceMap[nextValue]);
        }
      }
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

    // Smart collection upsell items
    if (smartUpsellEnabled) {
      document.querySelectorAll('.sticky-smart-upsell-item').forEach(function (el) {
        var checkbox = el.querySelector('.sticky-smart-upsell-check');
        if (checkbox && checkbox.checked) {
          var vid = String(el.dataset.variantId || '').replace(/\D/g, '');
          if (vid) items.push({ id: Number(vid), quantity: 1 });
        }
      });
    }

    trackEvent('click', mainVariantId, 0, 0);

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      const price = variantPriceMap[mainVariantId] || 0;
      const qty = enableQuantitySelector ? quantity : 1;
      trackEvent('add_to_cart', mainVariantId, qty, price * qty);

      if (upsellEnabled && upsellVariantId && (!upsellCheckbox || upsellCheckbox.checked)) {
        trackEvent('add_to_cart', upsellVariantId, 1, variantPriceMap[upsellVariantId] || 0);
      }

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
    if (!showCartSummary && !showFreeShippingBar) return;

    try {
      const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const cart = await res.json();

      if (showCartSummary && cartCountEl && cartSubtotalEl) {
        const count = cart.item_count || 0;
        cartCountEl.textContent = `${count} ${count === 1 ? tItem : tItems}`;
        cartSubtotalEl.textContent = formatMoney(cart.total_price || 0, cart.currency);
      }

      if (showFreeShippingBar && shippingContainer && shippingText && shippingProgress) {
        const total = cart.total_price || 0;
        const remaining = freeShippingGoal - total;
        const percent = Math.min(100, (total / freeShippingGoal) * 100);

        shippingContainer.style.display = 'block';
        shippingProgress.style.width = `${percent}%`;

        if (remaining <= 0) {
          shippingText.innerHTML = '<strong>' + tFreeShippingUnlocked + '</strong>';
        } else {
          shippingText.innerHTML = tAddForFreeShipping.replace('{amount}', '<strong>' + formatMoney(remaining, cart.currency) + '</strong>');
        }
      }
    } catch (e) {
      console.warn('StickyClick: unable to refresh cart summary', e);
    }
  }

  function formatMoney(cents, overrideCurrency) {
    const amount = Number(cents || 0) / 100;
    try {
      const code = overrideCurrency
        || (multiCurrencyEnabled && currencyCode)
        || (window.Shopify && Shopify.currency && Shopify.currency.active)
        || 'USD';
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  let impressionTracked = false;
  function toggleSticky(show) {
    if (show) {
      stickyContainer.classList.remove('sticky-click-hidden');
      stickyContainer.classList.add('sticky-click-visible');
      if (!impressionTracked) {
        impressionTracked = true;
        trackEvent('impression', mainVariantId, 0, 0);
      }
    } else {
      stickyContainer.classList.add('sticky-click-hidden');
      stickyContainer.classList.remove('sticky-click-visible');
    }
  }

  // Analytics event tracking (non-blocking)
  function trackEvent(eventType, variantId, qty, priceInCents) {
    if (!analyticsEnabled) return;
    try {
      const payload = JSON.stringify({
        shop: shopDomain,
        eventType: eventType,
        variantId: variantId ? String(variantId) : null,
        value: Number(priceInCents) || 0,
        testVariant: abTestVariant || null,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/apps/stickyclick/api/events', new Blob([payload], { type: 'application/json' }));
      }
    } catch (e) { /* analytics should never block UX */ }
  }

  // Countdown timer
  if (countdownEnabled) {
    const countdownContainer = document.getElementById('sticky-countdown-container');
    const countdownTimeEl = document.getElementById('sticky-countdown-time');

    if (countdownContainer && countdownTimeEl) {
      let targetTime;

      if (countdownEndTime) {
        targetTime = new Date(countdownEndTime).getTime();
      } else if (countdownDuration > 0) {
        const storageKey = 'stickyclick_countdown_start';
        let start = Number(sessionStorage.getItem(storageKey));
        if (!start || start <= 0) {
          start = Date.now();
          sessionStorage.setItem(storageKey, String(start));
        }
        targetTime = start + countdownDuration * 1000;
      }

      if (targetTime) {
        countdownContainer.classList.remove('sticky-countdown-hidden');
        const tick = () => {
          const remaining = Math.max(0, targetTime - Date.now());
          if (remaining <= 0) {
            countdownTimeEl.textContent = '00:00:00';
            return;
          }
          const h = String(Math.floor(remaining / 3600000)).padStart(2, '0');
          const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
          const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
          countdownTimeEl.textContent = h + ':' + m + ':' + s;
          setTimeout(tick, 1000);
        };
        tick();
      }
    }
  }

  // Trust badges rendering
  if (trustBadgesEnabled) {
    document.querySelectorAll('.sticky-trust-badge').forEach((el) => {
      const key = el.dataset.badge;
      const meta = tBadges[key];
      if (!meta) return;
      if (trustBadgesStyle === 'icon_only') {
        el.textContent = meta.icon;
      } else if (trustBadgesStyle === 'text_only') {
        el.textContent = meta.text;
      } else {
        el.textContent = meta.icon + ' ' + meta.text;
      }
    });
  }

  setQuantity(1);

  if (showFreeShippingBar && shippingGoalText) {
    shippingGoalText.textContent = formatMoney(freeShippingGoal);
  }

  refreshCartSummary();

  // --- Feature: Automatic Discount Badge ---
  if (showDiscountBadge) {
    const discountBadgeEl = document.getElementById('sticky-discount-badge');
    if (discountBadgeEl) {
      fetchDiscounts();
    }

    async function fetchDiscounts() {
      try {
        const res = await fetch('/apps/stickyclick/api/discounts?shop=' + encodeURIComponent(shopDomain));
        if (!res.ok) return;
        const data = await res.json();
        if (data.discounts && data.discounts.length > 0) {
          const disc = data.discounts[0];
          discountBadgeEl.textContent = disc.title || disc.summary || 'Discount Applied!';
          discountBadgeEl.classList.remove('sticky-discount-hidden');
        }
      } catch (e) {
        // Discount fetch is non-blocking
      }
    }
  }

  // --- Feature: Smart Collection Upsells ---
  if (smartUpsellEnabled) {
    const smartUpsellContainer = document.getElementById('sticky-smart-upsell');
    if (smartUpsellContainer) {
      const upsellItems = smartUpsellContainer.querySelectorAll('.sticky-smart-upsell-item');
      // Only show up to 2 items to keep it compact
      upsellItems.forEach((item, idx) => {
        if (idx >= 2) item.style.display = 'none';
      });
    }
  }

  // --- Feature: A/B Test Config ---
  function getOrAssignVariant(testId) {
    var cookieName = 'sc_ab_' + testId;
    var match = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([AB])'));
    if (match) return match[1];
    var variant = Math.random() < 0.5 ? 'A' : 'B';
    document.cookie = cookieName + '=' + variant + '; path=/; max-age=2592000; SameSite=Lax';
    return variant;
  }

  async function fetchABTestConfig() {
    try {
      const res = await fetch('/apps/stickyclick/api/ab-config?shop=' + encodeURIComponent(shopDomain));
      if (!res.ok) return;
      const data = await res.json();
      if (data.testId && data.variantAConfig && data.variantBConfig) {
        var variant = getOrAssignVariant(data.testId);
        abTestVariant = variant;
        var config = variant === 'A' ? data.variantAConfig : data.variantBConfig;
        applyABTestConfig(config);
      }
    } catch (e) {
      // A/B test fetch is non-blocking
    }
  }

  function applyABTestConfig(config) {
    if (config.primaryColor) {
      stickyContainer.style.setProperty('--sticky-primary', config.primaryColor);
    }
    if (config.textColor) {
      stickyContainer.style.setProperty('--sticky-text', config.textColor);
    }
    if (config.buttonText && stickyButton) {
      const priceSpan = stickyButton.querySelector('.sticky-price');
      // Use textContent to prevent XSS from A/B test config values
      stickyButton.textContent = '';
      var textNode = document.createTextNode(config.buttonText);
      stickyButton.appendChild(textNode);
      if (priceSpan) stickyButton.appendChild(priceSpan);
    }
    if (config.position) {
      stickyContainer.dataset.position = config.position;
    }
  }

  // Kick off A/B test config fetch
  if (analyticsEnabled) {
    fetchABTestConfig();
  }

});
