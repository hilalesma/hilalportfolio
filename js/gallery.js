/* ==========================================================================
   gallery.js — Galeri: kategori filtresi, lightbox ve parallax katmanlar
   - Filtre hapları <li data-category> öğelerini gösterir/gizler (yumuşak geçişle)
   - data-zoom taşıyan çerçeveye tıklanınca lightbox açılır (klavye + swipe: js/lightbox.js)
   - Kaydırırken kareler farklı hızlarda kayar (parallax); hareket azaltmada kapalı
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var gsap = window.gsap;
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery > li"));
  var buttons = document.querySelectorAll("[data-filter]");
  var motion = gsap && !HE.reduce;

  /* ---------- Filtre ---------- */
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.dataset.filter;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var shown = [];
      items.forEach(function (li) {
        var match = cat === "all" || li.dataset.category === cat;
        li.hidden = !match;
        if (match) shown.push(li);
      });
      if (motion) gsap.fromTo(shown, { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "expo.out", stagger: 0.05 });
      var status = document.querySelector("[data-filter-status]");
      if (status) {
        status.textContent = document.documentElement.lang === "en"
          ? shown.length + " photo(s) shown" : shown.length + " fotoğraf gösteriliyor";
      }
    });
  });

  // Bağlantıyla filtre: galeri.html#filtre-taki → "Takı" filtresi seçili açılır
  // (filtre düğmeleri id="filtre-<kategori>" taşır; hakkimda.html bu bağlantıyı kullanır)
  var fromHash = window.location.hash.match(/^#filtre-([\w-]+)$/);
  if (fromHash) {
    var target = document.querySelector('[data-filter="' + fromHash[1] + '"]');
    if (target) target.click();
  }

  /* ---------- Lightbox ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery [data-zoom]");
    if (!btn || !HE.lightbox) return;
    var visible = Array.prototype.slice.call(document.querySelectorAll(".gallery > li:not([hidden]) [data-zoom]"));
    var en = document.documentElement.lang === "en";
    HE.lightbox.open(visible.map(function (b) {
      var img = b.querySelector("img");
      return { src: b.dataset.zoom, alt: img ? img.alt : "", caption: en ? b.dataset.captionEn : b.dataset.captionTr };
    }), visible.indexOf(btn), btn);
  });

  /* ---------- Parallax ---------- */
  if (motion && window.ScrollTrigger) {
    items.forEach(function (li, i) {
      gsap.to(li, {
        yPercent: -(4 + (i % 3) * 4),
        ease: "none",
        scrollTrigger: { trigger: li, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }
})();
