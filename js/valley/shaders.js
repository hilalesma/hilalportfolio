/* ==========================================================================
   valley/shaders.js — Gece çiçek vadisinin GLSL shader'ları (sıfırdan yazıldı)
   HE.valleyShaders altında düz metin olarak durur; world.js bunları ShaderMaterial'a verir.
   1. flowers  : çiçek ve yaprak noktaları (point sprite)
                 - kameraya yaklaştıkça çiçek tomurcuktan tam boya açılır, yapraklar arkada büyür
                 - imleç noktaları ekran düzleminde dışa iter; imlece en yakın noktalar parlar
                 - rüzgârla hafif salınım, uzakta sise karışma
   2. terrain  : alçak tepeli vadi zemini (ay ışığı + kenar parıltısı + derinlik sisi)
   3. sky      : ufukta gül kurusu/lila ışıma, tepede gece mavisi-mor
   4. stars    : göz kırpan küçük yıldızlar
   5. dust     : havada süzülen toz parçacıkları
   6. shaft    : gökyüzünden inen ışık huzmeleri
   7. final    : son geçiş — RGB ayrışması, film greni, hıza bağlı vinyet
   ========================================================================== */
(function () {
  "use strict";

  var HE = (window.HE = window.HE || {});

  HE.valleyShaders = {
    /* ---------- 1. Çiçekler ve yapraklar ---------- */
    flowersVertex: [
      "uniform float uTime;",
      "uniform float uScale;        // ekran yüksekliği / (2·tan(fov/2)): dünya boyutunu piksele çevirir",
      "uniform vec2  uMouse;        // imleç, NDC (-1..1)",
      "uniform float uAspect;",
      "uniform float uMouseActive;  // 0..1: imleç ekranda mı",
      "uniform float uNear;         // bu mesafeden yakın çiçekler tam açık",
      "uniform float uFar;          // bu mesafeden uzak çiçekler tomurcuk",
      "uniform float uFogFar;",
      "uniform float uMaxSize;      // en büyük nokta boyu (piksel)",
      "uniform float uPixel;        // cihaz piksel oranı",
      "uniform float uScatter;      // 0..1: ok butonunun üzerine gelince çiçekler dışa dağılır",
      "attribute vec3  aColor;",
      "attribute float aSize;",
      "attribute float aSeed;",
      "attribute float aType;       // 0 çiçek, 1 yaprak",
      "varying vec3  vColor;",
      "varying float vAlpha;",
      "varying float vGlow;",
      "varying float vType;",
      "varying float vRot;",
      "varying float vOpen;",
      "varying float vScatter;",
      "void main() {",
      "  vec3 p = position;",
      "  // rüzgâr: her nokta kendi fazıyla salınır",
      "  p.x += sin(uTime * 1.3 + aSeed * 6.2831 + p.z * 0.08) * 0.10 * (0.4 + aSeed);",
      "  p.z += cos(uTime * 0.9 + aSeed * 12.0) * 0.05;",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
      "  float dist = -mv.z;",
      "  // açılma: uzakta küçük tomurcuk, yakında tam boy",
      "  float open = smoothstep(uFar, uNear, dist);",
      "  float size = aType < 0.5",
      "    ? aSize * mix(0.28, 1.0, open)",
      "    : aSize * mix(1.0, 1.55, smoothstep(uNear, uFar, dist));",
      "  vec4 clip = projectionMatrix * mv;",
      "  // imleçten itme (ekran düzleminde, yakında daha güçlü)",
      "  // kameranın arkasındaki noktalarda w <= 0: bölme NaN üretir ve bloom bütün kareyi karartır",
      "  float front = step(0.1, clip.w);",
      "  vec2 ndc = clip.xy / max(clip.w, 0.1);",
      "  vec2 d = ndc - uMouse;",
      "  d.x *= uAspect;",
      "  float len = length(d);",
      "  float R = 0.34;",
      "  float infl = (1.0 - smoothstep(0.0, R, len)) * uMouseActive * front;",
      "  vec2 dir = len > 0.0001 ? d / len : vec2(0.0);",
      "  vec2 push = dir * infl * infl * 0.07;",
      "  push.x /= uAspect;",
      "  clip.xy += push * clip.w;",
      "  // dağılma: ekranın ortasından dışa (ve hafif yukarı) savrulur; her nokta farklı uzaklığa",
      "  vec2 fromC = ndc * vec2(uAspect, 1.0);",
      "  float lc = length(fromC);",
      "  vec2 outDir = lc > 0.0001 ? fromC / lc : vec2(0.0, 1.0);",
      "  outDir.x /= uAspect;",
      "  float sc = uScatter * front;",
      "  clip.xy += (outDir * (0.25 + 0.75 * aSeed) + vec2(0.0, 0.18 * aSeed)) * sc * sc * clip.w;",
      "  gl_Position = clip;",
      "  vScatter = sc;",
      "  vGlow = (1.0 - smoothstep(0.0, R * 0.8, len)) * uMouseActive * front;",
      "  dist = max(dist, 0.1);",
      "  float fog = smoothstep(uFogFar * 0.4, uFogFar, dist);",
      "  vAlpha = (1.0 - fog) * smoothstep(1.2, 4.5, dist);   // kameranın dibindekiler sönsün",
      "  float px = size * uScale / dist * (1.0 + vGlow * 0.5);",
      "  px *= mix(1.0, 0.45, vScatter);   // dağılırken küçük parlak kıvılcımlara dönüşür",
      "  gl_PointSize = min(px, uMaxSize);",
      "  // büyük (yakın) noktalar üst üste binip beyaza dönmesin: boy arttıkça ışık azalır",
      "  vAlpha *= mix(1.0, 0.38, smoothstep(14.0, 60.0, px / uPixel));",
      "  vColor = aColor * (0.72 + 0.28 * fract(aSeed * 7.31));   // her çiçeğin parlaklığı biraz farklı: derinlik hissi",
      "  vType = aType;",
      "  vRot = aSeed * 6.2831 + uTime * 0.2 * (aSeed - 0.5);",
      "  vOpen = open;",
      "}"
    ].join("\n"),

    flowersFragment: [
      "uniform sampler2D uAtlas;    // 2 hücre: solda çiçek, sağda yaprak",
      "uniform float uBrightness;",
      "varying vec3  vColor;",
      "varying float vAlpha;",
      "varying float vGlow;",
      "varying float vType;",
      "varying float vRot;",
      "varying float vOpen;",
      "varying float vScatter;",
      "void main() {",
      "  vec2 c = gl_PointCoord - 0.5;",
      "  float s = sin(vRot), co = cos(vRot);",
      "  c = mat2(co, -s, s, co) * c + 0.5;",
      "  vec4 t = texture2D(uAtlas, vec2((clamp(c.x, 0.0, 1.0) + vType) * 0.5, clamp(c.y, 0.0, 1.0)));",
      "  float inside = step(0.0, c.x) * step(c.x, 1.0) * step(0.0, c.y) * step(c.y, 1.0);",
      "  // dağılma sırasında çiçek biçimi yuvarlak, parlayan bir noktaya dönüşür",
      "  float spark = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));",
      "  float a = mix(t.a * inside, spark, vScatter) * vAlpha;",
      "  if (a < 0.01) discard;",
      "  float lift = vType < 0.5 ? (0.55 + 0.45 * vOpen) : 0.8;",
      "  vec3 tint = mix(t.rgb, vec3(1.0), vScatter);",
      "  vec3 col = vColor * tint * lift * uBrightness * (1.0 + vGlow * 2.0 + vScatter * 1.6);",
      "  gl_FragColor = vec4(col, a);",
      "}"
    ].join("\n"),

    /* ---------- 2. Arazi ---------- */
    terrainVertex: [
      "varying vec3 vN;",
      "varying vec3 vW;",
      "varying float vDist;",
      "void main() {",
      "  vec4 w = modelMatrix * vec4(position, 1.0);",
      "  vW = w.xyz;",
      "  vN = normalize(mat3(modelMatrix) * normal);",
      "  vec4 mv = viewMatrix * w;",
      "  vDist = -mv.z;",
      "  gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),

    terrainFragment: [
      "uniform vec3 uFogColor;",
      "uniform float uFogFar;",
      "uniform vec3 uRim;",
      "varying vec3 vN;",
      "varying vec3 vW;",
      "varying float vDist;",
      "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
      "void main() {",
      "  vec3 n = normalize(vN);",
      "  float moon = max(dot(n, normalize(vec3(-0.35, 0.75, -0.55))), 0.0);",
      "  vec3 base = mix(vec3(0.035, 0.026, 0.038), vec3(0.10, 0.075, 0.11), moon);",
      "  // toprakta ince doku (çok hafif)",
      "  base *= 0.92 + 0.08 * hash(floor(vW.xz * 3.0));",
      "  // sabit renkler sRGB yazıldı: doğrusal (linear) uzaya çevir (çıktıda yeniden sRGB'ye döner)",
      "  base = pow(base, vec3(2.2));",
      "  // yamaçlarda ufuk ışığının yansıması (uRim zaten doğrusal)",
      "  float slope = clamp(1.0 - n.y, 0.0, 1.0);   // negatif tabanla pow() NaN verir",
      "  base += uRim * pow(slope, 1.6) * 0.35;",
      "  float fog = smoothstep(uFogFar * 0.15, uFogFar, vDist);",
      "  gl_FragColor = vec4(mix(base, uFogColor, fog), 1.0);",
      "}"
    ].join("\n"),

    /* ---------- 3. Gökyüzü ---------- */
    skyVertex: [
      "varying vec3 vDir;",
      "void main() {",
      "  vDir = normalize(position);",
      "  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "  gl_Position = p.xyww;   // her zaman en arkada",
      "}"
    ].join("\n"),

    skyFragment: [
      "uniform vec3 uZenith;",
      "uniform vec3 uHorizon;",
      "uniform vec3 uGlow;",
      "varying vec3 vDir;",
      "void main() {",
      "  float h = clamp(vDir.y, -0.2, 1.0);",
      "  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.45, h));",
      "  // vadinin sonunda, ufukta yumuşak bir şampanya ışıması",
      "  float g = pow(max(dot(vDir, normalize(vec3(0.0, 0.08, -1.0))), 0.0), 18.0);",
      "  col += uGlow * g * 0.9;",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n"),

    /* ---------- 4. Yıldızlar ---------- */
    starsVertex: [
      "uniform float uTime;",
      "uniform float uPixel;",
      "attribute float aSeed;",
      "varying float vTw;",
      "void main() {",
      "  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "  gl_Position = p.xyww;",
      "  vTw = 0.7 + 0.3 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);",
      "  gl_PointSize = (1.4 + aSeed * 2.2) * uPixel;",
      "}"
    ].join("\n"),

    starsFragment: [
      "varying float vTw;",
      "void main() {",
      "  float d = length(gl_PointCoord - 0.5);",
      "  float a = smoothstep(0.5, 0.0, d) * vTw;",
      "  gl_FragColor = vec4(vec3(1.0, 0.9, 0.72) * a * 1.25, a);   // sıcak altın yıldızlar",
      "}"
    ].join("\n"),

    /* ---------- 5. Toz parçacıkları ----------
       Kameranın çevresindeki bir kutuda süzülür; kutu kamerayla birlikte kayar (mod ile sarılır),
       böylece az sayıda parçacık yolun her yerinde havada asılı duruyormuş gibi görünür. */
    dustVertex: [
      "uniform float uTime;",
      "uniform vec3  uCam;",
      "uniform float uPixel;",
      "uniform float uScatter;",
      "attribute float aSeed;",
      "varying float vA;",
      "void main() {",
      "  vec3 box = vec3(36.0, 10.0, 46.0);",
      "  vec3 drift = vec3(sin(uTime * 0.2 + aSeed * 30.0) * 0.6, uTime * (0.08 + aSeed * 0.12), -uTime * 0.25);",
      "  vec3 p = mod(position + drift - uCam + box * 0.5, box) - box * 0.5 + uCam;",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
      "  gl_Position = projectionMatrix * mv;",
      "  float dist = max(-mv.z, 0.1);",
      "  float twinkle = 0.5 + 0.5 * sin(uTime * (0.8 + aSeed) + aSeed * 50.0);",
      "  vA = smoothstep(22.0, 6.0, dist) * smoothstep(0.5, 2.0, dist) * (0.35 + 0.65 * twinkle);",
      "  vA *= 1.0 + uScatter * 1.5;",
      "  gl_PointSize = (1.5 + aSeed * 2.5) * uPixel * (8.0 / dist + 0.4);",
      "}"
    ].join("\n"),

    dustFragment: [
      "varying float vA;",
      "void main() {",
      "  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vA * 0.85;",
      "  if (a < 0.005) discard;",
      "  gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * a, a);   // altın toz",
      "}"
    ].join("\n"),

    /* ---------- 6. Işık huzmeleri ----------
       Gökyüzünden vadiye inen, kameraya dönük ince düzlemler (billboard). Ortası parlak,
       kenarları ve uçları yumuşakça söner; yavaşça nefes alır. */
    shaftVertex: [
      "varying vec2 vUv;",
      "varying float vDist;",
      "void main() {",
      "  vUv = uv;",
      "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
      "  vDist = -mv.z;",
      "  gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),

    shaftFragment: [
      "uniform vec3 uColor;",
      "uniform float uTime;",
      "uniform float uSeed;",
      "uniform float uStrength;",
      "varying vec2 vUv;",
      "varying float vDist;",
      "void main() {",
      "  float k = (vUv.x - 0.5) * 3.2;",
      "  float across = exp(-k * k);   // pow() negatif tabanla NaN verir; kare elle alınır",
      "  float along = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);",
      "  float breathe = 0.65 + 0.35 * sin(uTime * 0.35 + uSeed * 6.0);",
      "  float near = smoothstep(4.0, 14.0, vDist) * smoothstep(160.0, 70.0, vDist);",
      "  float a = across * along * breathe * near * uStrength;",
      "  gl_FragColor = vec4(uColor * a, a);",
      "}"
    ].join("\n"),

    /* ---------- 7. Son geçiş (post-processing) ----------
       RGB ayrışması (kenarlarda ve hızlanınca artar) + ince film greni + hız arttıkça sıkılaşan vinyet. */
    finalVertex: [
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = uv;",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "}"
    ].join("\n"),

    finalFragment: [
      "uniform sampler2D tDiffuse;",
      "uniform float uTime;",
      "uniform float uSplit;",
      "uniform float uNoise;",
      "uniform float uVignette;",
      "varying vec2 vUv;",
      "float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
      "void main() {",
      "  vec2 c = vUv - 0.5;",
      "  float r = length(c);",
      "  vec2 off = c * uSplit * (0.3 + r * 1.8);",
      "  vec3 col;",
      "  col.r = texture2D(tDiffuse, vUv + off).r;",
      "  col.g = texture2D(tDiffuse, vUv).g;",
      "  col.b = texture2D(tDiffuse, vUv - off).b;",
      "  col += (hash(vUv * 1000.0 + fract(uTime) * 100.0) - 0.5) * uNoise;",
      "  col *= 1.0 - smoothstep(0.3 - uVignette * 0.12, 0.95 - uVignette * 0.25, r) * (0.45 + uVignette * 0.45);",
      "  gl_FragColor = vec4(max(col, 0.0), 1.0);",
      "}"
    ].join("\n")
  };
})();
