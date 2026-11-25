/* ==========================================================================
   site.js — Tüm sayfalarda çalışan ortak davranışlar
   1. Menü (kaydırınca küçülme, koyu/açık ton)    5. Kart tilt + ışık yansıması
   2. Mobil tam ekran menü (odak tuzağı, Escape)   6. Sayfa geçişleri
   3. Bölüm atmosferi (arka plan değişimi)        7. E-posta kopyalama + bildirim
   4. Scroll ile açılan öğeler (GSAP ScrollTrigger) 8. Config: GitHub görünürlüğü
   Animasyon dili: giriş 0.8–1.2 sn "expo.out", arayüz 0.2–0.3 sn "power2.out".
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var html = document.documentElement;
  var hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- Yardımcılar ---------- */
  HE.t = function (key, fallback) { return HE.i18n ? HE.i18n.t(key, fallback) : fallback; };

  var toastEl = null;
  var toastTimer = 0;
  /** Ekranın altında kısa bir bildirim gösterir (ekran okuyucular için role="status"). */
  HE.toast = function (message) {
    if (!toastEl) {
      toastEl = document.createElement("p");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2200);
  };

  /* ---------- 1. Menü ---------- */
  var nav = document.querySelector("[data-nav]");
  function onScroll() {
    if (nav) nav.classList.toggle("is-compact", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Mobil menü ---------- */
  var menu = document.querySelector("[data-menu]");
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");

  function focusables() {
    return Array.prototype.filter.call(
      menu.querySelectorAll("a[href], button:not([disabled])"),
      function (el) { return el.offsetParent !== null; }
    );
  }
  function onMenuKey(event) {
    if (event.key === "Escape") { closeMenu(true); return; }
    if (event.key !== "Tab") return;
    var items = focusables();
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function openMenu() {
    menu.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (HE.lockScroll) HE.lockScroll(true);
    closeBtn.focus();
    document.addEventListener("keydown", onMenuKey);
  }
  function closeMenu(returnFocus) {
    menu.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (HE.lockScroll) HE.lockScroll(false);
    document.removeEventListener("keydown", onMenuKey);
    if (returnFocus) openBtn.focus();
  }
  if (menu && openBtn && closeBtn) {
    openBtn.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", function () { closeMenu(true); });
    menu.addEventListener("click", function (event) { if (event.target === menu) closeMenu(true); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { closeMenu(false); });
    });
  }

  /* ---------- 3. Bölüm atmosferi ----------
     data-mood="night|paper|pearl|blush|sand|dusk" taşıyan bölüm ekranın ortasına gelince
     sabit arka plan katmanı değişir; karanlık bölümde menü açık tonlu olur. */
  var layers = document.querySelectorAll(".atmo__layer");
  function setMood(mood) {
    layers.forEach(function (layer) { layer.classList.toggle("is-active", layer.dataset.for === mood); });
    if (nav) nav.dataset.tone = mood === "night" ? "light" : "dark";
  }
  setMood(document.body.dataset.mood || "paper");
  var moodSections = document.querySelectorAll("main [data-mood]");
  if (moodSections.length && "IntersectionObserver" in window) {
    var moodObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setMood(entry.target.dataset.mood);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    moodSections.forEach(function (section) { moodObserver.observe(section); });
  }

  /* ---------- 4. Scroll ile açılan öğeler ---------- */
  function initReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;
    if (HE.reduce || !hasGsap || !window.ScrollTrigger) {
      items.forEach(function (el) { el.style.opacity = "1"; });
      return;
    }
    window.gsap.set(items, { opacity: 0, y: 28, filter: "blur(6px)" });
    window.ScrollTrigger.batch(items, {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        window.gsap.to(batch, {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true, clearProps: "filter"
        });
      }
    });
  }

  /* ---------- 5. Cam kartlar: 3D tilt + spotlight (yalnız fare/kalem, hareket izni varsa) ----------
     Hedef: [data-tilt] ve ana içerikteki cam kartlar (.glass). Menü paneli, form, tablo kabı ve
     küçük hap etiketler hariç (yazarken ya da okurken eğilmeleri rahatsız eder).
     Kart imlecin yönüne en fazla 5° eğilir; yüzeyinde imleci izleyen yarı saydam altın/lavanta
     ışık (.glass-spot, radial-gradient) belirir. */
  var TILT_MAX = 5;
  var TILT_SKIP = ".mobile-menu__panel, .contact-form, .timetable-wrap, .pill, [data-no-tilt]";
  function initTilt() {
    if (HE.reduce || !hasGsap) return;
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var cards = Array.prototype.filter.call(document.querySelectorAll("[data-tilt], main .glass"), function (el) {
      return !el.matches(TILT_SKIP);
    });
    cards.forEach(function (el) {
      window.gsap.set(el, { transformPerspective: 900 });
      if (!finePointer) return;
      el.classList.add("is-tiltable");
      var spot = document.createElement("span");
      spot.className = "glass-spot";
      spot.setAttribute("aria-hidden", "true");
      el.appendChild(spot);
      var rx = window.gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
      var ry = window.gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("pointermove", function (event) {
        var r = el.getBoundingClientRect();
        var px = (event.clientX - r.left) / r.width;
        var py = (event.clientY - r.top) / r.height;
        ry((px - 0.5) * 2 * TILT_MAX);    // sağa gidince sağ kenar geri çekilir
        rx(-(py - 0.5) * 2 * TILT_MAX);   // en fazla ±5°
        el.style.setProperty("--mx", (event.clientX - r.left) + "px");
        el.style.setProperty("--my", (event.clientY - r.top) + "px");
      });
      el.addEventListener("pointerenter", function () {
        el.style.setProperty("--sheen", "1");
        el.classList.add("is-lifted");
      });
      el.addEventListener("pointerleave", function () {
        rx(0); ry(0);
        el.style.setProperty("--sheen", "0");
        el.classList.remove("is-lifted");
      });
    });
    // Kaydırırken cam kartlar hafif perspektif eğimiyle girer (data-scroll-tilt)
    if (window.ScrollTrigger) {
      document.querySelectorAll("[data-scroll-tilt]").forEach(function (el) {
        window.gsap.fromTo(el, { rotationX: 10, transformOrigin: "50% 100%" }, {
          rotationX: 0, ease: "none",
          scrollTrigger: { trigger: el, start: "top 95%", end: "top 55%", scrub: true }
        });
      });
    }
  }

  /* ---------- 6. Sayfa geçişleri: gece perdesi + "HE" monogramı ----------
     Giden sayfa: iç bağlantıya tıklayınca koyu gece perdesi yumuşakça belirir, ortasında soluk
     altın "HE" monogramı açılır; perde tam kapanınca yeni sayfaya gidilir (HE.leaveTo).
     Gelen sayfa: boot.js "he-pt" işaretini görünce <html>'e "pt-in" sınıfı ekler; perde daha ilk
     çizimde kapalıdır ve CSS animasyonuyla yukarı kayarak açılır (tarayıcının yükleme kesintisi
     görünmez). İmleç ışıkları (cursor-lights.js) tıklamada partikülleri dağıtıp aynı perdeyi kullanır. */
  var LEAVE_MS = 650;
  function initTransitions() {
    // gelen perde: animasyon bitince sınıfı temizle (JS çalışmasa da CSS animasyonu perdeyi açar)
    if (html.classList.contains("pt-in")) {
      window.setTimeout(function () { html.classList.remove("pt-in"); }, 1400);
    }
    if (HE.reduce) return;
    var curtain = document.createElement("div");
    curtain.className = "page-curtain";
    curtain.setAttribute("aria-hidden", "true");
    curtain.innerHTML = '<span class="page-curtain__mark">HE</span>';
    document.body.appendChild(curtain);
    var leaving = false;

    /** Perdeyi kapatır, sonra href'e gider */
    HE.leaveTo = function (href) {
      if (leaving) return;
      leaving = true;
      curtain.classList.add("is-on");
      HE.store.set("sessionStorage", "he-pt", "1");
      window.setTimeout(function () { window.location.href = href; }, LEAVE_MS);
    };

    document.addEventListener("click", function (event) {
      var a = event.target.closest("a[href]");
      if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      var url = new URL(a.href, window.location.href);
      var samePage = url.pathname === window.location.pathname;
      if (url.origin !== window.location.origin || samePage || /^(mailto|tel):/.test(a.href)) return;
      if (!/\.html$|\/$/.test(url.pathname)) return;
      event.preventDefault();
      HE.leaveTo(a.href);
    });
    // Geri tuşuyla dönüldüğünde (bfcache) perdeyi kaldır
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      leaving = false;
      curtain.classList.remove("is-on");
      html.classList.remove("pt-in");
    });
  }

  /* ---------- 7. E-posta kopyalama ---------- */
  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-copy]");
    if (!btn) return;
    var text = btn.getAttribute("data-copy");
    var done = function () {
      // yazılı düğme ("Kopyala") kendi üzerinde "Kopyalandı ✓" gösterir; ikonlu olanlar alt bildirim kullanır
      var labeled = btn.classList.contains("copy-btn--labeled");
      if (!labeled) HE.toast(HE.t("toast.copied", "Kopyalandı"));
      btn.classList.add("is-copied");
      window.clearTimeout(btn._copyTimer);
      btn._copyTimer = window.setTimeout(function () { btn.classList.remove("is-copied"); }, labeled ? 2000 : 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {
        HE.toast(HE.t("toast.copyFail", "Kopyalanamadı — adresi seçerek kopyalayın"));
      });
    } else {
      // Eski yöntem (file:// gibi güvenli olmayan bağlamlar için)
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      area.remove();
      if (ok) done(); else HE.toast(HE.t("toast.copyFail", "Kopyalanamadı — adresi seçerek kopyalayın"));
    }
  });

  /* ---------- 8. Config ---------- */
  var config = window.HE_CONFIG || {};
  if (config.showGithub === false) {
    document.querySelectorAll("[data-github]").forEach(function (el) { el.hidden = true; });
  }
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Başlat ---------- */
  function start() {
    initReveals();
    initTilt();
    initTransitions();
    if (window.ScrollTrigger) window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
