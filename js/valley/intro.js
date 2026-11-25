/* ==========================================================================
   valley/intro.js — Gece çiçek vadisinin yöneticisi
   Akış:
     1. Yükleyici (yalnız oturumdaki ilk ziyarette): siyah ekran, nabız gibi atan krem nokta ve % sayacı.
        Three.js + shader + dünya dosyaları sırayla yüklenir, sahne kurulur ve derlenir.
     2. Uçuş (yalnız ilk ziyarette): kamera vadinin girişinden çiçeklerin arasına iner (≈4 sn).
     3. Keşif ("explore"): sayfa kilitli; tekerlek / dokunma / ok tuşları kamerayı yol boyunca İLERİ ve
        GERİ götürür; boşta kamera yavaşça ilerler (yolun sonuna kendiliğinden varmaz). İmleç çiçekleri iter.
     4. Çıkış: kaydırarak yolun sonuna gelmek, "Atla" ya da bir menü bağlantısı → gece perdesi,
        Lenis kaydırması Hakkımda'dan (ya da seçilen bölümden) devam eder.
     5. Park ("docked", 25.11.2026): sahne KAPATILMAZ. Vadi sayfanın ilk bölümü olarak canlı kalır
        (ekranda görünürken çizilir, görünmezken durur). Sayfanın en üstündeyken yukarı kaydırmaya
        devam edilince (tekerlek, parmakla aşağı çekme, ↑ / PageUp / Home) vadiye yeniden girilir:
        kamera yol boyunca geri gider; aşağı kaydırınca yeniden ilerleyip Hakkımda'ya çıkar.
   Oturumdaki sonraki ziyaretlerde (ya da bölüme doğrudan bağlantıyla gelindiğinde) yükleyici ve uçuş
   oynamaz: sahne arka planda yüklenir, durağan karenin yerini canlı vadi alır. Sayfa en üstten açıldıysa
   doğrudan keşfe girilir. Hareket azaltma açıksa ya da WebGL yoksa yalnız durağan kare görünür.
   Test: ?intro=1 intro'yu yeniden oynatır, ?motion=full hareket azaltmayı yok sayar.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  var html = document.documentElement;
  if (!HE.introPlay && !HE.valleyLive) return;
  var first = !!HE.introPlay;   // oturumdaki ilk ziyaret: yükleyici + uçuş

  var gsap = window.gsap;
  var section = document.getElementById("vadi");
  var stage = document.querySelector("[data-valley-stage]");
  var loader = document.querySelector("[data-valley-loader]");
  var countEl = document.querySelector("[data-valley-count]");
  var skipBtn = document.querySelector("[data-valley-skip]");
  var soundBtn = document.querySelector("[data-valley-sound]");
  if (!stage || !gsap) { fail(); return; }

  var INTRO_END = 0.22;      // uçuşun bittiği yol konumu (0..1)
  var IDLE_SPEED = 0.0045;   // boşta ilerleme (yol / sn)
  var IDLE_CAP = 0.93;       // boşta ilerleme burada durur: çıkış yalnız kullanıcının kaydırmasıyla olur
  var EXIT_AT = 0.985;       // bu noktayı geçince Hakkımda'ya çıkılır
  var REENTER_AT = 0.95;     // geri kaydırarak girildiğinde kameranın hedefi (yolun sonuna yakın)
  var REWIND_MIN = 0.12;     // geri giderken en fazla buraya kadar: vadi yukarıdan, çiçeklerle dolu görünür
                             // (daha gerisi uçuşun başladığı karanlık giriş)
  var WHEEL_K = 0.0006;      // tekerlek piksel başına ilerleme
  var TOUCH_K = 0.0005;      // dokunma çarpanı: bir parmak kaydırması (~300 px) ≈ tekerleğin 3 tıkı

  var state = {
    phase: "loading", t: 0, target: INTRO_END, time: 0,
    mouse: { x: 0, y: 0 }, mouseActive: 0, mouseSeen: 99,
    hover: 0, hoverWant: 0, scatter: 0, speed: 0
  };
  var shown = { pct: 0 };
  var THREE, world, renderer, composer, bloom, finalPass, clock;
  var audio = HE.valleyAudio;
  var exitTarget = "#hakkimda";
  var visible = true;        // vadi ekranda mı (park hâlinde çizim yalnız görünürken)
  var looping = false;

  // "Atla" yükleme sırasında da çalışır
  if (skipBtn) skipBtn.addEventListener("click", function () { exit("#hakkimda"); });

  // Ses düğmesi (aria-pressed ile durum bildirilir)
  if (soundBtn && audio) {
    soundBtn.addEventListener("click", function () {
      var nowOn = audio.toggle();
      soundBtn.setAttribute("aria-pressed", nowOn ? "true" : "false");
    });
  }

  /* ---------- Başlangıç ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (first) {
    // ilk ziyaret: sayfanın en üstünde ve kilitli
    window.scrollTo(0, 0);
    if (HE.lockScroll) HE.lockScroll(true);
  }

  /* ---------- Yükleyici ---------- */
  function setProgress(p) {
    if (!first) return;   // sonraki ziyaretlerde yükleyici görünmez
    gsap.to(shown, {
      pct: p, duration: 0.5, ease: "power1.out", overwrite: true,
      onUpdate: function () { countEl.textContent = Math.round(shown.pct) + "%"; }
    });
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("yüklenemedi: " + src)); };
      document.body.appendChild(s);
    });
  }
  /** Sonraki ziyaretlerde sahne, sayfa yüklendikten sonra arka planda kurulur (ilk çizimi geciktirmez). */
  function whenIdle() {
    if (first) return Promise.resolve();
    return new Promise(function (resolve) {
      var go = function () { window.setTimeout(resolve, 150); };
      if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
    });
  }

  var root = (document.querySelector('script[src$="js/valley/intro.js"]').getAttribute("src") || "").replace(/js\/valley\/intro\.js$/, "");
  setProgress(8);
  whenIdle()
    .then(function () { return loadScript(root + "vendor/three.min.js"); })
    .then(function () { setProgress(45); return loadScript(root + "js/valley/shaders.js"); })
    .then(function () { setProgress(55); return loadScript(root + "js/valley/world.js"); })
    .then(function () { setProgress(65); return wait(30); })
    .then(build)
    .then(function () { setProgress(100); return wait(first ? 550 : 0); })
    .then(start)
    .catch(function (err) { if (window.console) console.warn("[valley]", err); fail(); });

  function wait(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }

  /* ---------- Sahne kurulumu ---------- */
  function build() {
    if (state.phase !== "loading") return;   // kullanıcı yüklenirken "Atla"ya bastı
    THREE = window.THREE;
    var w = window.innerWidth, h = window.innerHeight;
    var mobile = w <= 820 || window.matchMedia("(pointer: coarse)").matches;
    var pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x07060c, 1);
    renderer.domElement.className = "valley__canvas";
    if (!first) renderer.domElement.classList.add("is-fading-in");   // durağan karenin üstünde yumuşakça belirir
    stage.appendChild(renderer.domElement);

    world = HE.valleyWorld.create(THREE, { width: w, height: h, pixelRatio: pr, mobile: mobile });

    // Son işlem: sahne → bloom (yarım çözünürlük) → renk çıkışı
    composer = new THREE.EffectComposer(renderer);
    composer.setPixelRatio(Math.min(pr, mobile ? 1 : 1.5));
    composer.setSize(w, h);
    composer.addPass(new THREE.RenderPass(world.scene, world.camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.6, 0.5, 0.42);
    composer.addPass(bloom);
    var S = HE.valleyShaders;
    finalPass = new THREE.ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uSplit: { value: 0.002 },
        uNoise: { value: 0.016 },
        uVignette: { value: 0 }
      },
      vertexShader: S.finalVertex,
      fragmentShader: S.finalFragment
    });
    composer.addPass(finalPass);
    composer.addPass(new THREE.OutputPass());

    if (!first) { state.t = state.target = INTRO_END; }   // uçuş yok: kamera keşif noktasında
    world.update(state);
    renderer.compile(world.scene, world.camera);
    composer.render();
    clock = new THREE.Timer();
    window.addEventListener("resize", onResize);

    // park hâlinde yalnız vadi ekrandayken çiz (GPU boşuna çalışmasın)
    if ("IntersectionObserver" in window && section) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        syncLoop();
      }).observe(section);
    }
  }

  function onResize() {
    if (!renderer) return;
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    world.resize(w, h, renderer.getPixelRatio());
  }

  /** Çizim döngüsünü duruma göre açar/kapatır: keşif ve uçuşta her zaman, parkta yalnız görünürken. */
  function syncLoop() {
    if (!renderer) return;
    var want = state.phase !== "docked" || visible;
    if (want === looping) return;
    looping = want;
    renderer.setAnimationLoop(want ? frame : null);
  }

  /* ---------- Başlat: ilk ziyarette uçuş, sonrakilerde park ya da doğrudan keşif ---------- */
  function start() {
    if (state.phase !== "loading") { teardown(); return; }
    if (!first) {
      state.phase = "docked";
      syncLoop();
      bindDockInput();
      // sayfa en üstten açıldıysa (bölüme doğrudan bağlantı yoksa) vadide başla
      if (window.scrollY <= 1 && !window.location.hash) enter("start");
      return;
    }
    state.phase = "flight";
    syncLoop();
    gsap.to(loader, { autoAlpha: 0, duration: 1, ease: "power2.out" });
    gsap.to(state, {
      t: INTRO_END, duration: 4.2, ease: "power2.inOut", delay: 0.2,
      onComplete: function () {
        if (state.phase !== "flight") return;
        state.phase = "explore";
        state.target = state.t;
        revealUI();
      }
    });
    bindInput();
  }

  function revealUI() {
    var items = [".valley__title", ".valley__sub", ".valley__foot", ".site-nav__bar", ".open-badge"];
    var els = items.map(function (s) { return document.querySelector(s); }).filter(Boolean);
    gsap.fromTo(els, { autoAlpha: 0, y: 18 }, {
      autoAlpha: 1, y: 0, duration: 1.6, ease: "expo.out", stagger: 0.12,
      onComplete: function () { gsap.set(els, { clearProps: "transform" }); }
    });
  }

  /* ---------- Kare döngüsü ---------- */
  var fps = { frames: 0, time: 0, level: 0 };
  function frame() {
    clock.update();
    var dt = Math.min(clock.getDelta(), 0.05);
    state.time += dt;

    state.hover += (state.hoverWant - state.hover) * Math.min(1, dt * (state.hoverWant ? 2.2 : 3.2));
    state.scatter = state.hover * state.hover * (3 - 2 * state.hover);
    if (audio) audio.setMuffle(state.hover);

    var prevT = state.t;
    if (state.phase === "explore") {
      var go = 1 - state.hover;
      if (state.hover > 0.5) state.target = state.t;
      // boşta yavaşça ilerler ama yolun sonuna kendiliğinden varmaz (çıkış yalnız kaydırmayla)
      if (state.target < IDLE_CAP) state.target = Math.min(IDLE_CAP, state.target + IDLE_SPEED * dt * go);
      state.t += (state.target - state.t) * Math.min(1, dt * 2.6) * go;
      if (state.t > EXIT_AT && state.target > EXIT_AT) exit("#hakkimda");
    }
    // hız (yol / sn): RGB ayrışması ve vinyet hızla artar (geri giderken de)
    var v = Math.abs(state.t - prevT) / Math.max(dt, 0.001);
    state.speed += (v - state.speed) * Math.min(1, dt * 4);
    if (finalPass) {
      var sp = Math.min(state.speed * 12, 1);
      finalPass.uniforms.uTime.value = state.time;
      finalPass.uniforms.uSplit.value = 0.0018 + sp * 0.006 + state.scatter * 0.005;
      finalPass.uniforms.uVignette.value = Math.min(1, sp + state.scatter * 0.4);
    }
    // imleç bir süre hareketsiz kalırsa etkisi yavaşça söner
    state.mouseSeen += dt;
    var want = state.mouseSeen < 2.5 ? 1 : 0;
    state.mouseActive += (want - state.mouseActive) * Math.min(1, dt * 3);

    world.update(state);
    if (fps.level >= 3) renderer.render(world.scene, world.camera);
    else composer.render();
    adaptQuality(dt);
  }

  /** FPS düşerse kalite kademeli azalır: piksel oranı → nokta sayısı → bloom. */
  function adaptQuality(dt) {
    if (state.phase === "loading") return;
    fps.frames++; fps.time += dt;
    if (fps.time < 2) return;
    var avg = fps.frames / fps.time;
    fps.frames = 0; fps.time = 0;
    if (avg >= 38 || fps.level >= 3) return;
    fps.level++;
    if (fps.level === 1) { renderer.setPixelRatio(1); composer.setPixelRatio(1); onResize(); }
    if (fps.level === 2) world.setPointFraction(0.6);
    html.dataset.valleyQuality = String(fps.level);
  }

  /* ---------- Girdi: keşif (sayfa kilitli) ---------- */
  function bindInput() {
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("click", onClick, true);   // yakalama evresi: Lenis'ten önce
  }
  function unbindInput() {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("click", onClick, true);
  }
  function advance(delta) {
    if (state.phase !== "explore") return;
    // geri kaydırınca kamera vadinin yukarıdan göründüğü noktaya kadar döner
    state.target = Math.min(1, Math.max(REWIND_MIN, state.target + delta));
  }
  function onWheel(e) {
    e.preventDefault();
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    advance(Math.max(-160, Math.min(160, dy)) * WHEEL_K);
  }
  var touchY = 0;
  function onTouchStart(e) { touchY = e.touches[0].clientY; }
  function onTouchMove(e) {
    var y = e.touches[0].clientY;
    if (e.cancelable) e.preventDefault();
    advance((touchY - y) * TOUCH_K);
    touchY = y;
    onPointer(e.touches[0]);
  }
  function onKey(e) {
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && tag !== "BUTTON" && tag !== "A")) { e.preventDefault(); advance(0.05); }
    else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); advance(-0.05); }
    else if (e.key === "End") { e.preventDefault(); exit("#hakkimda"); }
  }
  function onPointer(e) {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    state.mouseSeen = 0;
  }
  // Keşif sürerken sayfa içi bağlantılar (#…) önce vadiden çıkar, sonra o bölüme gider
  function onClick(e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2 || id === "#main") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    exit(id === "#vadi" ? "#hakkimda" : id);
  }

  /* ---------- Girdi: park (sayfa serbest) — en üstte yukarı kaydırınca vadiye geri gir ---------- */
  function atTop() { return window.scrollY <= 1; }
  function onDockWheel(e) {
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (dy < 0 && atTop()) { e.preventDefault(); enter("end"); }
  }
  var dockTouchY = 0;
  function onDockTouchStart(e) { dockTouchY = e.touches[0].clientY; }
  function onDockTouchMove(e) {
    // parmak aşağı çekiliyor (sayfa yukarı kaydırılmak isteniyor) ve zaten en üstteyiz
    if (atTop() && e.touches[0].clientY - dockTouchY > 12) {
      if (e.cancelable) e.preventDefault();
      enter("end");
      touchY = e.touches[0].clientY;   // aynı parmak hareketi keşifte buradan devam etsin (ani sıçrama olmasın)
    }
  }
  function onDockKey(e) {
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if ((e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Home") && atTop()) { e.preventDefault(); enter("end"); }
  }
  function bindDockInput() {
    window.addEventListener("wheel", onDockWheel, { passive: false });
    window.addEventListener("touchstart", onDockTouchStart, { passive: true });
    window.addEventListener("touchmove", onDockTouchMove, { passive: false });
    window.addEventListener("keydown", onDockKey);
    window.addEventListener("pointermove", onPointer, { passive: true });   // parkta da çiçekler imlece tepki verir
  }
  function unbindDockInput() {
    window.removeEventListener("wheel", onDockWheel);
    window.removeEventListener("touchstart", onDockTouchStart);
    window.removeEventListener("touchmove", onDockTouchMove);
    window.removeEventListener("keydown", onDockKey);
    window.removeEventListener("pointermove", onPointer);
  }

  /** Parktan keşfe geçiş. from: "end" (aşağıdan geri gelindi) ya da "start" (sayfa en üstten açıldı). */
  function enter(from) {
    if (state.phase !== "docked" || !renderer) return;
    unbindDockInput();
    state.phase = "explore";
    state.target = from === "end" ? REENTER_AT : Math.max(INTRO_END, state.t);
    if (from === "end") state.t = Math.max(state.t, REENTER_AT);
    if (HE.lockScroll) HE.lockScroll(true);
    window.scrollTo(0, 0);
    html.classList.add("valley-active");
    visible = true;
    syncLoop();
    bindInput();
  }

  /* ---------- Çıkış: vadi → gece perdesi → içerik (sahne park edilir, kapatılmaz) ---------- */
  function exit(target) {
    if (state.phase === "exit" || state.phase === "done" || state.phase === "docked") return;
    var prev = state.phase;
    state.phase = "exit";
    exitTarget = target || "#hakkimda";
    HE.store && HE.store.set("sessionStorage", "he-valley", "1");
    unbindInput();
    absorbMomentum();                    // perde boyunca ve hemen sonrasında süren kaydırma sayfayı itmesin
    if (audio) audio.dispose();          // ses yumuşakça söner (yalnız ilk ziyarette vardı)
    state.hoverWant = 0;

    var veil = document.createElement("div");
    veil.className = "valley-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    var tl = gsap.timeline();
    // kamera biraz hızlanarak ileri atılır, vadi perdeye karışır
    if (prev !== "loading") tl.to(state, { t: Math.min(1, state.t + 0.04), duration: 0.9, ease: "power2.in" }, 0);
    tl.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.inOut" }, 0)
      .add(function () {
        if (prev === "loading") teardown();   // sahne henüz kurulmadıysa canlı vadi yok: durağan kare kalır
        finish();
      })
      .to(veil, { opacity: 0, duration: 0.8, ease: "power2.out", delay: 0.1, onComplete: function () { veil.remove(); } });
  }

  /** Three.js kaynaklarını serbest bırakır ve tuvali kaldırır (yalnız hata ya da yükleme sırasında "Atla"). */
  function teardown() {
    window.removeEventListener("resize", onResize);
    if (renderer) {
      renderer.setAnimationLoop(null);
      if (world) world.dispose();
      if (composer) composer.dispose && composer.dispose();
      if (bloom) bloom.dispose && bloom.dispose();
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      renderer.domElement.remove();
      renderer = null;
    }
  }

  /** Sayfayı normale döndürür: kilit açılır, hedef bölüme anında gidilir, vadi park edilir. */
  function finish() {
    state.phase = renderer ? "docked" : "done";
    html.classList.remove("intro-play", "valley-active");
    html.classList.add("intro-still");
    gsap.set([".valley__title", ".valley__sub", ".valley__foot", ".site-nav__bar", ".open-badge", loader], { clearProps: "all" });
    if (HE.lockScroll) HE.lockScroll(false);
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    // Hakkımda'ya geçişte vadinin alt kenarı menünün arkasında görünmesin: bölüm tam ekranın tepesinde başlar
    HE.scrollTo(exitTarget, { immediate: true, offset: exitTarget === "#hakkimda" ? 0 : -72 });
    var t = document.querySelector(exitTarget);
    if (t) {
      if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
      t.focus({ preventScroll: true });
    }
    // atalet sürüyorsa Lenis biraz daha durdurulur (aksi hâlde kendi tekerlek dinleyicisiyle sayfayı iter);
    // hareket durunca absorbMomentum içindeki release() kaydırmayı yeniden açar
    if (absorber) { if (HE.lockScroll) HE.lockScroll(true); absorber.finished(); }
    if (state.phase === "docked") {
      visible = false;      // artık Hakkımda ekranda; vadi görünür olunca çizim yeniden başlar
      syncLoop();
      bindDockInput();
    }
  }

  /** Çıkış sırasında ve hemen sonrasında süren kaydırma (tekerlek/touchpad ataleti, hızlı dokunma)
      Hakkımda'yı geçip gitmesin: çıkış başlar başlamaz kaydırma olayları yutulur; perde açıldıktan sonra
      hareket 300 ms durunca (en geç 1.2 sn sonra) sayfa yeniden serbest kalır. */
  var absorber = null;
  function absorbMomentum() {
    var lastEvent = 0, done = false, timer = 0, maxTimer = 0;
    function block(e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();   // Lenis'in (window) dinleyicisine ulaşmasın
      lastEvent = performance.now();
    }
    function tryRelease() {
      if (!done) return;
      var quiet = performance.now() - lastEvent;
      if (quiet >= 300) release();
      else timer = window.setTimeout(tryRelease, 300 - quiet);
    }
    function release() {
      window.clearTimeout(timer);
      window.clearTimeout(maxTimer);
      window.removeEventListener("wheel", block, true);
      window.removeEventListener("touchmove", block, true);
      absorber = null;
      // bu arada kullanıcı vadiye yeniden girdiyse kilit vadiye aittir
      if (state.phase !== "explore" && HE.lockScroll) HE.lockScroll(false);
    }
    window.addEventListener("wheel", block, { capture: true, passive: false });
    window.addEventListener("touchmove", block, { capture: true, passive: false });
    absorber = {
      finished: function () {
        done = true;
        maxTimer = window.setTimeout(release, 1200);
        tryRelease();
      }
    };
  }

  /** Bir şey ters giderse intro hiç olmamış gibi davran: durağan kare + normal sayfa. */
  function fail() {
    state && (state.phase = "done");
    if (renderer) teardown();
    html.classList.remove("intro-play", "valley-active");
    html.classList.add("intro-still");
    if (HE.lockScroll) HE.lockScroll(false);
    HE.store && HE.store.set("sessionStorage", "he-valley", "1");
  }

  // Test ve doğrulama için (scripts/intro-check.mjs, scripts/valley-return-check.mjs)
  HE.valley = {
    state: state,
    exit: exit,
    enter: enter,
    phase: function () { return state.phase; },
    looping: function () { return looping; },
    camera: function () { return world && world.camera.position.toArray().map(function (v) { return +v.toFixed(2); }); },
    snapshot: function () { if (!renderer) return null; composer.render(); return renderer.domElement.toDataURL("image/png"); }
  };
})();
