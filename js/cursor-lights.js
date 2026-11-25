/* ==========================================================================
   cursor-lights.js — İmleç kıvılcımları (tüm sayfalarda aynı davranış)
   Sitenin imza efekti. Tek, tam ekran, sabit bir <canvas> (pointer-events: none) üzerinde çizilir.
   Referans: orchestrated.nl'deki sıcak kıvılcım/köz parçacıkları (iz değil, havada dağılan ışık öbekleri).

   Davranış
   - Kümeler: imleç hareket ettikçe çevresinde 2–6 parçacıklık düzensiz ışık öbekleri doğar.
     Hız arttıkça hem küme sayısı hem de imleç çevresindeki yayılma yarıçapı büyür.
   - Atalet: her kıvılcım imlecin hızından bir pay alıp dışa savrulur; imlece bağlı değildir,
     imleç geçtikten sonra da süzülmeye devam eder ve yavaşça (sürtünmeyle) durur.
   - Organik hareket: konuma ve zamana göre dönen bir akış alanı kıvılcımları kıvrımlı yollara sokar;
     köz gibi hafifçe yükselirler. Ömür 0.9–2.7 sn: hızla belirir, titreyerek ve yavaşça söner.
   - Derinlik: her kıvılcımın bir derinliği (z) var: yakındakiler iri, parlak ve hızlı; uzaktakiler
     minik, sönük ve yavaş. Boy dağılımı çoğunlukla minik, azı iri.
   - Işık: beyaz-sıcak çekirdekli yumuşak ışık lekesi + hızlı kıvılcımlarda hareket yönünde kısa iz;
     toplamalı (additive) karışım ve tuval üzerinde sıcak drop-shadow (css/ambient.css).
   - Renk dağılımı: kehribar ve şeftali ağırlıklı; sıcak beyaz, pembe, lavanta ve az altın.
   - Bekleme: imleç durunca yanından ara ara sönük kıvılcımlar yükselir.
   - Bağlantı / buton üzerinde: kıvılcımlar o öğenin kenarlarına doğru süzülür.
   - Tıklama: düzensiz bir kıvılcım patlaması.
   - Sayfa geçişi: başka bir sayfaya giden site içi bağlantıya tıklanınca kıvılcımlar imlecin olduğu
     noktadan her yöne hızlanarak dağılır, sayfa aynı anda perdeyle kapanır ve ~0.9 sn sonra yeni sayfa
     açılır. Yeni sekme, harici, mailto: ve tel: bağlantılarında dağılma olmaz. Geri tuşuyla dönülünce
     (bfcache) kıvılcımlar yeniden belirir.
   - Vadi intro'su oynarken yoğunluk azalır: vadinin kendi "imlece yakın noktalar parlar" etkisiyle
     birleşir, çift efekt gibi görünmez.
   - Dokunmatik: parmak sürüklenirken kıvılcım, dokununca küçük patlama, geçişte dağılma.
   - Modlar (sağ alttaki hap düğme): Çiçek ✿ (pastel nokta, çiçek ve yıldızlar; varsayılan),
     Yıldız Tozu ✦ (altın/şampanya parıltılar), Müzik Notaları ♪ (lavanta/altın ♪ ♫, seyrek ve yükselen).
     Seçim localStorage "he-cursor" ile bütün sayfalarda sürer.

   Performans ve erişilebilirlik
   - Tek requestAnimationFrame döngüsü, delta-time ile hareket, DPR ≤ 2, pencere boyutu değişince
     tuval yeniden boyutlanır. Nesne havuzu: en fazla ~650 kıvılcım (mobilde ~240); FPS düşerse
     sayı otomatik azalır, toparlanınca geri artar. Ekran dışına çıkan kıvılcımlar hemen geri dönüştürülür.
   - Sistem imleci gizlenmez. Hareket azaltma açıkken modül hiç çalışmaz (geçişler anında olur).
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  if (HE.reduce) return;
  var html = document.documentElement;

  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var MAX_START = coarse ? 240 : 650;      // aynı anda en fazla parçacık (FPS düşerse azalır); yazıyı kapatmasın diye seyrek
  var maxParticles = MAX_START;

  /* ---------- Tuval (tek tuval; DPR ≤ 2) ---------- */
  var canvas = document.createElement("canvas");
  canvas.className = "cursor-lights";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Parçacık şekilleri (sprite) ----------
     Her şekil bir kez küçük bir tuvale çizilir, sonra her karede drawImage ile kopyalanır (hızlı).
     Çizim boyu = min + yarıçap × scale (px). */
  function canvasOf(size) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    return c;
  }
  /** Yuvarlak ışık noktası: beyaz-sıcak çekirdek, dolu disk, yumuşak hale */
  function dot(hex) {
    var s = 32, c = canvasOf(s), g = c.getContext("2d");
    var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.18, hex);
    grad.addColorStop(0.42, hex);
    grad.addColorStop(0.55, hex + "55");
    grad.addColorStop(1, hex + "00");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return { img: c, min: 0, scale: 4.6 };
  }
  /** Beş yapraklı küçük çiçek + çevresinde hafif ışık */
  function flower(hex) {
    var s = 48, c = canvasOf(s), g = c.getContext("2d");
    var halo = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    halo.addColorStop(0, hex + "66");
    halo.addColorStop(1, hex + "00");
    g.fillStyle = halo;
    g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2);
    g.fillStyle = hex;
    for (var i = 0; i < 5; i++) {
      g.rotate((Math.PI * 2) / 5);
      g.beginPath();
      g.ellipse(0, -7.5, 4.2, 7, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#FFF6E2";
    g.beginPath(); g.arc(0, 0, 3.2, 0, Math.PI * 2); g.fill();
    return { img: c, min: 5, scale: 4.2 };
  }
  /** Dört köşeli ışıltı (yıldız) */
  function sparkle(hex) {
    var s = 48, c = canvasOf(s), g = c.getContext("2d");
    var halo = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    halo.addColorStop(0, "rgba(255,255,255,0.9)");
    halo.addColorStop(0.2, hex + "88");
    halo.addColorStop(1, hex + "00");
    g.fillStyle = halo;
    g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2);
    g.fillStyle = hex;
    g.beginPath();
    g.moveTo(0, -20); g.quadraticCurveTo(2, -2, 20, 0); g.quadraticCurveTo(2, 2, 0, 20);
    g.quadraticCurveTo(-2, 2, -20, 0); g.quadraticCurveTo(-2, -2, 0, -20);
    g.fill();
    return { img: c, min: 4, scale: 5.2 };
  }
  /** Müzik notası (♪ ya da ♫), yumuşak parlamayla */
  function note(hex, ch) {
    var s = 64, c = canvasOf(s), g = c.getContext("2d");
    g.font = "40px 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Apple Symbols', 'DejaVu Sans', serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = hex;
    g.shadowBlur = 10;
    g.fillStyle = hex;
    g.fillText(ch, s / 2, s / 2 + 2);
    g.shadowBlur = 0;
    g.fillText(ch, s / 2, s / 2 + 2);
    return { img: c, min: 24, scale: 3 };   // okunur boy: ~26–36 px (glif ~16–22 px)
  }

  /* ---------- İmleç modları (sağ alttaki hap buton değiştirir, tercih localStorage'da) ----------
     density: iz yoğunluğu çarpanı (notalar iri olduğu için seyrek); rise: ek yükselme (px/sn²) */
  function set(list) {
    var total = list.reduce(function (a, s) { return a + s.w; }, 0);
    return list.map(function (s) { s.w /= total; return s; });
  }
  var MODES = {
    flowers: {
      icon: "✿", tr: "Çiçek", en: "Flowers", density: 0.75, rise: 0,
      // pastel çiçek/yıldız ışıltıları: pudra, lavanta, şeftali, krem
      sprites: set([
        Object.assign(dot("#FFC9D6"), { w: 0.17 }), Object.assign(dot("#C9B2FF"), { w: 0.17 }),
        Object.assign(dot("#FFCFAE"), { w: 0.13 }), Object.assign(dot("#FFF1E0"), { w: 0.13 }),
        Object.assign(flower("#FFB7C8"), { w: 0.12 }), Object.assign(flower("#C9A2FF"), { w: 0.1 }),
        Object.assign(flower("#FFC9A0"), { w: 0.08 }), Object.assign(sparkle("#FFF1E0"), { w: 0.1 })
      ])
    },
    stardust: {
      icon: "✦", tr: "Yıldız Tozu", en: "Stardust", density: 1, rise: 0,
      // sıcak altın ve şampanya parıltıları
      sprites: set([
        Object.assign(dot("#FFD08A"), { w: 0.3 }), Object.assign(dot("#FFE4C4"), { w: 0.24 }),
        Object.assign(dot("#FFB873"), { w: 0.12 }), Object.assign(dot("#FFF8F0"), { w: 0.08 }),
        Object.assign(sparkle("#FFD08A"), { w: 0.14 }), Object.assign(sparkle("#FFE9C8"), { w: 0.12 })
      ])
    },
    notes: {
      icon: "♪", tr: "Müzik Notaları", en: "Music Notes", density: 0.1, rise: 16, max: 70,
      // keman/müzik: lavanta ve altın tonlarında süzülen ♪ ve ♫
      sprites: set([
        Object.assign(note("#C9B2FF", "♪"), { w: 0.3 }), Object.assign(note("#C9B2FF", "♫"), { w: 0.2 }),
        Object.assign(note("#FFD08A", "♪"), { w: 0.28 }), Object.assign(note("#FFD08A", "♫"), { w: 0.22 })
      ])
    }
  };
  var ORDER = ["flowers", "stardust", "notes"];
  var modeKey = (HE.store && HE.store.get("localStorage", "he-cursor")) || "flowers";
  if (!MODES[modeKey]) modeKey = "flowers";
  var effect = MODES[modeKey];   // etkin imleç efekti (spawn() içindeki mode parametresiyle karışmasın)

  /** Etkin moddan ağırlığa göre bir şekil seçer */
  function pickColor() {
    var r = Math.random(), acc = 0, list = effect.sprites;
    for (var i = 0; i < list.length; i++) { acc += list[i].w; if (r <= acc) return list[i]; }
    return list[0];
  }

  /* ---------- Nesne havuzu ---------- */
  var MODE = { SPARK: 0, IDLE: 1, BURST: 2, GATHER: 3, DISPERSE: 4 };
  var pool = [];
  for (var i = 0; i < MAX_START + 200; i++) pool.push({ alive: false });
  var aliveCount = 0;
  var freeHint = 0;   // boş yuva aramaya buradan başla (her karede baştan taramamak için)

  /** Normal dağılımlı rastgele sayı (yolun çevresinde yoğun merkez, seyrek kenar). */
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Havuzdan bir parçacık alır. z: derinlik (0.35 uzak/sönük/küçük … 1 yakın/parlak/iri). */
  function spawn(x, y, mode, opts) {
    if (aliveCount >= maxParticles && mode !== MODE.DISPERSE) return null;
    // iri şekilli modlarda (notalar) aynı anda en fazla effect.max tane: yazıyı kapatmasın
    if (effect.max && aliveCount >= effect.max && mode !== MODE.DISPERSE) return null;
    var p = null;
    for (var j = 0; j < pool.length; j++) {
      var idx = (freeHint + j) % pool.length;
      if (!pool[idx].alive) { p = pool[idx]; freeHint = idx + 1; break; }
    }
    if (!p) return null;
    opts = opts || {};
    p.alive = true;
    p.mode = mode;
    p.x = x; p.y = y;
    p.vx = opts.vx || 0; p.vy = opts.vy || 0;
    p.age = 0;
    p.z = opts.z || 0.35 + Math.random() * 0.65;
    // yarıçap (px): çoğu minik nokta, azı iri; yakın olanlar daha büyük
    p.size = opts.size || (1.1 + Math.pow(Math.random(), 2) * 2.4) * (0.6 + 0.55 * p.z);
    p.life = opts.life || 1.6 + Math.random() * 1.8;          // 1.6–3.4 sn
    p.sprite = pickColor();                                    // etkin moddan şekil + renk
    p.rise = effect.rise;                                        // notalar ek olarak yükselir
    if (effect.rise && !opts.life) p.life *= 1.2;
    p.seed = Math.random() * 1000;
    p.flick = 2 + Math.random() * 5;                           // hafif ışıldama hızı
    p.tx = 0; p.ty = 0;
    aliveCount++;
    return p;
  }
  function kill(p) { if (p.alive) { p.alive = false; aliveCount--; } }

  /* ---------- İmleç durumu ---------- */
  var cursor = { x: W / 2, y: H / 2, px: W / 2, py: H / 2, vx: 0, vy: 0, speed: 0, seen: false, still: 0 };
  var hoverEl = null;          // üzerinde durulan bağlantı / buton
  var leaving = false;         // sayfa geçişi başladı

  function onMove(x, y) {
    cursor.x = x; cursor.y = y;
    cursor.seen = true;
    cursor.still = 0;
  }
  window.addEventListener("pointermove", function (e) {
    onMove(e.clientX, e.clientY);
    var el = e.target.closest && e.target.closest("a[href], button, [role='button']");
    hoverEl = el && !el.closest(".cursor-lights") ? el : null;
  }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    onMove(e.clientX, e.clientY);
    burst(e.clientX, e.clientY, coarse ? 40 : 90);
  }, { passive: true });
  // Dokunmatik: parmak sürüklenirken parçacık (pointermove kaydırmada kesilebilir)
  window.addEventListener("touchmove", function (e) {
    var t = e.touches[0];
    if (t) onMove(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener("pointerleave", function () { cursor.seen = false; hoverEl = null; });

  /** Tıklama: ışık bulutu kısa bir patlamayla dışa açılır */
  function burst(x, y, n) {
    n = Math.round(n * Math.max(0.35, effect.density));   // iri şekillerde (nota) daha az parçacık
    for (var k = 0; k < n; k++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 30 + Math.pow(Math.random(), 0.8) * 180;
      spawn(x + gauss() * 6, y + gauss() * 6, MODE.BURST,
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.0 + Math.random() * 1.2 });
    }
  }

  /* ---------- Zemine göre görünüm ---------- */
  var valley = document.getElementById("vadi");
  var nightTheme = !!document.querySelector('link[href$="theme-night.css"]');
  function isDark() {
    // gece teması (css/theme-night.css): bütün sayfalar koyu zeminli → her yerde aynı toplamalı ışık
    if (nightTheme) return true;
    if (html.classList.contains("intro-play")) return true;
    if (!valley) return false;
    return cursor.y < valley.getBoundingClientRect().bottom;   // imleç hâlâ vadinin üstünde mi
  }

  /** Organik akış alanı: konuma ve zamana göre yavaşça dönen yön (bulutun kıvrılarak açılması). */
  function flowAngle(x, y, t) {
    return Math.sin(x * 0.0042 + t * 0.3) * Math.cos(y * 0.0037 - t * 0.23) * Math.PI * 1.6 +
      Math.sin((x - y) * 0.0019 + t * 0.15) * Math.PI;
  }

  /* ---------- Döngü (tek requestAnimationFrame; her şey delta-time ile) ---------- */
  var last = performance.now();
  var trailAcc = 0, gatherAcc = 0, idleAcc = 0;
  var fps = { frames: 0, time: 0 };

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    var t = now / 1000;
    var dark = isDark();
    var intro = html.classList.contains("intro-play");

    // İmleç hızı ve yönü (piksel/sn), yumuşatılmış
    var dx = cursor.x - cursor.px, dy = cursor.y - cursor.py;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var inv = 1 / Math.max(dt, 0.001);
    cursor.vx += (dx * inv - cursor.vx) * Math.min(1, dt * 12);
    cursor.vy += (dy * inv - cursor.vy) * Math.min(1, dt * 12);
    cursor.speed = Math.sqrt(cursor.vx * cursor.vx + cursor.vy * cursor.vy);
    cursor.still += dt;

    // Doğum: imlecin kat ettiği YOL boyunca (piksel başına) yoğun bir ışık şeridi.
    // Hız arttıkça şerit hem daha yoğun hem daha geniş (imlecin iki yanına normal dağılımla yayılır).
    if (cursor.seen && !leaving) {
      var density = (intro ? 0.45 : 1) * effect.density;
      if (hoverEl) {
        // bağlantı/buton üzerinde: kenarlarına doğru süzülen parçacıklar
        gatherAcc += 40 * density * dt;
        while (gatherAcc >= 1) {
          gatherAcc -= 1;
          var g = spawn(cursor.x + gauss() * 8, cursor.y + gauss() * 8, MODE.GATHER,
            { vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 1.0 + Math.random() * 0.9 });
          if (g) perimeterPoint(hoverEl, g);
        }
      }
      if (dist > 0.5) {
        var sp = Math.min(cursor.speed, 3000);
        trailAcc += dist * (0.4 + Math.min(sp, 1500) / 1500 * 0.35) * density;  // parçacık / piksel
        var n = Math.min(Math.floor(trailAcc), 55);                             // bir karede en fazla
        trailAcc -= n;
        var spread = 16 + sp * 0.045;                                            // şerit genişliği (σ)
        var nx = dist ? -dy / dist : 0, ny = dist ? dx / dist : 0;               // harekete dik yön
        for (var k = 0; k < n; k++) {
          var f = Math.random();                                                 // bu karedeki yol üzerinde konum
          var off = gauss() * spread;
          var along = gauss() * spread * 0.45;
          var bx = cursor.px + dx * f + nx * off + (dx / (dist || 1)) * along;
          var by = cursor.py + dy * f + ny * off + (dy / (dist || 1)) * along;
          var a = Math.random() * Math.PI * 2, kick = 10 + Math.pow(Math.random(), 1.6) * 80;
          spawn(bx, by, MODE.SPARK, {
            vx: cursor.vx * (0.02 + Math.random() * 0.06) + Math.cos(a) * kick + nx * off * 0.6,
            vy: cursor.vy * (0.02 + Math.random() * 0.06) + Math.sin(a) * kick + ny * off * 0.6
          });
        }
      } else if (cursor.still > 0.3 && !hoverEl) {
        // bekleme: imlecin çevresinde ara ara beliren tek tük ışık noktaları
        idleAcc += 6 * density * dt;
        while (idleAcc >= 1) {
          idleAcc -= 1;
          var ia = Math.random() * Math.PI * 2, ir = 6 + Math.random() * 22;
          spawn(cursor.x + Math.cos(ia) * ir, cursor.y + Math.sin(ia) * ir, MODE.IDLE,
            { vx: Math.cos(ia) * 10, vy: Math.sin(ia) * 10 - 8, z: 0.4 + Math.random() * 0.5 });
        }
      }
    }
    cursor.px = cursor.x; cursor.py = cursor.y;

    // Güncelle ve çiz
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";   // üst üste binen noktalar ışık bulutu gibi parlar
    var alphaScale = intro ? 0.75 : 0.85;
    // tuvalin parlama (drop-shadow) tonu zemine göre değişir (css/ambient.css)
    if (canvas.classList.contains("is-light") === dark) canvas.classList.toggle("is-light", !dark);
    var drag = Math.exp(-dt * 1.3);              // yumuşak yavaşlama: imleç geçtikten sonra da süzülür

    for (var q = 0; q < pool.length; q++) {
      var pt = pool[q];
      if (!pt.alive) continue;
      pt.age += dt;
      if (pt.age >= pt.life || pt.x < -40 || pt.x > W + 40 || pt.y < -40 || pt.y > H + 40) { kill(pt); continue; }
      var k01 = pt.age / pt.life;

      if (pt.mode === MODE.DISPERSE) {
        pt.vx *= 1 + dt * 2.6;                   // sayfa geçişi: hızlanarak dağılır
        pt.vy *= 1 + dt * 2.6;
      } else {
        // bulut yavaşça kıvrılarak açılır ve hafifçe yükselir
        var fa = flowAngle(pt.x, pt.y, t + pt.seed * 0.001);
        var force = 26 * (0.5 + 0.5 * pt.z);
        pt.vx += Math.cos(fa) * force * dt;
        pt.vy += Math.sin(fa) * force * dt - (7 + pt.rise) * dt;
        if (pt.mode === MODE.GATHER) {
          pt.vx += (pt.tx - pt.x) * 5 * dt;
          pt.vy += (pt.ty - pt.y) * 5 * dt;
        }
        pt.vx *= drag;
        pt.vy *= drag;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;

      // Parlaklık: hızlı belirme, uzun bekleme, son üçte birde yavaş sönme; uzaktakiler sönük
      var fadeIn = Math.min(1, pt.age / 0.08);
      var fadeOut = k01 < 0.55 ? 1 : 1 - (k01 - 0.55) / 0.45;
      var shimmer = 0.82 + 0.18 * Math.sin(t * pt.flick + pt.seed);
      var alpha = fadeIn * fadeOut * fadeOut * shimmer * (0.45 + 0.55 * pt.z) * alphaScale;
      var r = pt.size * (1 - k01 * 0.25);
      if (pt.mode === MODE.DISPERSE) { r = pt.size * (1.2 + k01 * 1.6); alpha = (1 - k01 * k01) * 1.1; }
      if (alpha <= 0.01) continue;
      ctx.globalAlpha = Math.min(1, alpha);
      var spr = pt.sprite;
      var s = spr.min + r * spr.scale;           // nokta: dolu disk ≈ yarıçap r; çiçek/nota: okunur en küçük boy
      ctx.drawImage(spr.img, pt.x - s / 2, pt.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    adapt(dt);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);

  /** Bağlantının / butonun çevresinde rastgele bir nokta seçer (toplanma hedefi). */
  function perimeterPoint(el, p) {
    var r = el.getBoundingClientRect();
    var pad = 6, w = r.width + pad * 2, h = r.height + pad * 2;
    var d = Math.random() * 2 * (w + h);
    var x, y;
    if (d < w) { x = d; y = 0; }
    else if (d < w + h) { x = w; y = d - w; }
    else if (d < 2 * w + h) { x = 2 * w + h - d; y = h; }
    else { x = 0; y = 2 * (w + h) - d; }
    p.tx = r.left - pad + x;
    p.ty = r.top - pad + y;
  }

  /** FPS düşerse aynı anda yaşayabilecek parçacık sayısı azalır, toparlanınca geri artar. */
  function adapt(dt) {
    fps.frames++; fps.time += dt;
    if (fps.time < 2) return;
    var avg = fps.frames / fps.time;
    fps.frames = 0; fps.time = 0;
    if (avg < 45 && maxParticles > 200) maxParticles = Math.round(maxParticles * 0.75);
    else if (avg > 57 && maxParticles < MAX_START) maxParticles = Math.min(MAX_START, maxParticles + 60);
    canvas.dataset.max = String(maxParticles);
  }

  /* ---------- Sayfa geçişinde dağılma ----------
     Partiküller tıklama noktasından savrulur; perdeyi site.js'teki gece perdesi (HE.leaveTo) kapatır. */

  function isPageLink(a, event) {
    if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return false;
    if (a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href") || "";
    if (/^(mailto|tel|javascript):/i.test(href) || href.charAt(0) === "#") return false;
    var url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return false;              // harici
    if (url.pathname === window.location.pathname) return false;          // aynı sayfa
    return /\.html$|\/$/.test(url.pathname);
  }

  document.addEventListener("click", function (event) {
    var a = event.target.closest && event.target.closest("a[href]");
    if (!isPageLink(a, event)) return;
    event.preventDefault();
    // klavyeyle (Enter) açılan bağlantıda dağılma bağlantının ortasından başlar
    var x = cursor.x, y = cursor.y;
    if (event.detail === 0 || !cursor.seen) {
      var r = a.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    disperse(x, y, a.href);
  }, true);   // yakalama evresi: site.js'teki genel perdeden önce

  function disperse(x, y, href) {
    if (leaving) return;
    leaving = true;
    // mevcut partiküller de patlama noktasından uzağa savrulur
    for (var j = 0; j < pool.length; j++) {
      var p = pool[j];
      if (!p.alive) continue;
      var ax = p.x - x, ay = p.y - y, l = Math.sqrt(ax * ax + ay * ay) || 1;
      p.mode = MODE.DISPERSE; p.age = 0; p.life = 0.9;
      p.vx = (ax / l) * (260 + Math.random() * 300);
      p.vy = (ay / l) * (260 + Math.random() * 300);
    }
    var count = Math.round((coarse ? 120 : 260) * Math.max(0.3, effect.density));
    for (var k = 0; k < count; k++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 160 + Math.pow(Math.random(), 0.6) * 560;
      spawn(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, MODE.DISPERSE,
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.75 + Math.random() * 0.25,
          size: 1.0 + Math.pow(Math.random(), 2) * 2.4 });
    }
    if (HE.leaveTo) HE.leaveTo(href);
    else window.setTimeout(function () { window.location.href = href; }, 650);
  }

  // Geri tuşuyla dönüldüğünde (bfcache) her şey sıfırlanır, partiküller yeniden belirir
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    leaving = false;
    for (var j = 0; j < pool.length; j++) kill(pool[j]);
    last = performance.now();
  });

  // Doğrulama için (scripts/cursor-check.mjs)
  /* ---------- İmleç modu düğmesi (sağ alt köşe, tüm sayfalarda) ----------
     Her tıklamada Çiçek ✿ → Yıldız Tozu ✦ → Müzik Notaları ♪ sırasıyla değişir; seçim localStorage
     ("he-cursor") ile hatırlanır, böylece diğer sayfalarda da aynı efekt sürer. */
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "cursor-mode";
  // metin solda, mod ikonu sağdaki küçük cam kürede: "İmleç: Çiçek ✿"
  toggle.innerHTML = '<span class="cursor-mode__label"></span>' +
    '<span class="cursor-mode__icon" aria-hidden="true"></span>';
  document.body.appendChild(toggle);

  /** Düğmenin metnini etkin moda ve dile göre yazar */
  function renderToggle() {
    var en = html.lang === "en";
    var name = en ? effect.en : effect.tr;
    var nextMode = MODES[ORDER[(ORDER.indexOf(modeKey) + 1) % ORDER.length]];
    toggle.dataset.mode = modeKey;
    toggle.querySelector(".cursor-mode__icon").textContent = effect.icon;
    toggle.querySelector(".cursor-mode__label").textContent = (en ? "Cursor: " : "İmleç: ") + name;
    toggle.setAttribute("aria-label", en
      ? "Cursor effect: " + name + ". Switch to " + nextMode.en
      : "İmleç efekti: " + name + ". " + nextMode.tr + " moduna geç");
  }

  function setMode(key) {
    modeKey = key;
    effect = MODES[key];
    if (HE.store) HE.store.set("localStorage", "he-cursor", key);
    renderToggle();
  }

  toggle.addEventListener("click", function () {
    setMode(ORDER[(ORDER.indexOf(modeKey) + 1) % ORDER.length]);
    // yeni modun küçük bir gösterisi: düğmenin üstünden yükselen parçacıklar
    var r = toggle.getBoundingClientRect();
    for (var k = 0; k < Math.round(26 * Math.max(0.4, effect.density)); k++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, sp = 60 + Math.random() * 160;
      spawn(r.left + r.width / 2 + gauss() * 10, r.top + 4, MODE.BURST,
        { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1 + Math.random() * 0.8 });
    }
  });
  document.addEventListener("he:lang", renderToggle);
  // başka sekmede değiştirilirse bu sayfa da uyar
  window.addEventListener("storage", function (e) {
    if (e.key === "he-cursor" && MODES[e.newValue] && e.newValue !== modeKey) { modeKey = e.newValue; effect = MODES[modeKey]; renderToggle(); }
  });
  renderToggle();

  HE.cursorLights = {
    count: function () { return aliveCount; },
    max: function () { return maxParticles; },
    mode: function () { return modeKey; },
    setMode: setMode
  };
})();
