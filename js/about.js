/* ==========================================================================
   about.js — Hakkımda sayfası animasyonları (GSAP + ScrollTrigger)
   - Zaman çizelgesi çizgisi kaydırdıkça çizilir; kartlar soldan/sağdan dönüşümlü girer
   - "Bölüm Birincisi" rozeti parıltıyla girer
   - Yetenek çubukları 0'dan dolar (yüzde sayacı ile)
   - Ders programı hücreleri gün gün (sütun sütun) açılır
   - Botanik çizimler kendini çizer
   Hareket azaltma açıkken hiçbiri çalışmaz; içerik son halinde görünür.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  // <details> yazdırırken açık olsun (vize dosyası için tüm görevler görünür)
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll(".tasks details").forEach(function (d) { d.dataset.wasOpen = d.open; d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    document.querySelectorAll(".tasks details").forEach(function (d) { d.open = d.dataset.wasOpen === "true"; });
  });

  if (!gsap || !ST || HE.reduce) return;

  // 1. Zaman çizelgesi çizgileri
  document.querySelectorAll(".timeline").forEach(function (list) {
    var line = list.parentElement.querySelector(".timeline__line");
    if (line) {
      gsap.fromTo(line, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: list, start: "top 70%", end: "bottom 60%", scrub: true }
      });
    }
    var split = list.classList.contains("timeline--split") && window.matchMedia("(min-width: 1024px)").matches;
    list.querySelectorAll(":scope > li").forEach(function (li, i) {
      gsap.from(li, {
        x: split ? (i % 2 ? 80 : -80) : 40, opacity: 0, duration: 1.1, ease: "expo.out",
        scrollTrigger: { trigger: li, start: "top 85%", once: true }
      });
    });
  });

  // 2. Rozet parıltısı
  document.querySelectorAll(".badge").forEach(function (badge) {
    gsap.timeline({ scrollTrigger: { trigger: badge, start: "top 88%", once: true } })
      .from(badge, { scale: 0.85, opacity: 0, duration: 0.8, ease: "back.out(1.7)" })
      .from(badge.querySelector(".badge__medal"), { rotation: -25, duration: 0.8, ease: "expo.out" }, 0)
      .to(badge.querySelector(".badge__glint"), { xPercent: 240, duration: 1.1, ease: "power2.inOut" }, 0.4);
  });

  // 3. Yetenek çubukları ve yüzde sayaçları
  document.querySelectorAll(".skill").forEach(function (skill) {
    var meter = skill.querySelector("meter");
    var pct = skill.querySelector(".skill__pct");
    var value = Number(meter.getAttribute("value"));
    var counter = { v: 0 };
    meter.value = 0;
    gsap.to(counter, {
      v: value, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: skill, start: "top 90%", once: true },
      onUpdate: function () {
        meter.value = counter.v;                       // çubuk dolar
        pct.textContent = "%" + Math.round(counter.v); // yüzde sayar
      }
    });
  });

  // 4. Ders programı: hücreler gün gün açılır
  var table = document.querySelector(".timetable");
  if (table) {
    var tl = gsap.timeline({ scrollTrigger: { trigger: table, start: "top 80%", once: true } });
    for (var d = 0; d < 5; d++) {
      tl.from(table.querySelectorAll('td[data-day="' + d + '"]'), {
        opacity: 0, y: 16, duration: 0.5, ease: "power2.out", stagger: 0.04
      }, d * 0.18);
    }
  }

  // 5. Botanik çizimler kendini çizer
  document.querySelectorAll("svg[data-draw]").forEach(function (svg) {
    var paths = svg.querySelectorAll("path, circle");
    paths.forEach(function (p) {
      var len = Math.ceil(p.getTotalLength());
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.to(paths, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut", stagger: 0.05, scrollTrigger: { trigger: svg, start: "top 90%", once: true } });
  });
})();
