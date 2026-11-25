/* ==========================================================================
   projects.js — Projeler: "dosya klasörü" rafı ve açılan proje ayrıntısı
   Veri: data/projeler.js (window.HE_PROJECTS). Bu dosya HTML'i o veriden üretir.

   1. Raf        klasörleri üretir; yatay kaydırma (scroll-snap, tekerlek, ok tuşları, kenar okları)
   2. Açma       tıklayınca seçilen klasör ekranı dolduracak şekilde büyür:
                 View Transitions API varsa onunla, yoksa FLIP (yalnız transform + opacity).
                 Diğer klasörler yana kayıp kaybolur.
   3. Ayrıntı    başlık, açıklama, "Ne yaptım / Kullandığım araçlar", siteyi ziyaret et / Instagram, önce/sonra
                 kaydırıcısı, galeri (lightbox), tanıtım videosu bağlantısı; içerik 70 ms arayla belirir.
   4. Gezinme    önceki/sonraki (düğmeler + ←/→), kapatma (düğme, Esc, tarayıcının geri tuşu),
                 URL hash'i (projeler.html#zanemoda doğrudan açar), ilerleme çubuğu, odak tuzağı.
   Hareket azaltma açıkken yalnız opaklık geçişi kullanılır.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE || {};
  var DATA = window.HE_PROJECTS;
  var html = document.documentElement;
  var list = document.querySelector("[data-shelf-list]");
  var track = document.querySelector("[data-shelf-track]");
  var shelf = document.querySelector("[data-shelf]");
  var view = document.querySelector("[data-folder-view]");
  if (!DATA || !list || !view) return;

  var sheet = view.querySelector("[data-fv-sheet]");
  var scroller = view.querySelector("[data-fv-scroll]");
  var progressBar = view.querySelector("[data-fv-progress]");
  var PROJ = DATA.PROJELER;
  var reduce = !!HE.reduce;
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  /* ---------- Yardımcılar ---------- */
  function lang() { return html.lang === "en" ? "en" : "tr"; }
  function tx(o) { return o ? (o[lang()] || o.tr || "") : ""; }
  function isTodo(s) { return !s || /\[\[TODO/.test(s); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  /** [[TODO]] ve [[KONTROL]] işaretlerini görünür biçimde vurgular */
  function rich(s) {
    return esc(s).replace(/(\[\[(?:TODO|KONTROL)[^\]]*\]\])/g, '<span class="todo">$1</span>');
  }
  var T = {
    tr: { open: "Klasörü aç", did: "Ne yaptım", tools: "Kullandığım araçlar", ba: "Önce / Sonra",
      before: "Öncesi", after: "Sonrası", baHint: "Karşılaştırmak için kaydırın ya da ← → tuşlarını kullanın.",
      baLabel: "Önce/sonra karşılaştırma kaydırıcısı", gallery: "Görseller ve süreç", visit: "Siteyi ziyaret et",
      shots: "Ekran görüntüleri eklenecek", video: "Tanıtım videosu", newTab: "(yeni sekmede açılır)" },
    en: { open: "Open folder", did: "What I did", tools: "Tools I used", ba: "Before / After",
      before: "Before", after: "After", baHint: "Drag to compare, or use the ← → keys.",
      baLabel: "Before/after comparison slider", gallery: "Images and process", visit: "Visit the site",
      shots: "Screenshots to be added", video: "Presentation video", newTab: "(opens in a new tab)" }
  };
  function t(k) { return T[lang()][k]; }

  /** <picture>: WebP + JPG yedeği, tembel yükleme, boyut rezervasyonu */
  function picture(im, alt, eager) {
    return '<picture><source srcset="' + im.src + '.webp" type="image/webp">' +
      '<img src="' + im.src + '.jpg" width="' + im.w + '" height="' + im.h + '" alt="' + esc(alt) + '"' +
      (eager ? "" : ' loading="lazy"') + ' decoding="async"></picture>';
  }

  /* =====================================================================
     1. RAF
     ===================================================================== */
  var folders = [];
  function renderShelf() {
    // başlık yuvası (ilk li) kalır; proje klasörleri yeniden üretilir
    list.querySelectorAll(".slot:not(.slot--title)").forEach(function (n) { n.remove(); });
    folders = [];
    PROJ.forEach(function (p, i) {
      var li = document.createElement("li");
      li.className = "slot";
      var num = String(i + 1).padStart(2, "0");
      var strip = p.kapak
        ? '<span class="folder-strip" aria-hidden="true">' + picture(p.kapak, "", i < 4) + "</span>"
        : '<span class="folder-strip folder-strip--empty" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M7 21h10"/></svg></span>';
      li.innerHTML =
        '<button type="button" class="folder" id="klasor-' + p.slug + '" data-slug="' + p.slug + '" data-group="' + p.grup +
          '" data-color="' + p.renk + '" aria-expanded="false" aria-controls="folder-view" style="--tab-top:' + (64 + (i % 6) * 34) + 'px">' +
          strip +
          '<span class="folder-body"><span class="folder-name"><span class="folder-name__num">' + num + "</span>" +
          '<span class="folder-name__title">' + esc(tx(p.baslik)) + "</span></span></span>" +
          '<span class="folder-tab"><span class="folder-label" lang="en">' + esc(p.etiket) + "</span></span>" +
          '<span class="sr-only"> — ' + esc(t("open")) + "</span>" +
        "</button>";
      list.appendChild(li);
      folders.push(li.querySelector(".folder"));
    });
  }
  renderShelf();

  list.addEventListener("click", function (e) {
    var f = e.target.closest(".folder");
    if (f) open(f.dataset.slug, { push: true });
  });

  /* Klavye: raftaki klasörler arasında ← → / Home / End */
  list.addEventListener("keydown", function (e) {
    var i = folders.indexOf(document.activeElement);
    if (i < 0) return;
    var next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = folders[Math.min(folders.length - 1, i + 1)];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = folders[Math.max(0, i - 1)];
    else if (e.key === "Home") next = folders[0];
    else if (e.key === "End") next = folders[folders.length - 1];
    if (!next) return;
    e.preventDefault();
    next.focus({ preventScroll: true });
    next.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "nearest", block: "nearest" });
  });

  /* Yatay kaydırma: kenar okları, tekerlek, kaydırılabilirlik ipucu */
  var prevArrow = document.querySelector("[data-shelf-prev]");
  var nextArrow = document.querySelector("[data-shelf-next]");
  function horizontal() { return track.scrollWidth > track.clientWidth + 4 && window.matchMedia("(min-width: 769px)").matches; }
  function updateArrows() {
    var h = horizontal();
    var canPrev = h && track.scrollLeft > 4;
    var canNext = h && track.scrollLeft < track.scrollWidth - track.clientWidth - 4;
    prevArrow.classList.toggle("is-visible", canPrev);
    nextArrow.classList.toggle("is-visible", canNext);
    shelf.classList.toggle("can-prev", canPrev);
    shelf.classList.toggle("can-next", canNext);
  }
  track.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  window.addEventListener("load", updateArrows);
  updateArrows();
  prevArrow.addEventListener("click", function () { track.scrollBy({ left: -track.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" }); });
  nextArrow.addEventListener("click", function () { track.scrollBy({ left: track.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" }); });
  // Fare tekerleği: dikey hareket rafı yana kaydırır; rafın ucuna gelince sayfa kaymaya devam eder
  track.addEventListener("wheel", function (e) {
    if (!horizontal() || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var max = track.scrollWidth - track.clientWidth;
    var goingRight = e.deltaY > 0;
    if ((goingRight && track.scrollLeft >= max - 1) || (!goingRight && track.scrollLeft <= 0)) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 32 : 1);
  }, { passive: false });

  /* =====================================================================
     3. AYRINTI
     ===================================================================== */
  var current = -1;

  function renderSheet(i) {
    var p = PROJ[i];
    var g = DATA.gruplar[p.grup];
    sheet.dataset.group = p.grup;
    sheet.setAttribute("data-color", p.renk);
    var parts = [];

    // Başlık bölümü
    var visit = !isTodo(p.baglanti) && p.baglanti
      ? '<a class="fv-visit" href="' + esc(p.baglanti) + '" target="_blank" rel="noopener">' + esc(t("visit")) +
        ' <svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"/></svg><span class="sr-only"> ' + esc(t("newTab")) + "</span></a>"
      : "";
    if (p.instagram && !isTodo(p.instagram)) {
      visit += '<a class="fv-visit fv-visit--ghost" href="' + esc(p.instagram) + '" target="_blank" rel="noopener">Instagram' +
        ' <svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"/></svg><span class="sr-only"> ' + esc(t("newTab")) + "</span></a>";
    }
    parts.push(
      '<header class="fv-head fv-stagger">' +
        '<span class="fv-head__tag" lang="en">' + esc(p.etiket) + "</span>" +
        '<h2 id="fv-title" tabindex="-1">' + esc(tx(p.baslik)) + "</h2>" +
        '<p class="fv-head__lede">' + rich(tx(p.kisa)) + "</p>" +
        (g.kunye ? '<p class="fv-head__meta">' + esc(tx(g.kunye)) + "</p>" : "") +
        (visit ? '<div class="fv-head__actions">' + visit + "</div>" : "") +
      "</header>"
    );

    // Ne yaptım / Kullandığım araçlar
    parts.push(
      '<div class="fv-sections">' +
        '<section class="fv-card fv-stagger"><h3>' + esc(t("did")) + "</h3><p>" + rich(tx(p.neYaptim)) + "</p></section>" +
        '<section class="fv-card fv-stagger"><h3>' + esc(t("tools")) + '</h3><ul class="fv-badges">' +
          p.araclar.map(function (a) { return "<li>" + rich(a) + "</li>"; }).join("") + "</ul></section>" +
      "</div>"
    );

    // Önce / Sonra
    if (p.onceSonra) {
      var o = p.onceSonra.once, s = p.onceSonra.sonra;
      var ratio = Math.min(2, Math.max(0.75, s.w / s.h));
      parts.push(
        '<section class="fv-block fv-stagger"><h3>' + esc(t("ba")) + "</h3>" +
          '<div class="ba" style="--ba-ratio:' + ratio.toFixed(3) + '" data-ba>' +
            '<span class="ba__after">' + picture(s, tx(s.alt)) + "</span>" +
            '<span class="ba__before">' + picture(o, tx(o.alt)) + "</span>" +
            '<span class="ba__tag ba__tag--before">' + esc(t("before")) + "</span>" +
            '<span class="ba__tag ba__tag--after">' + esc(t("after")) + "</span>" +
            '<button type="button" class="ba__handle" role="slider" aria-label="' + esc(t("baLabel")) +
              '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50%">' +
              '<span class="ba__knob" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6-6 6 6 6M15 6l6 6-6 6"/></svg></span>' +
            "</button>" +
          "</div>" +
          '<p class="ba__hint">' + esc(t("baHint")) + "</p>" +
        "</section>"
      );
    }

    // Galeri
    var shots = (p.gorseller || []).slice();
    if (p.kapak && !(p.onceSonra && p.onceSonra.sonra.src === p.kapak.src)) {
      shots.unshift({ src: p.kapak.src, w: p.kapak.w, h: p.kapak.h, alt: { tr: tx(p.baslik), en: tx(p.baslik) }, not: null });
    }
    if (shots.length) {
      parts.push(
        '<section class="fv-block fv-stagger"><h3>' + esc(t("gallery")) + '</h3><ul class="fv-gallery">' +
          shots.map(function (im, k) {
            return '<li><button type="button" data-zoom="' + k + '">' + picture(im, tx(im.alt)) +
              (im.not ? "<span>" + esc(tx(im.not)) + "</span>" : "") + "</button></li>";
          }).join("") +
        "</ul></section>"
      );
    } else {
      parts.push(
        '<section class="fv-block fv-stagger"><div class="fv-placeholder">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 6"/></svg>' +
          "<p>" + esc(t("shots")) + '</p><p><span class="todo">[[TODO: ' + esc(p.slug) + " ekran görüntüleri — assets/projects/web/" + esc(p.slug) + "/]]</span></p>" +
        "</div></section>"
      );
    }

    // Grafik Animasyon: tanıtım videosu (YouTube'da açılır; gömülmez)
    if (g.video) {
      parts.push(
        '<section class="fv-block fv-stagger"><h3>' + esc(t("video")) + "</h3>" +
          '<a class="fv-video" href="' + g.video.href + '" target="_blank" rel="noopener">' +
            picture(g.video.kapak, "") +
            '<span class="fv-video__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg></span>' +
            '<span class="fv-video__label">' + esc(tx(g.video.ad)) + ' <svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"/></svg>' +
            '<span class="sr-only"> YouTube ' + esc(t("newTab")) + "</span></span>" +
          "</a>" +
        "</section>"
      );
    }

    sheet.innerHTML = parts.join("");
    sheet._shots = shots;
    initBeforeAfter(sheet.querySelector("[data-ba]"));
    scroller.scrollTop = 0;
    updateProgress();
  }

  /** İçeriği 70 ms arayla aşağıdan yukarı belirtir */
  function stagger() {
    var items = sheet.querySelectorAll(".fv-stagger");
    items.forEach(function (el, k) {
      if (reduce) { el.classList.add("is-in"); return; }
      el.style.transitionDelay = k * 70 + "ms";
      requestAnimationFrame(function () { el.classList.add("is-in"); });
    });
  }

  /* Galeri → lightbox */
  sheet.addEventListener("click", function (e) {
    var b = e.target.closest("[data-zoom]");
    if (!b || !HE.lightbox) return;
    var items = sheet._shots.map(function (im) { return { src: im.src + ".webp", alt: tx(im.alt), caption: im.not ? tx(im.not) : tx(im.alt) }; });
    HE.lightbox.open(items, Number(b.dataset.zoom), b);
  });

  /* Önce/Sonra kaydırıcısı: fare, dokunma ve klavye */
  function initBeforeAfter(box) {
    if (!box) return;
    var handle = box.querySelector(".ba__handle");
    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      box.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(pct)));
      handle.setAttribute("aria-valuetext", Math.round(pct) + "%");
    }
    function fromEvent(e) {
      var r = box.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }
    var dragging = false;
    box.addEventListener("pointerdown", function (e) {
      dragging = true;
      box.setPointerCapture(e.pointerId);
      fromEvent(e);
      handle.focus({ preventScroll: true });
    });
    box.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    box.addEventListener("pointerup", function () { dragging = false; });
    box.addEventListener("pointercancel", function () { dragging = false; });
    handle.addEventListener("keydown", function (e) {
      var now = Number(handle.getAttribute("aria-valuenow"));
      var step = e.shiftKey ? 10 : 4;
      var map = { ArrowLeft: now - step, ArrowDown: now - step, ArrowRight: now + step, ArrowUp: now + step, Home: 0, End: 100, PageDown: now - 20, PageUp: now + 20 };
      if (!(e.key in map)) return;
      e.preventDefault();
      e.stopPropagation();   // klasörler arası ← → gezinmesine karışmasın
      set(map[e.key]);
    });
    set(50);
  }

  /* İlerleme çubuğu */
  function updateProgress() {
    var max = scroller.scrollHeight - scroller.clientHeight;
    progressBar.style.transform = "scaleX(" + (max > 0 ? scroller.scrollTop / max : 0) + ")";
  }
  scroller.addEventListener("scroll", updateProgress, { passive: true });

  /* =====================================================================
     2. AÇMA / KAPAMA (View Transitions → FLIP yedeği → hareket azaltmada opaklık)
     ===================================================================== */
  var lastFolder = null;

  function setAway(i, on) {
    list.querySelectorAll(".slot:not(.slot--title), .slot--title").forEach(function (li) {
      var f = li.querySelector(".folder");
      var idx = f ? folders.indexOf(f) : -1;
      li.classList.remove("is-away-left", "is-away-right");
      if (on && idx !== i) li.classList.add(idx < i ? "is-away-left" : "is-away-right");
    });
  }

  function markExpanded(i) {
    folders.forEach(function (f, k) { f.setAttribute("aria-expanded", k === i ? "true" : "false"); });
  }

  function lockPage(on) {
    if (HE.lockScroll) HE.lockScroll(on);
    document.body.style.overflow = on ? "hidden" : "";
  }

  function indexOfSlug(slug) {
    for (var k = 0; k < PROJ.length; k++) if (PROJ[k].slug === slug) return k;
    return -1;
  }

  /**
   * Klasörü açar. opts.push: geçmişe #slug ekle (geri tuşu kapatsın); opts.instant: animasyonsuz
   */
  function open(slug, opts) {
    opts = opts || {};
    var i = indexOfSlug(slug);
    if (i < 0) return;
    if (!view.hidden) { go(i - current, opts); return; }
    current = i;
    lastFolder = folders[i];
    renderSheet(i);
    markExpanded(i);
    if (opts.push) history.pushState({ slug: slug }, "", "#" + slug);
    lockPage(true);

    var done = function () {
      view.style.transform = "";
      view.style.opacity = "";
      view.style.transition = "";
      stagger();
      var h = sheet.querySelector("#fv-title");
      if (h) h.focus({ preventScroll: true });
    };

    if (opts.instant) {          // doğrudan bağlantı (#slug): animasyonsuz açılır
      view.hidden = false;
      setAway(i, true);
      done();
      return;
    }
    if (reduce) {                // hareket azaltma: yalnız opaklık
      view.hidden = false;
      view.style.opacity = "0";
      requestAnimationFrame(function () {
        view.style.transition = "opacity 240ms linear";
        view.style.opacity = "1";
        setTimeout(done, 250);
      });
      return;
    }

    if (document.startViewTransition) {
      // View Transitions API: klasör (eski görüntü) → panel (yeni görüntü)
      lastFolder.style.viewTransitionName = "folder-open";
      var vt = document.startViewTransition(function () {
        lastFolder.style.viewTransitionName = "";
        view.hidden = false;
        view.style.viewTransitionName = "folder-open";
        setAway(i, true);
      });
      vt.finished.then(function () { view.style.viewTransitionName = ""; done(); }, done);
      return;
    }

    // FLIP yedeği: panel, klasörün dikdörtgeninden başlayıp ekranı doldurur
    var r = lastFolder.getBoundingClientRect();
    view.hidden = false;
    view.style.transform = "translate(" + r.left + "px," + r.top + "px) scale(" + r.width / innerWidth + "," + r.height / innerHeight + ")";
    view.style.opacity = "0.5";
    setAway(i, true);
    view.getBoundingClientRect();   // tarayıcı başlangıç durumunu çizsin
    view.style.transition = "transform 560ms " + EASE + ", opacity 360ms " + EASE;
    view.style.transform = "none";
    view.style.opacity = "1";
    setTimeout(done, 580);
  }

  /** Paneli kapatır, klasörü yerine koyar ve odağı ona döndürür */
  function closeView() {
    if (view.hidden) return;
    var folder = folders[current] || lastFolder;
    var finish = function () {
      view.hidden = true;
      view.style.transform = "";
      view.style.opacity = "";
      view.style.transition = "";
      view.style.viewTransitionName = "";
      setAway(-1, false);
      markExpanded(-1);
      lockPage(false);
      if (folder) {
        folder.style.viewTransitionName = "";
        folder.focus({ preventScroll: true });
        folder.scrollIntoView({ behavior: "auto", inline: "nearest", block: "nearest" });
      }
      current = -1;
    };

    if (reduce) {
      view.style.transition = "opacity 200ms linear";
      view.style.opacity = "0";
      setTimeout(finish, 210);
      return;
    }
    if (document.startViewTransition && folder) {
      view.style.viewTransitionName = "folder-open";
      var vt = document.startViewTransition(function () {
        view.style.viewTransitionName = "";
        view.hidden = true;
        setAway(-1, false);
        folder.style.viewTransitionName = "folder-open";
      });
      vt.finished.then(finish, finish);
      return;
    }
    // FLIP ters: panel klasörün dikdörtgenine küçülür
    setAway(-1, false);
    var r = folder ? folder.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 1, height: 1 };
    view.style.transition = "transform 480ms " + EASE + ", opacity 420ms " + EASE;
    view.style.transform = "translate(" + r.left + "px," + r.top + "px) scale(" + r.width / innerWidth + "," + r.height / innerHeight + ")";
    view.style.opacity = "0";
    setTimeout(finish, 490);
  }

  /** Kapat düğmesi / Esc: geçmişte #slug varsa geri git (popstate kapatır), yoksa doğrudan kapat */
  function requestClose() {
    if (history.state && history.state.slug) history.back();
    else { closeView(); history.replaceState(null, "", location.pathname + location.search); }
  }

  /** Önceki / sonraki klasöre kayarak geç (dir: -1 | +1 ya da fark) */
  function go(dir, opts) {
    if (view.hidden || !dir) return;
    var n = (current + dir + PROJ.length) % PROJ.length;
    var leave = dir > 0 ? "is-leaving-left" : "is-leaving-right";
    var swap = function () {
      current = n;
      lastFolder = folders[n];
      renderSheet(n);
      markExpanded(n);
      setAway(n, true);
      sheet.classList.remove("is-leaving-left", "is-leaving-right");
      history.replaceState({ slug: PROJ[n].slug }, "", "#" + PROJ[n].slug);
      stagger();
      var h = sheet.querySelector("#fv-title");
      if (h) h.focus({ preventScroll: true });
      // arkadaki rafta da o klasör görünür olsun (kapatınca yerine döner)
      folders[n].scrollIntoView({ behavior: "auto", inline: "nearest", block: "nearest" });
    };
    if (reduce || (opts && opts.instant)) { swap(); return; }
    sheet.classList.add(leave);
    setTimeout(swap, 260);
  }

  view.querySelector("[data-fv-close]").addEventListener("click", requestClose);
  view.querySelector("[data-fv-prev]").addEventListener("click", function () { go(-1); });
  view.querySelector("[data-fv-next]").addEventListener("click", function () { go(1); });

  /* Klavye: Esc kapatır, ← → gezinir, Tab panel içinde kalır (odak tuzağı) */
  view.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (document.querySelector("dialog.lightbox[open]")) return;   // önce ışık kutusu kapanır
      e.preventDefault();
      requestClose();
      return;
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest(".ba__handle")) {
      e.preventDefault();
      go(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (e.key !== "Tab") return;
    var items = Array.prototype.filter.call(
      view.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement.id === "fv-title")) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Tarayıcının geri / ileri tuşları */
  window.addEventListener("popstate", function () {
    var slug = decodeURIComponent(location.hash.slice(1));
    if (indexOfSlug(slug) >= 0) { open(slug, {}); return; }
    closeView();
    focusGroup(slug);   // aynı sayfada #web-projeleri / #grafik-animasyon bağlantısı
  });

  /* Dil değişince raf ve açık ayrıntı yeniden yazılır */
  document.addEventListener("he:lang", function () {
    renderShelf();
    if (!view.hidden && current >= 0) { renderSheet(current); stagger(); markExpanded(current); setAway(current, true); }
  });

  /* =====================================================================
     4. URL HASH: projeler.html#zanemoda doğrudan o klasörü açar;
        #web-projeleri / #grafik-animasyon ilgili grubun ilk klasörüne götürür
     ===================================================================== */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    if (indexOfSlug(h) >= 0) {
      // geri tuşu klasörü kapatsın diye: önce rafı (hash'siz), sonra klasörü geçmişe yaz
      history.replaceState(null, "", location.pathname + location.search);
      open(h, { push: true, instant: true });
      return;
    }
    focusGroup(h);
  }

  /** #web-projeleri / #grafik-animasyon: rafı o grubun ilk klasörüne kaydırır ve odaklar */
  function focusGroup(h) {
    var group = h === "web-projeleri" ? "web" : h === "grafik-animasyon" ? "grafik" : null;
    if (!group) return;
    for (var k = 0; k < PROJ.length; k++) {
      if (PROJ[k].grup === group) {
        var f = folders[k];
        setTimeout(function () {
          if (HE.scrollTo) HE.scrollTo(shelf, { immediate: true, offset: -90 });
          f.scrollIntoView({ behavior: "auto", inline: "start", block: "nearest" });
          f.focus({ preventScroll: true });
          updateArrows();
        }, 60);
        break;
      }
    }
  }
  if (document.readyState === "complete") fromHash();
  else window.addEventListener("load", fromHash);

  // Test ve doğrulama için (scripts/projeler-check.mjs)
  HE.projects = { open: function (s) { open(s, { push: true }); }, close: requestClose, current: function () { return current < 0 ? null : PROJ[current].slug; } };
})();
