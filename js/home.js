/* ==========================================================================
   home.js — Ana sayfa (v4) bölüm animasyonları
   - Klasör destesi (Seçili çalışmalar): masaüstünde deste sabitlenir (pin); kaydırdıkça
     klasörler sırayla aşağıdan gelip üst üste yerleşir ve her biri "açılır" (kapak dışarı kayar).
     Mobilde sabitleme yok: her klasör ekrana girince açılır.
   - Menüde o an görünen bölüm işaretlenir.
   - Dev e-posta kopyalanınca kısa bir "kopyalandı" durumu (asıl kopyalama js/site.js'de).
   Vadi (intro) C aşamasında js/valley/ içinde gelecek.
   Hareket azaltma açıkken hareket yok; içerik son halinde görünür.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  /* ---------- Klasör destesi ---------- */
  function initDeck() {
    var deck = document.querySelector("[data-deck]");
    if (!deck || !gsap || !ST || HE.reduce) return;
    var items = gsap.utils.toArray(".deck__item", deck);
    var mm = gsap.matchMedia();

    mm.add("(min-width: 960px)", function () {
      deck.classList.add("is-stacked");
      // Başlangıç: ilk klasör yerinde, diğerleri aşağıda bekler
      items.forEach(function (item, i) {
        // filter başlangıçta açıkça "brightness(1)": "none"dan ara değer üretilirken brightness(0) (siyah) çıkıyordu
        gsap.set(item, { yPercent: i === 0 ? 0 : 115, zIndex: i + 1, filter: "brightness(1)" });
        gsap.set(item.querySelector(".deck-folder__cover"), { yPercent: i === 0 ? 0 : 18 });
      });
      var tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: deck.closest(".works"),
          start: "top top+=" + 90,
          end: "+=" + items.length * 70 + "%",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1
        }
      });
      items.forEach(function (item, i) {
        if (i === 0) return;
        var prev = items[i - 1];
        // önceki klasör hafifçe geri çekilir (derinlik), yenisi yukarı kayıp açılır
        tl.to(prev, { scale: 0.94, yPercent: -6, filter: "brightness(0.92)", duration: 1 }, i - 1)
          .to(item, { yPercent: 0, duration: 1 }, i - 1)
          .to(item.querySelector(".deck-folder__cover"), { yPercent: 0, duration: 1 }, i - 0.7);
      });
      return function () { deck.classList.remove("is-stacked"); gsap.set(items, { clearProps: "all" }); };
    });

    mm.add("(max-width: 959px)", function () {
      items.forEach(function (item) {
        gsap.from(item.querySelector(".deck-folder__doc"), {
          clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.out",
          scrollTrigger: { trigger: item, start: "top 80%", once: true }
        });
      });
    });
  }

  /* ---------- Menüde görünen bölüm ---------- */
  function initNavSpy() {
    var links = document.querySelectorAll(".site-nav a[data-nav-page]");
    var sections = document.querySelectorAll("main > [data-nav-section]");
    if (!sections.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var page = entry.target.dataset.navSection;
        links.forEach(function (a) {
          if (a.dataset.navPage === page) a.setAttribute("aria-current", "page");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Dev e-posta: kopyalandı durumu ---------- */
  function initEmail() {
    var btn = document.querySelector(".contact-xl__email");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var hint = btn.querySelector(".contact-xl__hint");
      if (!hint.dataset.orig) hint.dataset.orig = hint.innerHTML;
      hint.innerHTML = '<svg class="icon"><use href="#i-check"/></svg>' + (document.documentElement.lang === "en" ? "Copied" : "Kopyalandı");
      window.setTimeout(function () { hint.innerHTML = hint.dataset.orig; }, 1800);
    });
  }

  function start() {
    initDeck();
    initNavSpy();
    initEmail();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
