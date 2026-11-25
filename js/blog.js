/* ==========================================================================
   blog.js — Blog listesi: etiket filtresi
   (v4: alt sayfalarda 3D arka plan yoktur; eski kristal sahnesi _arsiv/v3-arka-plan/ içinde.)
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Etiket filtresi ---------- */
  var pills = document.querySelectorAll("[data-tag]");
  var cards = document.querySelectorAll("[data-tags]");
  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      var tag = pill.dataset.tag;
      pills.forEach(function (p) { p.setAttribute("aria-pressed", String(p === pill)); });
      cards.forEach(function (card) {
        card.hidden = !!tag && card.dataset.tags.split(" ").indexOf(tag) === -1;
      });
    });
  });
})();
