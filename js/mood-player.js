/* ==========================================================================
   mood-player.js — Ana sayfadaki "Ruh Haline Göre Plak Çalar"
   - 3 ruh hali sekmesi (Kodlama & Odak, Gece & Yıldızlar, Keman & Akustik). Her sekmenin
     data-src değeri bir Spotify Embed bağlantısıdır (index.html'de [[TODO: SPOTIFY PLAYLIST EMBED URL]]).
   - Sekmeye tıklanınca: sekme aria-pressed ile vurgulanır, plak kısa bir hızlanmayla döner,
     ekolayzır bir an hızlanır ve Spotify <iframe>'i solup yeni listeyi yükleyip yeniden belirir.
   - Standart Spotify <iframe> Embed: API anahtarı ya da token gerekmez.
   - "Şimdi çalıyor" satırı ve iframe başlığı TR/EN; dil değişince (he:lang) yeniden yazılır.
   ========================================================================== */
(function () {
  "use strict";

  var player = document.querySelector("[data-player]");
  if (!player) return;
  var tabs = Array.prototype.slice.call(player.querySelectorAll("[data-playlist]"));
  var frame = player.querySelector("[data-player-frame]");
  var embed = player.querySelector("[data-player-embed]");
  var vinyl = player.querySelector("[data-vinyl]");
  var now = player.querySelector("[data-player-now]");
  var FADE_MS = 320;

  var NAMES = {
    focus:  { tr: "Kodlama & Odak",     en: "Coding & Focus" },
    night:  { tr: "Gece & Yıldızlar",   en: "Night & Stars" },
    violin: { tr: "Keman & Akustik",    en: "Violin & Acoustic" }
  };
  var current = "focus";

  function lang() { return document.documentElement.lang === "en" ? "en" : "tr"; }

  /** "Şimdi çalıyor" satırı ve iframe'in erişilebilir başlığı */
  function label() {
    var l = lang(), name = NAMES[current][l];
    now.textContent = (l === "en" ? "Now playing: " : "Şimdi çalıyor: ") + name;
    frame.title = (l === "en" ? "Spotify playlist: " : "Spotify çalma listesi: ") + name;
  }

  /** CSS animasyonunu baştan oynatır */
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
  }

  var loadTimer = 0;
  function select(tab) {
    var key = tab.getAttribute("data-playlist");
    var src = tab.getAttribute("data-src");
    tabs.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
    replay(vinyl, "is-boost");
    player.classList.add("is-switching");
    window.setTimeout(function () { player.classList.remove("is-switching"); }, 900);
    if (key === current && frame.getAttribute("src") === src) return;
    current = key;
    label();
    // solarak kaybol → yeni listeyi yükle → yüklenince belir (yüklenmezse 3 sn sonra yine görünür)
    embed.classList.add("is-loading");
    window.clearTimeout(loadTimer);
    window.setTimeout(function () {
      frame.setAttribute("src", src);
      loadTimer = window.setTimeout(function () { embed.classList.remove("is-loading"); }, 3000);
    }, FADE_MS);
  }

  frame.addEventListener("load", function () {
    window.clearTimeout(loadTimer);
    embed.classList.remove("is-loading");
  });
  vinyl.addEventListener("animationend", function (e) {
    if (e.animationName === "vinyl-boost") vinyl.classList.remove("is-boost");
  });
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { select(tab); });
  });
  document.addEventListener("he:lang", label);
  label();

  // Doğrulama için (scripts/player-check.mjs)
  window.HE = window.HE || {};
  window.HE.moodPlayer = { current: function () { return current; }, src: function () { return frame.getAttribute("src"); } };
})();
