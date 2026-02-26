/**
 * StickyClick — Sticky Add-to-Cart button logic
 * Placeholder: shows the sticky bar when the native ATC button scrolls out of view.
 */
(function () {
  "use strict";

  const bar = document.getElementById("stickyclick-bar");
  if (!bar) return;

  // Find the product form's submit button
  var atcButton = document.querySelector(
    'form[action*="/cart/add"] [type="submit"]'
  );
  if (!atcButton) return;

  // Show sticky bar when native button is not visible
  function onScroll() {
    var rect = atcButton.getBoundingClientRect();
    var isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    bar.style.display = isVisible ? "none" : "block";
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Click handler: submit the product form
  bar.addEventListener("click", function () {
    var form = atcButton.closest("form");
    if (form) {
      form.requestSubmit ? form.requestSubmit() : form.submit();
    }
  });
})();
