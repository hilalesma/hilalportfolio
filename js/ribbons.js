/* ==========================================================================
   ribbons.js — Ana sayfadaki çapraz kayan ilgi alanları şeritleri
   - Her şeridin metni, şeridi dolduracak kadar kopyalanır (kopyalar ekran okuyuculardan gizli).
   - Sonsuz kayma: tek requestAnimationFrame döngüsü, delta-time ile; konum metin genişliğinde sarılır.
     Üst şerit (data-ribbon="-1") sola, alt şerit (data-ribbon="1") sağa akar.
   - Sayfa kaydırıldıkça hız artar; yukarı kaydırınca yön geçici olarak tersine döner.
   - Fareyle şeridin üzerine gelince akış yumuşakça yavaşlar.
   - Şeritler ekranda değilken döngü durur. Hareket azaltma açıkken şeritler durağandır.
   - Dil değişince (he:lang) kopyalar yeniden üretilir.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  var section = document.querySelector(".ribbons");
  if (!section) return;
  var ribbons = Array.prototype.map.call(section.querySelectorAll("[data-ribbon]"), function (el) {
    return { el: el, track: el.querySelector("[data-ribbon-track]"), dir: Number(el.dataset.ribbon) || -1, x: 0, w: 0, slow: 1, slowTarget: 1 };
  });

  var BASE = 42;          // px / sn: temel akış hızı
  var boost = 0;          // kaydırmadan gelen ek hız (işaretli: + aşağı, − yukarı)

  /** Metni şeridi en az iki kat dolduracak kadar çoğaltır */
  function fill(r) {
    var first = r.track.querySelector(".ribbon__text");
    r.track.querySelectorAll(".ribbon__text--clone").forEach(function (n) { n.remove(); });
    r.w = first.getBoundingClientRect().width || 1;
    var need = Math.ceil((window.innerWidth * 1.3) / r.w) + 1;
    for (var i = 0; i < need; i++) {
      var c = first.cloneNode(true);
      c.classList.add("ribbon__text--clone");
      c.setAttribute("aria-hidden", "true");
      r.track.appendChild(c);
    }
  }
  function fillAll() { ribbons.forEach(fill); }
  fillAll();

  if (HE.reduce) return;   // hareket azaltma: şeritler durağan

  ribbons.forEach(function (r) {
    r.el.addEventListener("pointerenter", function () { r.slowTarget = 0.18; });
    r.el.addEventListener("pointerleave", function () { r.slowTarget = 1; });
  });

  // Kaydırma hızı → ek hız (Lenis varsa onun hızını, yoksa scrollY farkını kullan)
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    var v = HE.lenis ? HE.lenis.velocity : (y - lastY);
    lastY = y;
    boost += v * 9;
    boost = Math.max(-900, Math.min(900, boost));
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var visible = false, raf = 0, last = 0;
  function frame(now) {
    var dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    boost *= Math.exp(-dt * 3);   // ek hız yavaşça söner
    ribbons.forEach(function (r) {
      r.slow += (r.slowTarget - r.slow) * Math.min(1, dt * 4);
      // üst şerit: aşağı kaydırınca sola hızlanır; alt şerit: sağa hızlanır
      var speed = (BASE + boost) * r.slow;
      r.x += r.dir * speed * dt;
      if (r.x <= -r.w) r.x += r.w;
      if (r.x > 0) r.x -= r.w;
      r.track.style.transform = "translate3d(" + r.x.toFixed(2) + "px,0,0)";
    });
    if (visible) raf = requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    }).observe(section);
  } else { visible = true; raf = requestAnimationFrame(frame); }

  // Dil ve boyut değişince yeniden ölç
  document.addEventListener("he:lang", function () { fillAll(); });
  var t = 0;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fillAll, 200); });
})();
