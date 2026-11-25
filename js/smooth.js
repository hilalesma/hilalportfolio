/* ==========================================================================
   smooth.js — Lenis ile akıcı kaydırma (tüm sayfalar)
   - Lenis, GSAP'in tek zamanlayıcısıyla (gsap.ticker) çalışır; ScrollTrigger her
     kaydırmada güncellenir, böylece sabitleme (pin) ve scrub animasyonları kaymaz.
   - Sayfa içi bağlantılar (#bölüm) Lenis ile yumuşakça kayar; sabit menünün
     yüksekliği kadar boşluk bırakılır.
   - Hareket azaltma açıkken Lenis hiç başlamaz: tarayıcının kendi kaydırması kullanılır.
   Diğer betikler için: HE.lenis (yoksa null), HE.scrollTo(hedef), HE.lockScroll(true|false)
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  HE.lenis = null;

  /** Sayfayı bir öğeye / konuma kaydırır (Lenis varsa yumuşak). */
  HE.scrollTo = function (target, opts) {
    opts = opts || {};
    var offset = opts.offset !== undefined ? opts.offset : -72;
    if (HE.lenis) { HE.lenis.scrollTo(target, { offset: offset, duration: opts.duration || 1.4, immediate: !!opts.immediate }); return; }
    var el = typeof target === "string" ? document.querySelector(target) : target;
    var y = typeof target === "number" ? target : el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
    window.scrollTo({ top: y, behavior: HE.reduce || opts.immediate ? "auto" : "smooth" });
  };

  /** Kaydırmayı kilitler/açar (ör. intro sırasında). */
  HE.lockScroll = function (on) {
    if (HE.lenis) { if (on) HE.lenis.stop(); else HE.lenis.start(); }
    document.documentElement.classList.toggle("scroll-locked", !!on);
  };

  if (HE.reduce || typeof window.Lenis !== "function") return;

  var lenis = new window.Lenis({
    duration: 1.15,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, // expo.out benzeri
    smoothWheel: true,
    touchMultiplier: 1.4
  });
  HE.lenis = lenis;

  // GSAP ile tek döngü
  if (gsap) {
    if (ST) lenis.on("scroll", ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    var raf = function (time) { lenis.raf(time); window.requestAnimationFrame(raf); };
    window.requestAnimationFrame(raf);
  }

  // Sayfa içi bağlantılar: #bölüm → yumuşak kaydırma
  document.addEventListener("click", function (event) {
    var a = event.target.closest('a[href^="#"]');
    if (!a || event.defaultPrevented) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    HE.scrollTo(target);
    if (history.pushState) history.pushState(null, "", id);
    // klavye kullanıcıları için odak hedefe taşınsın
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
})();
