/* ==========================================================================
   i18n.js — TR / EN dil değiştirici
   Türkçe metinler HTML'de yazılıdır. İngilizce karşılıklar i18n/en.js içindedir.
     data-i18n="anahtar"            → öğenin metni değişir
     data-i18n-html="anahtar"       → öğenin HTML'i değişir (sözlükteki güvenilir içerik)
     data-i18n-attr="aria-label:anahtar; placeholder:anahtar2"  → nitelikler değişir
     data-lang="tr" / data-lang="en"→ uzun içerik blokları (CSS ile gösterilir/gizlenir)
   Seçim localStorage'da saklanır; değişince "he:lang" olayı yayınlanır.
   ========================================================================== */
(function () {
  "use strict";

  var html = document.documentElement;
  var dict = (window.HE_I18N && window.HE_I18N.en) || {};

  /** Anahtarı geçerli dile çevirir (JS içindeki metinler için). */
  function t(key, fallback) {
    if (html.lang === "en" && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    return fallback !== undefined ? fallback : key;
  }

  function applyText(lang) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (el.dataset.tr === undefined) el.dataset.tr = el.textContent;
      var key = el.getAttribute("data-i18n");
      el.textContent = lang === "en" && dict[key] !== undefined ? dict[key] : el.dataset.tr;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (el.dataset.trHtml === undefined) el.dataset.trHtml = el.innerHTML;
      var key = el.getAttribute("data-i18n-html");
      el.innerHTML = lang === "en" && dict[key] !== undefined ? dict[key] : el.dataset.trHtml;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length < 2) return;
        var attr = parts[0].trim();
        var key = parts.slice(1).join(":").trim();
        var store = "trAttr" + attr.replace(/[^a-z]/gi, "");
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) || "";
        el.setAttribute(attr, lang === "en" && dict[key] !== undefined ? dict[key] : el.dataset[store]);
      });
    });
  }

  /** Dili değiştirir ve uygular. */
  function setLang(lang, save) {
    if (lang !== "tr" && lang !== "en") lang = "tr";
    html.lang = lang;
    applyText(lang);
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-set-lang") === lang));
    });
    if (save) window.HE.store.set("localStorage", "he-lang", lang);
    html.classList.remove("i18n-pending");
    document.dispatchEvent(new CustomEvent("he:lang", { detail: { lang: lang } }));
  }

  window.HE.i18n = { t: t, setLang: setLang, get lang() { return html.lang; } };

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-set-lang]");
    if (btn) setLang(btn.getAttribute("data-set-lang"), true);
  });

  function init() { setLang(html.lang, false); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
