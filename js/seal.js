/* ==========================================================================
   seal.js — Dönen SVG mühür ("WEB TASARIM ✦ YAZILIM ✦ GRAFİK TASARIM ✦")
   - Halka kendi ekseninde yavaşça döner (BASE derece/sn).
   - Sayfa kaydırıldıkça dönüş hızı kaydırma hızıyla artar, sonra yumuşakça normale iner.
   - Tek requestAnimationFrame döngüsü, delta-time ile; mühür ekranda değilken döngü durur.
   - Hareket azaltma açıkken mühür durağandır.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  var seals = Array.prototype.map.call(document.querySelectorAll("[data-seal]"), function (el) {
    return { el: el, ring: el.querySelector("[data-seal-ring]"), angle: 0, visible: false };
  });
  if (!seals.length || HE.reduce) return;

  var BASE = 14;       // derece / sn
  var MAX_BOOST = 520; // derece / sn: en hızlı kaydırmada eklenen hız
  var boost = 0;
  var raf = 0, last = 0;

  // kaydırma hızı → ek dönüş hızı (Lenis varsa onun hızı, yoksa scrollY farkı)
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    var v = HE.lenis ? HE.lenis.velocity : (y - lastY);
    lastY = y;
    boost = Math.min(MAX_BOOST, Math.max(boost, Math.abs(v) * 14));
  }, { passive: true });

  function anyVisible() { return seals.some(function (s) { return s.visible; }); }

  function frame(now) {
    var dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    boost *= Math.exp(-dt * 2.2);   // ek hız yavaşça söner
    seals.forEach(function (s) {
      if (!s.visible) return;
      s.angle = (s.angle + (BASE + boost) * dt) % 360;
      s.ring.style.transform = "rotate(" + s.angle.toFixed(2) + "deg)";
    });
    raf = anyVisible() ? requestAnimationFrame(frame) : 0;
  }
  function run() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        seals.forEach(function (s) { if (s.el === e.target) s.visible = e.isIntersecting; });
      });
      if (anyVisible()) run();
    });
    seals.forEach(function (s) { io.observe(s.el); });
  } else {
    seals.forEach(function (s) { s.visible = true; });
    run();
  }

  // Doğrulama için (scripts/seal-check.mjs)
  HE.seal = { angle: function () { return seals[0].angle; }, boost: function () { return boost; } };
  window.HE = HE;
})();
