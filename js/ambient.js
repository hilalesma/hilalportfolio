/* ==========================================================================
   ambient.js — Açık bölümlerin arka plan derinliği (tüm sayfalar)
   - Silik, büyük çiçek ve yıldız motifleri (vadideki şekillerin pastel/toprak tonlu
     büyük sürümleri) sabit katmanda durur; sayfa kaydırıldıkça her biri farklı hızda
     yukarı süzülür ve döner (parallax, GSAP ScrollTrigger scrub).
   - İmleci yumuşak bir gecikmeyle izleyen 400px sıcak ışık hüzmesi.
   Mesh gradient, ızgara ve gren yalnız CSS'tir (css/ambient.css).
   Katman z-index:-1 ve pointer-events:none: metinlerin yerleşimini ve tıklamaları etkilemez.
   Hareket azaltma açıkken motifler durağan kalır ve imleç ışığı kapalıdır.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  var gsap = window.gsap;
  var box = document.querySelector("[data-ambient-motifs]");
  var glow = document.querySelector("[data-ambient-glow]");
  if (!box) return;

  /* ---------- Motif şekilleri ---------- */
  // Altı yapraklı çiçek (vadideki çiçek dokusunun büyük, sade sürümü)
  var FLOWER = '<svg viewBox="-50 -50 100 100"><g>' +
    [0, 60, 120, 180, 240, 300].map(function (a) {
      return '<ellipse cx="0" cy="-24" rx="11" ry="22" transform="rotate(' + a + ')"/>';
    }).join("") + '<circle r="8"/></g></svg>';
  // Dört köşeli yıldız (ışıltı)
  var STAR = '<svg viewBox="-50 -50 100 100"><path d="M0-48C4-14 14-4 48 0 14 4 4 14 0 48-4 14-14 4-48 0-14-4-4-14 0-48Z"/></svg>';
  // Girişteki çiçeklerle aynı canlı aile: altın, şeftali, lavanta, gül kurusu, pudra
  var COLORS = ["#FFCF6B", "#FFB383", "#C9A2FF", "#E07F92", "#FFB7C8"];

  var mobile = window.matchMedia("(max-width: 760px)").matches;
  var COUNT = mobile ? 6 : 10;
  var motifs = [];
  for (var i = 0; i < COUNT; i++) {
    var el = document.createElement("div");
    el.className = "ambient__motif";
    var size = (mobile ? 160 : 220) + ((i * 97) % 5) * (mobile ? 30 : 50);   // 220–420 px
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.left = ((i * 37 + 8) % 92) + "%";
    el.style.fill = COLORS[i % COLORS.length];
    el.style.color = COLORS[i % COLORS.length];     // parlama (drop-shadow) rengi
    el.innerHTML = i % 3 === 1 ? STAR : FLOWER;
    box.appendChild(el);
    motifs.push({ el: el, speed: 0.12 + ((i * 53) % 7) * 0.05, spin: (i % 2 ? 1 : -1) * (60 + ((i * 31) % 5) * 30) });
  }

  /* ---------- Göz kırpan küçük yıldızlar (girişteki yıldızların devamı) ---------- */
  var starLayer = document.createElement("div");
  starLayer.className = "ambient__stars";
  starLayer.style.position = "absolute";
  starLayer.style.inset = "0";
  box.appendChild(starLayer);
  var STAR_COUNT = mobile ? 36 : 80;
  for (var s = 0; s < STAR_COUNT; s++) {
    var dot = document.createElement("span");
    // her üç yıldızdan biri yavaşça parlayıp neredeyse tamamen söner (farklı süre ve gecikmeyle)
    var slow = s % 3 === 0;
    dot.className = slow ? "ambient__star ambient__star--slow" : "ambient__star";
    if (slow) dot.style.setProperty("--tw-dur", (4 + (s % 5) * 0.8).toFixed(1) + "s");
    dot.style.left = ((s * 61.8) % 100).toFixed(2) + "%";       // altın oranla düzgün dağılım
    dot.style.top = ((s * 38.2 + (s % 7) * 9) % 100).toFixed(2) + "%";
    dot.style.color = COLORS[s % COLORS.length];
    dot.style.animationDelay = slow ? (-(s * 1.13) % 7).toFixed(2) + "s" : (-(s * 0.37) % 3.2).toFixed(2) + "s";
    var r = 1.5 + (s % 4) * 0.6;
    dot.style.width = dot.style.height = r + "px";
    starLayer.appendChild(dot);
  }

  /** Her motifin başlangıç yüksekliği: kaydırma boyunca farklı anlarda ekrandan geçsinler. */
  function place() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var vh = window.innerHeight;
    motifs.forEach(function (m, idx) {
      var travel = maxScroll * m.speed;            // kaydırma boyunca kat edeceği yol
      m.travel = travel;
      m.el.style.top = (vh * 0.9 + (idx / motifs.length) * travel) + "px";
    });
  }
  place();

  if (HE.reduce || !gsap || !window.ScrollTrigger) {
    // hareket yok: motifler ilk ekranda dağınık ve durağan
    motifs.forEach(function (m, idx) { m.el.style.top = ((idx / motifs.length) * 100) + "%"; });
    return;
  }

  /* ---------- Parallax: farklı hızlarda süzülme ve dönme ---------- */
  var tweens = [];
  function build() {
    tweens.forEach(function (t) { t.kill(); });
    tweens = motifs.map(function (m) {
      return gsap.fromTo(m.el, { y: 0, rotation: 0 }, {
        y: -m.travel - window.innerHeight, rotation: m.spin, ease: "none",
        scrollTrigger: { trigger: document.documentElement, start: 0, end: "max", scrub: 1.2 }
      });
    });
    // yıldızlar çok az kayar: uzak gökyüzü hissi
    tweens.push(gsap.fromTo(starLayer, { y: 0 }, {
      y: -window.innerHeight * 0.25, ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: 0, end: "max", scrub: 1.5 }
    }));
  }
  build();
  window.ScrollTrigger.addEventListener("refreshInit", function () { place(); });
  window.addEventListener("load", function () { place(); build(); window.ScrollTrigger.refresh(); });

  /* ---------- İmleci gecikmeyle izleyen sıcak ışık ---------- */
  if (!glow || window.matchMedia("(pointer: coarse)").matches) return;
  var toX = gsap.quickTo(glow, "x", { duration: 0.9, ease: "power3.out" });
  var toY = gsap.quickTo(glow, "y", { duration: 0.9, ease: "power3.out" });
  window.addEventListener("pointermove", function (e) {
    toX(e.clientX);
    toY(e.clientY);
    if (!glow.classList.contains("is-on")) glow.classList.add("is-on");
  }, { passive: true });
  document.addEventListener("pointerleave", function () { glow.classList.remove("is-on"); });
})();
