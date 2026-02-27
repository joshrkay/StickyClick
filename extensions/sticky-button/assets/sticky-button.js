document.addEventListener('DOMContentLoaded', () => {
  const stickyContainer = document.getElementById('sticky-click-container');
  if (!stickyContainer) return;

  // Find the native Add to Cart form/button to watch
  const nativeForm = document.querySelector('form[action*="/cart/add"]');
  const nativeButton = nativeForm ? nativeForm.querySelector('[type="submit"]') : null;

  if (!nativeButton) {
    // Fallback: If no native button found, just show sticky always (or never? Decision: Show after small scroll)
    console.warn('StickyClick: Native Add to Cart button not found. Using scroll depth fallback.');
    window.addEventListener('scroll', () => toggleSticky(window.scrollY > 300));
    return;
  }

  // IntersectionObserver: Watch native button visibility
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // If native button is NOT intersecting (scrolled out of view), show sticky
      toggleSticky(!entry.isIntersecting);
    });
  }, { threshold: 0 });

  observer.observe(nativeButton);

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
