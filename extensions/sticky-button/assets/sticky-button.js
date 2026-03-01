document.addEventListener('DOMContentLoaded', () => {
  const stickyContainer = document.getElementById('sticky-click-container');
  const stickyButton = document.getElementById('sticky-click-btn');
  if (!stickyContainer || !stickyButton) return;

  const mainVariantId = String(stickyContainer.dataset.mainVariantId || '').replace(/\D/g, '');
  const upsellEnabled = String(stickyContainer.dataset.upsellEnabled || '') === 'true';
  const upsellVariantId = String(stickyContainer.dataset.upsellVariantId || '').replace(/\D/g, '');
  const upsellCheckbox = document.getElementById('sticky-upsell-checkbox');

  // Find the native Add to Cart form/button to watch
  const nativeForm = document.querySelector('form[action*="/cart/add"]');
  const nativeButton = nativeForm ? nativeForm.querySelector('[type="submit"]') : null;

  if (!nativeButton) {
    console.warn('StickyClick: Native Add to Cart button not found. Using scroll depth fallback.');
    window.addEventListener('scroll', () => toggleSticky(window.scrollY > 300));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => toggleSticky(!entry.isIntersecting));
    }, { threshold: 0 });

    observer.observe(nativeButton);
  }

  stickyButton.addEventListener('click', async () => {
    if (!mainVariantId) return;

    const items = [{ id: Number(mainVariantId), quantity: 1 }];
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
      window.location.href = '/cart';
    } catch (error) {
      console.error('StickyClick add-to-cart failed:', error);
      // fallback to native button click
      nativeButton?.click();
    }
  });

  function toggleSticky(show) {
    if (show) {
      stickyContainer.classList.remove('sticky-click-hidden');
      stickyContainer.classList.add('sticky-click-visible');
    } else {
      stickyContainer.classList.add('sticky-click-hidden');
      stickyContainer.classList.remove('sticky-click-visible');
    }
  }
});
