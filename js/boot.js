/* ==========================================================================
   boot.js — <head> içinde, sayfa çizilmeden ÖNCE çalışan küçük betik.
   - Hareket tercihini belirler (prefers-reduced-motion + ?motion=full testi)
   - Kayıtlı dili <html lang> olarak uygular (dil "yanıp sönmesin")
   - Ortak ad alanını (window.HE) başlatır
   ========================================================================== */
(function () {
  "use strict";

  var html = document.documentElement;
  var params = new URLSearchParams(window.location.search);
  var store = {
    get: function (storage, key) {
      try { return window[storage].getItem(key); } catch (e) { return null; }
    },
    set: function (storage, key, value) {
      try { window[storage].setItem(key, value); } catch (e) { /* depolama kapalı olabilir */ }
    },
    remove: function (storage, key) {
      try { window[storage].removeItem(key); } catch (e) { /* yok say */ }
    }
  };

  // ?motion=full → işletim sistemindeki "hareketi azalt" ayarını bu oturum için yok say (test amaçlı)
  // ?motion=auto → normale dön
  if (params.get("motion") === "full") store.set("sessionStorage", "he-motion", "full");
  if (params.get("motion") === "auto") store.remove("sessionStorage", "he-motion");
  var forceMotion = store.get("sessionStorage", "he-motion") === "full";
  var systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reduce = systemReduce && !forceMotion;

  // Dil: ?lang= > kayıtlı tercih > Türkçe (varsayılan)
  var lang = params.get("lang") || store.get("localStorage", "he-lang") || "tr";
  if (lang !== "tr" && lang !== "en") lang = "tr";
  html.lang = lang;

  html.classList.add("js", reduce ? "motion-reduced" : "motion-ok");
  if (lang === "en") html.classList.add("i18n-pending");

  // Ortak ad alanı: diğer betikler buradan okur
  window.HE = window.HE || {};
  window.HE.reduce = reduce;            // true ise animasyon ve 3D kapalı
  window.HE.forceMotion = forceMotion;  // ?motion=full ile zorlandı mı
  window.HE.systemReduce = systemReduce;
  window.HE.params = params;
  window.HE.store = store;

  // Sayfa geçişi: önceki sayfa gece perdesini kapatarak geldiyse perde ilk çizimde kapalı başlar
  // ve CSS ile yukarı kayarak açılır (css/base.css "pt-in", js/site.js §6).
  if (store.get("sessionStorage", "he-pt") === "1") {
    store.remove("sessionStorage", "he-pt");
    if (!reduce) html.classList.add("pt-in");
  }

  // Ana sayfa intro'su (gece çiçek vadisi) oynatılacak mı? Yalnız index.html'de, boot.js etiketi
  // data-intro taşıdığında karar verilir. Oynayacaksa <html> "intro-play" sınıfı alır: yükleyici
  // görünür, sayfa kaydırması kilitlenir (js/valley/intro.js). Oturumda bir kez oynar; ?intro=1 zorlar.
  var me = document.currentScript;
  if (me && me.hasAttribute("data-intro")) {
    var seen = store.get("sessionStorage", "he-valley") === "1";
    var webgl = false;
    try {
      var probe = document.createElement("canvas");
      webgl = !!(window.WebGLRenderingContext && (probe.getContext("webgl2") || probe.getContext("webgl")));
    } catch (e) { webgl = false; }
    // Bir bölüme doğrudan bağlantıyla gelindiyse (index.html#iletisim gibi) intro araya girmez
    var deepLink = window.location.hash && window.location.hash !== "#vadi";
    var play = !reduce && webgl && (params.get("intro") === "1" || (!seen && !deepLink));
    html.classList.add(play ? "intro-play" : "intro-still");
    window.HE = window.HE || {};
    window.HE.introPlay = play;
    // Canlı vadi: intro bir kez oynadıktan sonra da (ya da bölüme doğrudan gelindiğinde) vadi canlı kalır;
    // sayfanın en üstünde yukarı kaydırınca yeniden girilir (js/valley/intro.js). Hareket azaltmada durağan kare.
    window.HE.valleyLive = !reduce && webgl;
    window.HE.webgl = webgl;
  }

  // Güvenlik ağı: bir betik hata verse bile içerik 4 sn sonra görünür olsun
  window.setTimeout(function () {
    html.classList.add("reveal-fallback");
    html.classList.remove("i18n-pending");
  }, 4000);
})();
