/* ==========================================================================
   valley/world.js — Gece çiçek vadisinin dünyası (Three.js, tamamen prosedürel)
   HE.valleyWorld.create(THREE, options) → { scene, camera, curve, update, resize, setQuality, dispose }

   Katmanlar (arkadan öne):
     gökyüzü küresi → yıldızlar → arazi (heightmap kodla üretilir) → çiçek + yaprak noktaları
     → ışık huzmeleri → toz parçacıkları
   Kamera yolu: CatmullRomCurve3; kontrol noktalarının yüksekliği araziye göre hesaplanır.
   Çiçek ve yaprak dokuları canvas üzerinde kodla çizilir (dış dosya yok).
   ========================================================================== */
(function () {
  "use strict";

  var HE = (window.HE = window.HE || {});

  /* ---------- Palet (css/tokens.css ile aynı tonlar) ---------- */
  // Koyu vadide canlı görünsün diye paletin daha doygun, sıcak sürümleri
  var FLOWER_COLORS = [
    { hex: "#FFB7C8", w: 0.22 },  // canlı pudra pembesi
    { hex: "#FFB383", w: 0.20 },  // şeftali
    { hex: "#FFCF6B", w: 0.18 },  // sıcak altın
    { hex: "#C9A2FF", w: 0.18 },  // canlı lila
    { hex: "#FFF1E0", w: 0.12 },  // sedef / krem ışık
    { hex: "#E07F92", w: 0.10 }   // gül kurusu (doygun)
  ];
  var LEAF_COLORS = ["#6d5b70", "#55606a", "#5e5560"];

  /* ---------- Küçük yardımcılar: tohumlu rastgele + değer gürültüsü ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20261123);   // her ziyarette aynı vadi

  function hash2(x, y) {
    var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise2(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
    return (a + (b - a) * ux) + (c - a) * uy * (1 - ux) + (d - b) * ux * uy;   // 0..1
  }
  function fbm(x, y) {
    var v = 0, amp = 0.5;
    for (var i = 0; i < 4; i++) { v += amp * (noise2(x, y) * 2 - 1); x *= 2.03; y *= 2.03; amp *= 0.5; }
    return v;   // yaklaşık -1..1
  }
  function gaussian() {
    var u = 1 - rand(), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function pickColor(list) {
    var r = rand(), acc = 0;
    for (var i = 0; i < list.length; i++) { acc += list[i].w; if (r <= acc) return list[i].hex; }
    return list[list.length - 1].hex;
  }
  /** GLSL kaynağındaki // yorumlarını ayıklar (Türkçe karakterli yorumlar bazı sürücülerde sorun çıkarabilir). */
  function glsl(src) { return src.replace(/\/\/[^\n]*/g, ""); }

  /* ---------- Kamera yolu ----------
     [x, z, yerden yükseklik]: vadinin girişinde yüksekten başlar, çiçeklerin arasına iner,
     kıvrılarak ilerler ve sonda hafifçe yükselir. */
  var PATH = [
    [0, 72, 34], [0, 42, 16], [1, 18, 4.2], [3.5, -10, 2.7], [-3, -45, 2.5],
    [2.5, -85, 2.7], [-1.5, -125, 2.6], [0.5, -160, 3.4], [0, -192, 7]
  ];

  // Yolun z'ye göre x değeri (arazinin vadi tabanını yola hizalamak için doğrusal ara değer)
  function pathX(z) {
    for (var i = 0; i < PATH.length - 1; i++) {
      var a = PATH[i], b = PATH[i + 1];
      if (z <= a[1] && z >= b[1]) {
        var k = (a[1] - z) / (a[1] - b[1]);
        k = k * k * (3 - 2 * k);
        return a[0] + (b[0] - a[0]) * k;
      }
    }
    return 0;
  }

  /** Arazi yüksekliği: yol boyunca düz taban, iki yanda yükselen alçak tepeler. */
  function heightAt(x, z) {
    var dx = x - pathX(z);
    var side = 15 * (1 - Math.exp(-(dx * dx) / 1100));
    var far = Math.max(0, Math.abs(dx) - 60) * 0.25;          // en dışta siluet veren sırtlar
    var hills = fbm(x * 0.03, z * 0.03) * 3.4 * (0.35 + 0.65 * Math.min(1, Math.abs(dx) / 22));
    var ripple = fbm(x * 0.13 + 7, z * 0.13) * 0.45;
    return side + far + hills + ripple - 0.6;
  }

  /* ---------- Canvas dokuları ---------- */
  function makeAtlas(THREE) {
    var S = 128;
    var cv = document.createElement("canvas");
    cv.width = S * 2; cv.height = S;
    var g = cv.getContext("2d");

    // Sol hücre: altı yapraklı çiçek (beyaz; renk shader'da verilir)
    g.save();
    g.translate(S / 2, S / 2);
    var halo = g.createRadialGradient(0, 0, 0, 0, 0, S / 2);
    halo.addColorStop(0, "rgba(255,255,255,0.35)");
    halo.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = halo;
    g.fillRect(-S / 2, -S / 2, S, S);
    for (var i = 0; i < 6; i++) {
      g.save();
      g.rotate((i / 6) * Math.PI * 2);
      var pg = g.createRadialGradient(0, -S * 0.2, 2, 0, -S * 0.2, S * 0.24);
      pg.addColorStop(0, "rgba(255,255,255,0.95)");
      pg.addColorStop(0.7, "rgba(255,255,255,0.55)");
      pg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = pg;
      g.beginPath();
      g.ellipse(0, -S * 0.2, S * 0.11, S * 0.22, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    var core = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.1);
    core.addColorStop(0, "rgba(255,246,225,1)");
    core.addColorStop(1, "rgba(255,240,210,0)");
    g.fillStyle = core;
    g.beginPath(); g.arc(0, 0, S * 0.1, 0, Math.PI * 2); g.fill();
    g.restore();

    // Sağ hücre: damarlı yaprak
    g.save();
    g.translate(S * 1.5, S / 2);
    g.rotate(-0.5);
    var lg = g.createLinearGradient(0, -S * 0.42, 0, S * 0.42);
    lg.addColorStop(0, "rgba(255,255,255,0.15)");
    lg.addColorStop(0.5, "rgba(255,255,255,0.75)");
    lg.addColorStop(1, "rgba(255,255,255,0.25)");
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(0, -S * 0.42);
    g.quadraticCurveTo(S * 0.24, 0, 0, S * 0.42);
    g.quadraticCurveTo(-S * 0.24, 0, 0, -S * 0.42);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.9)";
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -S * 0.38); g.lineTo(0, S * 0.4); g.stroke();
    g.restore();

    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---------- Dünya ---------- */
  function create(THREE, opt) {
    var S = HE.valleyShaders;
    var mobile = !!opt.mobile;
    var scene = new THREE.Scene();
    var fogColor = new THREE.Color("#1c1119");
    var FOG_FAR = 150;

    var camera = new THREE.PerspectiveCamera(mobile ? 66 : 55, opt.width / opt.height, 0.1, 800);
    var disposables = [];
    function keep(o) { disposables.push(o); return o; }

    /* Gökyüzü */
    var sky = new THREE.Mesh(
      keep(new THREE.SphereGeometry(500, 32, 16)),
      keep(new THREE.ShaderMaterial({
        vertexShader: glsl(S.skyVertex),
        fragmentShader: glsl(S.skyFragment),
        uniforms: {
          uZenith: { value: new THREE.Color("#07060c") },
          uHorizon: { value: fogColor.clone() },
          uGlow: { value: new THREE.Color("#a9727e") }
        },
        side: THREE.BackSide,
        depthWrite: false
      }))
    );
    sky.renderOrder = -2;
    scene.add(sky);

    /* Yıldızlar */
    var starCount = mobile ? 500 : 1200;
    var sp = new Float32Array(starCount * 3), ss = new Float32Array(starCount);
    for (var i = 0; i < starCount; i++) {
      var th = rand() * Math.PI * 2, ph = Math.acos(0.15 + rand() * 0.85);   // yalnız üst yarı küre
      sp[i * 3] = Math.sin(ph) * Math.cos(th) * 450;
      sp[i * 3 + 1] = Math.cos(ph) * 450;
      sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 450;
      ss[i] = rand();
    }
    var starGeo = keep(new THREE.BufferGeometry());
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute("aSeed", new THREE.BufferAttribute(ss, 1));
    var starMat = keep(new THREE.ShaderMaterial({
      vertexShader: glsl(S.starsVertex),
      fragmentShader: glsl(S.starsFragment),
      uniforms: { uTime: { value: 0 }, uPixel: { value: opt.pixelRatio } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    var stars = new THREE.Points(starGeo, starMat);
    stars.renderOrder = -1;
    stars.frustumCulled = false;
    scene.add(stars);

    /* Arazi */
    var segX = mobile ? 110 : 180, segZ = mobile ? 170 : 270;
    var tGeo = keep(new THREE.PlaneGeometry(240, 360, segX, segZ));
    tGeo.rotateX(-Math.PI / 2);
    tGeo.translate(0, 0, -85);   // z: +95 … -265
    var tp = tGeo.attributes.position;
    for (var v = 0; v < tp.count; v++) tp.setY(v, heightAt(tp.getX(v), tp.getZ(v)));
    tGeo.computeVertexNormals();
    var terrainMat = keep(new THREE.ShaderMaterial({
      vertexShader: glsl(S.terrainVertex),
      fragmentShader: glsl(S.terrainFragment),
      uniforms: {
        uFogColor: { value: fogColor },
        uFogFar: { value: FOG_FAR },
        uRim: { value: new THREE.Color("#5a3346") }
      }
    }));
    scene.add(new THREE.Mesh(tGeo, terrainMat));

    /* Çiçekler ve yapraklar */
    var count = Math.round((mobile ? 0.4 : 1) * 17000);
    var pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    var size = new Float32Array(count), seed = new Float32Array(count), type = new Float32Array(count);
    var c = new THREE.Color();
    for (var f = 0; f < count; f++) {
      var leaf = rand() < 0.3;
      var z = 32 - rand() * 250;
      // kameranın geçtiği dar bir koridor seyrek kalır; çiçekler iki yana halı gibi yayılır
      var side = rand() < 0.5 ? -1 : 1;
      var spread = rand() < 0.72 ? side * (2.2 + Math.abs(gaussian()) * 12) : (rand() * 2 - 1) * 58;
      var x = pathX(z) + spread;
      var stem = leaf ? 0.05 + rand() * 0.55 : 0.15 + rand() * 1.1;
      pos[f * 3] = x;
      pos[f * 3 + 1] = heightAt(x, z) + stem;
      pos[f * 3 + 2] = z;
      c.set(leaf ? LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)] : pickColor(FLOWER_COLORS));
      col[f * 3] = c.r; col[f * 3 + 1] = c.g; col[f * 3 + 2] = c.b;
      size[f] = leaf ? 0.5 + rand() * 0.6 : 0.32 + rand() * 0.6;
      seed[f] = rand();
      type[f] = leaf ? 1 : 0;
    }
    var fGeo = keep(new THREE.BufferGeometry());
    fGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    fGeo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    fGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    fGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    fGeo.setAttribute("aType", new THREE.BufferAttribute(type, 1));
    var atlas = keep(makeAtlas(THREE));
    var flowerUniforms = {
      uTime: { value: 0 },
      uScale: { value: 1 },
      uMouse: { value: new THREE.Vector2(0, -2) },
      uAspect: { value: opt.width / opt.height },
      uMouseActive: { value: 0 },
      uNear: { value: 7 },
      uFar: { value: 46 },
      uFogFar: { value: FOG_FAR },
      uMaxSize: { value: 64 },
      uPixel: { value: 1 },
      uScatter: { value: 0 },
      uAtlas: { value: atlas },
      uBrightness: { value: 1.05 }
    };
    var flowerMat = keep(new THREE.ShaderMaterial({
      vertexShader: glsl(S.flowersVertex),
      fragmentShader: glsl(S.flowersFragment),
      uniforms: flowerUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    var flowers = new THREE.Points(fGeo, flowerMat);
    flowers.frustumCulled = false;
    scene.add(flowers);

    /* Toz parçacıkları (kamerayla birlikte kayan kutuda) */
    var dustCount = mobile ? 220 : 550;
    var dp = new Float32Array(dustCount * 3), ds = new Float32Array(dustCount);
    for (var k = 0; k < dustCount; k++) {
      dp[k * 3] = rand() * 36; dp[k * 3 + 1] = rand() * 10; dp[k * 3 + 2] = rand() * 46;
      ds[k] = rand();
    }
    var dustGeo = keep(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(ds, 1));
    var dustMat = keep(new THREE.ShaderMaterial({
      vertexShader: glsl(S.dustVertex),
      fragmentShader: glsl(S.dustFragment),
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uPixel: { value: opt.pixelRatio }, uScatter: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    var dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    /* Işık huzmeleri: yol boyunca iki yanda, gökyüzünden vadiye eğik inen düzlemler */
    var shafts = [];
    var shaftGeo = keep(new THREE.PlaneGeometry(1, 1));
    shaftGeo.translate(0, 0.5, 0);   // alt kenar yerde dursun
    var shaftColors = ["#C9B6E4", "#E9D8BE", "#F3D9DC"];
    for (var s = 0; s < 8; s++) {
      var sz = 10 - s * 28;
      var sx = pathX(sz) + (s % 2 ? 1 : -1) * (7 + rand() * 16);
      var mat = keep(new THREE.ShaderMaterial({
        vertexShader: glsl(S.shaftVertex),
        fragmentShader: glsl(S.shaftFragment),
        uniforms: {
          uColor: { value: new THREE.Color(shaftColors[s % 3]) },
          uTime: { value: 0 },
          uSeed: { value: rand() },
          uStrength: { value: 0.3 + rand() * 0.15 }
        },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      }));
      var beam = new THREE.Mesh(shaftGeo, mat);
      beam.position.set(sx, heightAt(sx, sz) - 0.5, sz);
      beam.scale.set(3 + rand() * 4, 55, 1);
      beam.userData.lean = (s % 2 ? -1 : 1) * (0.18 + rand() * 0.12);
      scene.add(beam);
      shafts.push(beam);
    }

    /* Kamera eğrisi */
    var curve = new THREE.CatmullRomCurve3(PATH.map(function (p) {
      return new THREE.Vector3(p[0], heightAt(p[0], p[1]) + p[2], p[1]);
    }), false, "centripetal");

    /* Kare güncellemesi */
    var P = new THREE.Vector3(), L = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    var tilt = { x: 0, y: 0 };
    function update(state) {
      var t = Math.min(Math.max(state.t, 0), 1);
      curve.getPointAt(t, P);
      curve.getPointAt(Math.min(t + 0.035, 1), L);
      if (t > 0.96) L.z -= (t - 0.96) * 200;       // son noktada ileri bakmaya devam
      L.y -= 0.9;
      // kamera imlece doğru hafifçe eğilir (yumuşatılmış)
      tilt.x += (state.mouse.x - tilt.x) * 0.05;
      tilt.y += (state.mouse.y - tilt.y) * 0.05;
      right.subVectors(L, P).cross(up).normalize();
      L.addScaledVector(right, tilt.x * 1.4).addScaledVector(up, tilt.y * 0.8);
      camera.position.copy(P);
      camera.lookAt(L);
      flowerUniforms.uTime.value = state.time;
      starMat.uniforms.uTime.value = state.time;
      flowerUniforms.uMouse.value.set(state.mouse.x, state.mouse.y);
      flowerUniforms.uMouseActive.value = state.mouseActive;
      flowerUniforms.uScatter.value = state.scatter || 0;
      dustMat.uniforms.uTime.value = state.time;
      dustMat.uniforms.uCam.value.copy(camera.position);
      dustMat.uniforms.uScatter.value = state.scatter || 0;
      // huzmeler kameraya döner (yalnız dikey eksende) ve hafifçe eğik durur
      for (var i = 0; i < shafts.length; i++) {
        var b = shafts[i];
        b.rotation.set(0, Math.atan2(camera.position.x - b.position.x, camera.position.z - b.position.z), b.userData.lean);
        b.material.uniforms.uTime.value = state.time;
      }
      sky.position.copy(camera.position);
      stars.position.copy(camera.position);
    }

    /** Ekran boyutu değişince: en-boy oranı ve nokta ölçeği. */
    function resize(w, h, pixelRatio) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      flowerUniforms.uAspect.value = w / h;
      flowerUniforms.uScale.value = (h * pixelRatio) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      flowerUniforms.uMaxSize.value = 64 * pixelRatio;
      flowerUniforms.uPixel.value = pixelRatio;
      starMat.uniforms.uPixel.value = pixelRatio;
      dustMat.uniforms.uPixel.value = pixelRatio;
    }

    /** Kalite: nokta sayısının bir kısmını çizmez (FPS düşünce). */
    function setPointFraction(k) { fGeo.setDrawRange(0, Math.floor(count * k)); }

    function dispose() {
      disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
      scene.clear();
    }

    resize(opt.width, opt.height, opt.pixelRatio);
    return {
      scene: scene, camera: camera, curve: curve, count: count,
      update: update, resize: resize, setPointFraction: setPointFraction, dispose: dispose
    };
  }

  HE.valleyWorld = { create: create, heightAt: heightAt };
})();
