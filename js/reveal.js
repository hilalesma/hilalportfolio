/* ==========================================================================
   reveal.js — v4 hareket dili
   1. [data-lines]: metin satırlara bölünür; her satır kendi maskesinin (overflow:hidden)
      içinden aşağıdan yukarı kayarak açılır. data-lines="scrub" ise kaydırmaya bağlı ilerler.
      Satırlar gerçek ekran genişliğine göre ölçülür; pencere boyutu ya da dil değişince
      yeniden bölünür. Ekran okuyucular için orijinal metin aria-label olarak korunur.
   2. [data-parallax="0.2"]: öğe kaydırırken farklı hızda kayar (kartlar).
   3. Bölüm başlıkları (main içindeki h1, h2): her kelime kendi maskesinin içinden
      alttan yukarı (translateY(100%) → 0) süzülerek belirir. Büyük başlıklarda (≥ 40 px)
      ardından kelimelerin üzerinden ince bir altın/beyaz ışık yansıması (shimmer) geçer.
      Kelimeler yerinde sarılır: iç içe öğeler (.script, bağlantı, data-lang) bozulmaz.
   Hareket azaltma açıkken hiçbir şey yapılmaz; metin olduğu gibi görünür.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (!gsap || !ST || HE.reduce) return;

  /* ---------- 1. Satır satır maske ---------- */
  var splits = [];

  /** Bir öğenin görünen metnini kelimelere, sonra satırlara böler. */
  function splitLines(el) {
    if (!el.dataset.linesHtml) el.dataset.linesHtml = el.innerHTML; // ilk hali sakla
    el.innerHTML = el.dataset.linesHtml;
    // Görünür dil bloğunu (data-lang) ya da öğenin kendisini böl
    var host = el.querySelector('[data-lang="' + document.documentElement.lang + '"]') || el;
    var text = host.textContent.replace(/\s+/g, " ").trim();
    if (!text) return [];
    host.setAttribute("aria-label", text);
    // İçteki vurgu (ör. .script) biçimini korumak için düğümleri kelime kelime dolaş
    var words = [];
    var walk = function (node, wrapper) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { words.push({ space: true }); return; }
            words.push({ text: part, wrapper: wrapper });
          });
        } else if (child.nodeType === 1) {
          walk(child, child.cloneNode(false));
        }
      });
    };
    walk(host, null);
    host.innerHTML = "";
    var spans = [];
    words.forEach(function (w) {
      if (w.space) { host.appendChild(document.createTextNode(" ")); return; }
      var span = document.createElement("span");
      span.className = "word";
      span.setAttribute("aria-hidden", "true");
      span.style.display = "inline-block";
      if (w.wrapper) { var wrap = w.wrapper.cloneNode(false); wrap.textContent = w.text; span.appendChild(wrap); }
      else span.textContent = w.text;
      host.appendChild(span);
      spans.push(span);
    });
    // Aynı dikey konumdaki kelimeleri bir satırda topla
    var lines = [];
    var lastTop = null;
    spans.forEach(function (s) {
      var top = Math.round(s.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 4) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(s);
    });
    host.innerHTML = "";
    return lines.map(function (group) {
      var line = document.createElement("span");
      line.className = "line";
      line.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.className = "line__inner";
      group.forEach(function (s, i) {
        if (i) inner.appendChild(document.createTextNode(" "));
        inner.appendChild(s);
      });
      line.appendChild(inner);
      host.appendChild(line);
      return inner;
    });
  }

  function build() {
    splits.forEach(function (s) { if (s.tween) { s.tween.scrollTrigger && s.tween.scrollTrigger.kill(); s.tween.kill(); } });
    splits = [];
    document.querySelectorAll("[data-lines]").forEach(function (el) {
      el.style.opacity = "1";
      if (el.hasAttribute("data-words")) return;   // başlıklar kelime kelime açılır (bölüm 3)
      var inners = splitLines(el);
      if (!inners.length) return;
      var scrub = el.dataset.lines === "scrub";
      var tween = gsap.fromTo(inners, { yPercent: 105 }, {
        yPercent: 0,
        ease: scrub ? "none" : "expo.out",
        duration: scrub ? 1 : 1.1,
        stagger: scrub ? 0.4 : 0.08,
        scrollTrigger: scrub
          ? { trigger: el, start: "top 85%", end: "bottom 45%", scrub: 0.6 }
          : { trigger: el, start: "top 88%", once: true }
      });
      splits.push({ el: el, tween: tween });
    });
    ST.refresh();
  }

  /* ---------- 2. Parallax ---------- */
  function parallax() {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var speed = parseFloat(el.dataset.parallax) || 0.15;
      gsap.fromTo(el, { yPercent: speed * 60 }, {
        yPercent: -speed * 60, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ---------- 3. Başlıklar: kelime kelime maske + ışık yansıması ---------- */
  var HEADINGS = "main h1, main h2";
  var SKIP = ".sr-only, .valley, .valley__title,[role='dialog'], [data-no-words], [data-lines='scrub']";
  var SHIMMER_MIN = 40;   // px: bu boyuttan büyük başlıklarda ışık yansıması

  /** Başlığın metin düğümlerini yerinde kelime maskelerine sarar; iç öğeler korunur. */
  function wrapWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var mask = document.createElement("span");
        mask.className = "wmask";
        var inner = document.createElement("span");
        inner.className = "wmask__inner";
        inner.textContent = part;
        mask.appendChild(inner);
        frag.appendChild(mask);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return Array.prototype.slice.call(el.querySelectorAll(".wmask__inner"));
  }

  /** Görünür kelimeler (gizli dil bloğundakiler hariç) */
  function visibleWords(words) {
    return words.filter(function (w) { return w.getClientRects().length > 0; });
  }

  /** Işık yansıması: her kelime kendi rengini korur, bant soldan sağa kelime kelime geçer */
  function shimmer(el, words) {
    visibleWords(words).forEach(function (w, i) {
      w.style.setProperty("--hc", getComputedStyle(w).color);
      w.style.setProperty("--si", i);
    });
    el.classList.add("is-shimmer");
    window.setTimeout(function () { el.classList.remove("is-shimmer"); }, 1600 + words.length * 70);
  }

  function headings() {
    document.querySelectorAll(HEADINGS).forEach(function (el) {
      if (el.matches(SKIP) || el.closest(SKIP)) return;
      el.setAttribute("data-words", "");
      var words = wrapWords(el);
      if (!words.length) return;
      el.style.opacity = "1";
      gsap.set(words, { yPercent: 100 });
      var big = parseFloat(getComputedStyle(el).fontSize) >= SHIMMER_MIN;
      ST.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          var shown = visibleWords(words);
          // gizli dil bloğundaki kelimeler hemen yerine konur (dil değişince hazır olsun)
          gsap.set(words.filter(function (w) { return shown.indexOf(w) < 0; }), { yPercent: 0 });
          gsap.to(shown, {
            yPercent: 0, duration: 1.05, ease: "expo.out", stagger: 0.06,
            onComplete: function () { if (big) shimmer(el, words); }
          });
        }
      });
    });
  }
  headings();   // ölçüm gerektirmez: ilk çizimden önce sarılır, başlık "yanıp sönmez"
  HE.headingReveal = { selector: HEADINGS };

  function start() {
    // Fontlar yüklendikten sonra böl: satır kırılımları doğru ölçülsün
    var go = function () { build(); parallax(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    var timer = 0;
    var lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      if (Math.abs(window.innerWidth - lastW) < 40) return; // mobilde adres çubuğu oynamasını yok say
      lastW = window.innerWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(build, 250);
    });
    document.addEventListener("he:lang", function () { window.setTimeout(build, 30); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
