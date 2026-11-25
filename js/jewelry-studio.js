/* ==========================================================================
   jewelry-studio.js — Ana sayfadaki "Mini Takı Atölyesi" kartı
   - 5 taş butonu (altın, lavanta, inci beyazı, gül kurusu, turkuaz). Tıklanınca bileklikteki
     sıradaki boncuk (1→7; dolunca başa döner) o renge boyanır: büyüme (scale) + parlama.
   - Bilekliğin altındaki satır, boncukların renk kombinasyonuna göre neşeli bir "enerji" mesajı yazar.
   - "Sıfırla" bütün boncukları inci tonuna döndürür.
   - Metinler TR/EN; dil değişince (he:lang) mesaj ve bileklik açıklaması yeniden yazılır.
   - Yalnız transform/opacity canlandırılır (CSS: css/home.css .studio); hareket azaltmada animasyon kısalır.
   ========================================================================== */
(function () {
  "use strict";

  var card = document.querySelector("[data-studio]");
  if (!card) return;
  var beads = Array.prototype.slice.call(card.querySelectorAll("[data-bead]"));
  var msgEl = card.querySelector("[data-studio-msg]");
  var svg = card.querySelector("[data-studio-bracelet]");

  /* Renkler: CSS token'ı + iki dilde ad */
  var STONES = {
    gold:      { css: "var(--stone-gold)",      tr: "altın",        en: "gold" },
    lavender:  { css: "var(--stone-lavender)",  tr: "lavanta",      en: "lavender" },
    pearl:     { css: "var(--stone-pearl)",     tr: "inci beyazı",  en: "pearl white" },
    rose:      { css: "var(--stone-rose)",      tr: "gül kurusu",   en: "dusty rose" },
    turquoise: { css: "var(--stone-turquoise)", tr: "turkuaz",      en: "turquoise" }
  };

  /* Enerji mesajları: baskın renk, öne çıkan iki rengin ikilisi ve özel durumlar */
  var MSG = {
    start:     { tr: "Bir taş seç, enerjini birlikte bulalım ✦", en: "Pick a stone and let's find your energy ✦" },
    gold:      { tr: "Kodlama & Kahve Modu ✦",          en: "Coding & Coffee Mode ✦" },
    lavender:  { tr: "Gece İlhamı & Tasarım ✿",         en: "Night Inspiration & Design ✿" },
    turquoise: { tr: "Antalya Sahil Enerjisi ✦",        en: "Antalya Seaside Energy ✦" },
    pearl:     { tr: "Sakin Odak & Zarafet ✿",          en: "Calm Focus & Elegance ✿" },
    rose:      { tr: "Romantik Eskiz Günü ✿",           en: "Romantic Sketch Day ✿" },
    "gold+lavender":      { tr: "Gece Yarısı Kod & Tasarım ✦",   en: "Midnight Code & Design ✦" },
    "gold+turquoise":     { tr: "Güneşli Sahil & Kahve ✦",       en: "Sunny Shore & Coffee ✦" },
    "lavender+rose":      { tr: "Pastel Hayaller & Eskizler ✿",  en: "Pastel Dreams & Sketches ✿" },
    "pearl+rose":         { tr: "Zarif Takı Günü ✿",             en: "Elegant Jewelry Day ✿" },
    "lavender+turquoise": { tr: "Deniz Kenarında İlham ✦",       en: "Seaside Inspiration ✦" },
    "gold+pearl":         { tr: "Parlak Fikirler Modu ✦",        en: "Bright Ideas Mode ✦" },
    rainbow:   { tr: "Gökkuşağı Yaratıcılık Modu ✦✿",   en: "Rainbow Creativity Mode ✦✿" },
    mono:      { tr: "Tek Renk, Tam Odak ✦",            en: "One Color, Full Focus ✦" }
  };

  var colors = [null, null, null, null, null, null, null];   // her boncuğun rengi
  var next = 0;            // sıradaki boncuk
  var last = null;         // son seçilen renk
  var current = "start";   // gösterilen mesajın anahtarı

  function lang() { return document.documentElement.lang === "en" ? "en" : "tr"; }

  /** Boncukların renklerine göre mesaj anahtarını seçer */
  function pickMessage() {
    var counts = {}, filled = 0;
    colors.forEach(function (c) { if (c) { counts[c] = (counts[c] || 0) + 1; filled++; } });
    if (!filled) return "start";
    var keys = Object.keys(counts);
    if (keys.length === 5) return "rainbow";
    if (filled === 7 && keys.length === 1) return "mono";
    // en çok kullanılan renkler (eşitlikte son seçilen öne geçer)
    keys.sort(function (a, b) { return (counts[b] - counts[a]) || (b === last) - (a === last); });
    if (keys.length >= 2) {
      var pair = [keys[0], keys[1]].sort().join("+");
      if (MSG[pair]) return pair;
    }
    return keys[0];
  }

  /** Mesajı yumuşak bir geçişle değiştirir */
  function showMessage(key, instant) {
    current = key;
    var text = MSG[key][lang()];
    if (instant || msgEl.textContent === text) { msgEl.textContent = text; return; }
    msgEl.classList.add("is-swap");
    window.setTimeout(function () {
      msgEl.textContent = MSG[current][lang()];   // bu arada dil değişmiş olabilir: güncel dilde yaz
      msgEl.classList.remove("is-swap");
    }, 200);
  }

  /** Ekran okuyucu için bilekliğin güncel açıklaması */
  function describe() {
    var l = lang(), names = [];
    colors.forEach(function (c) { if (c) names.push(STONES[c][l]); });
    var label = l === "tr"
      ? (names.length ? "Bileklik: 7 boncuktan " + names.length + " tanesi boyalı (" + names.join(", ") + ")" : "Bileklik: 7 boş boncuk")
      : (names.length ? "Bracelet: " + names.length + " of 7 beads colored (" + names.join(", ") + ")" : "Bracelet: 7 empty beads");
    svg.setAttribute("aria-label", label);
  }

  /** Animasyonu yeniden başlatır (aynı boncuk art arda boyanabilir) */
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.getBoundingClientRect();   // yeniden akış: animasyon baştan oynar
    el.classList.add(cls);
  }

  function paint(stone) {
    var bead = beads[next];
    colors[next] = stone;
    last = stone;
    bead.style.setProperty("--c", STONES[stone].css);
    bead.classList.add("is-filled");
    replay(bead, "is-pop");
    next = (next + 1) % beads.length;
    showMessage(pickMessage());
    describe();
  }

  function reset() {
    beads.forEach(function (bead, i) {
      if (!colors[i]) return;
      replay(bead, "is-clearing");
      bead.classList.remove("is-filled", "is-pop");
      bead.style.removeProperty("--c");
    });
    colors = colors.map(function () { return null; });
    next = 0;
    last = null;
    showMessage("start");
    describe();
  }

  card.querySelectorAll("[data-stone]").forEach(function (btn) {
    btn.addEventListener("click", function () { paint(btn.getAttribute("data-stone")); });
  });
  card.querySelector("[data-studio-reset]").addEventListener("click", reset);
  // animasyon bitince sınıfı temizle (bir sonraki tıklamada yeniden oynasın)
  beads.forEach(function (bead) {
    bead.addEventListener("animationend", function (e) {
      if (e.animationName === "bead-clear") bead.classList.remove("is-clearing");
    });
  });
  document.addEventListener("he:lang", function () { showMessage(current, true); describe(); });

  showMessage("start", true);
  describe();

  // Doğrulama için (scripts/studio-check.mjs)
  window.HE = window.HE || {};
  window.HE.studio = { colors: function () { return colors.slice(); }, next: function () { return next; }, message: function () { return msgEl.textContent; } };
})();
