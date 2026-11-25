/* ==========================================================================
   magnetic.js — Ana aksiyon butonlarında manyetik çekim
   - Hedefler: üst bardaki "İletişime geç" (.nav-cta), ana sayfa pill butonları (.pill-cta),
     dolu butonlar (.btn--solid) ve data-magnetic işaretli her öğe.
   - İmleç butonun üzerine ya da çevresindeki çekim alanına (RADIUS) girince buton imleci
     hafifçe takip eder; etiket biraz daha az hareket eder (katmanlı his).
   - İmleç uzaklaşınca buton cubic-bezier(0.22, 1, 0.36, 1) eğrisiyle (hızlı başlayıp yumuşakça
     yavaşlayan yay hissi) RETURN_S saniyede merkezine döner. Eğri JS'te çözülür (cubicBezier).
   - Hareket CSS "translate" özelliğine yazılır; "transform" kullanan mevcut hover
     efektleriyle (yükselme, ölçek) çakışmaz, onlarla birleşir.
   - Yalnız fareli cihazlarda (hover + ince imleç) çalışır; hareket azaltma açıkken kapalıdır.
   - Tek requestAnimationFrame döngüsü; bütün butonlar durunca döngü de durur.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  if (HE.reduce) return;
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var SELECTOR = ".nav-cta, .pill-cta, .btn--solid, [data-magnetic]";
  var RADIUS = 70;        // px: butonun kenarından itibaren çekim alanı
  var STRENGTH = 0.32;    // imleç–merkez farkının ne kadarı izlenir
  var MAX = 16;           // px: en fazla kayma
  var FOLLOW = 14;        // izleme yumuşaklığı (büyük = daha çabuk yetişir)
  var RETURN_S = 0.8;     // sn: merkeze dönüş süresi

  /** CSS cubic-bezier(x1, y1, x2, y2) ile aynı eğri: t (0–1 zaman) → ilerleme (0–1) */
  function cubicBezier(x1, y1, x2, y2) {
    function bx(t) { return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t; }
    function by(t) { return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t; }
    return function (x) {
      // x'e karşılık gelen eğri parametresini ikiye bölme yöntemiyle bul
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 20; i++) { if (bx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return by(t);
    };
  }
  var returnEase = cubicBezier(0.22, 1, 0.36, 1);

  var items = [];
  var pointer = { x: -1e4, y: -1e4 };
  var raf = 0, last = 0;

  /** Sayfadaki hedefleri toplar (mobil menüdeki kopya hariç); daha önce eklenenlerin durumu korunur */
  function collect() {
    Array.prototype.forEach.call(document.querySelectorAll(SELECTOR), function (el) {
      if (el.closest(".mobile-menu") || el.classList.contains("is-magnetic")) return;
      el.classList.add("is-magnetic");
      // iç öğeler (etiket, ikon) butondan biraz daha az kayar
      items.push({ el: el, x: 0, y: 0, tx: 0, ty: 0, active: false, back: null, inner: Array.prototype.slice.call(el.children) });
    });
  }

  /** İmlece göre her butonun hedef kaymasını hesaplar */
  function aim() {
    items.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      // butonun kendi kaymasını çıkararak "dinlenme" konumunu bul
      var cx = r.left + r.width / 2 - it.x;
      var cy = r.top + r.height / 2 - it.y;
      var dx = pointer.x - cx, dy = pointer.y - cy;
      var inside = Math.abs(dx) < r.width / 2 + RADIUS && Math.abs(dy) < r.height / 2 + RADIUS;
      if (inside && r.width > 0) {
        it.tx = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
        it.ty = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));
        it.active = true;
        it.back = null;
      } else if (it.active) {
        // alan dışına çıkıldı: bulunduğu yerden merkeze eğriyle dönüş başlar
        it.active = false;
        it.tx = 0; it.ty = 0;
        it.back = { x: it.x, y: it.y, t: 0 };
      }
    });
  }

  function frame(now) {
    var dt = Math.min((now - (last || now)) / 1000, 0.032);
    last = now;
    var moving = false;
    items.forEach(function (it) {
      if (it.back) {
        // dönüş: cubic-bezier(0.22, 1, 0.36, 1)
        it.back.t = Math.min(1, it.back.t + dt / RETURN_S);
        var k = 1 - returnEase(it.back.t);
        it.x = it.back.x * k;
        it.y = it.back.y * k;
        if (it.back.t >= 1) { it.back = null; it.x = it.y = 0; } else { moving = true; }
      } else if (it.active) {
        // izleme: hedefe üstel yumuşatmayla yaklaş
        var f = 1 - Math.exp(-dt * FOLLOW);
        it.x += (it.tx - it.x) * f;
        it.y += (it.ty - it.y) * f;
        if (Math.abs(it.tx - it.x) > 0.05 || Math.abs(it.ty - it.y) > 0.05) moving = true;
      }
      var v = it.x.toFixed(2) + "px " + it.y.toFixed(2) + "px";
      if (it.el.style.translate !== v) it.el.style.translate = (it.x || it.y) ? v : "";
      var iv = (it.x || it.y) ? (it.x * 0.35).toFixed(2) + "px " + (it.y * 0.35).toFixed(2) + "px" : "";
      it.inner.forEach(function (c) { c.style.translate = iv; });
    });
    raf = moving ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    aim(); kick();
  }, { passive: true });
  // imleç pencereden çıkınca hepsi yerine döner
  document.documentElement.addEventListener("pointerleave", function () {
    pointer.x = pointer.y = -1e4; aim(); kick();
  });
  // kaydırırken buton imlecin altından kayar: hedefi yeniden hesapla
  window.addEventListener("scroll", function () { aim(); kick(); }, { passive: true });

  collect();
  // sonradan üretilen içerikler (ör. projeler sayfası) için HE.magnetic.refresh() çağrılabilir

  HE.magnetic = { refresh: collect };
  window.HE = HE;
})();
