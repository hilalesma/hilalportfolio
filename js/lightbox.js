/* ==========================================================================
   lightbox.js — Ortak görsel görüntüleyici (projeler ve galeri)
   Kullanım: HE.lightbox.open([{ src, alt, caption }], startIndex, openerElement)
   Klavye: ← → gezinme, Escape kapatır. Dokunmatik: sağa/sola kaydırma (swipe).
   Yerel <dialog> kullanır: odak içeride kalır ve kapanınca açan öğeye döner.
   ========================================================================== */
(function () {
  "use strict";

  var HE = window.HE;
  var dialog = null;
  var img;
  var cap;
  var count;
  var items = [];
  var index = 0;
  var opener = null;

  function t(key, tr) { return HE.t ? HE.t(key, tr) : tr; }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", t("lightbox.label", "Görsel görüntüleyici"));
    dialog.innerHTML =
      '<figure><img alt=""><figcaption><span data-cap></span><span class="lightbox__count" data-count></span></figcaption></figure>' +
      '<button type="button" class="lightbox__btn lightbox__close" data-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg><span class="sr-only"></span></button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" data-prev><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg><span class="sr-only"></span></button>' +
      '<button type="button" class="lightbox__btn lightbox__next" data-next><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg><span class="sr-only"></span></button>';
    document.body.appendChild(dialog);
    img = dialog.querySelector("img");
    cap = dialog.querySelector("[data-cap]");
    count = dialog.querySelector("[data-count]");
    dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
    dialog.querySelector("[data-prev]").addEventListener("click", function () { show(index - 1, -1); });
    dialog.querySelector("[data-next]").addEventListener("click", function () { show(index + 1, 1); });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(index - 1, -1);
      if (e.key === "ArrowRight") show(index + 1, 1);
    });
    dialog.addEventListener("close", function () { if (opener) opener.focus(); });
    // Swipe (dokunmatik kaydırma)
    var x0 = null;
    img.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    img.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  function labels() {
    dialog.querySelector("[data-close] .sr-only").textContent = t("lightbox.close", "Kapat");
    dialog.querySelector("[data-prev] .sr-only").textContent = t("lightbox.prev", "Önceki görsel");
    dialog.querySelector("[data-next] .sr-only").textContent = t("lightbox.next", "Sonraki görsel");
    var single = items.length < 2;
    dialog.querySelector("[data-prev]").hidden = single;
    dialog.querySelector("[data-next]").hidden = single;
  }

  function show(i, dir) {
    index = (i + items.length) % items.length;
    var item = items[index];
    img.src = item.src;
    img.alt = item.alt || "";
    cap.textContent = item.caption || item.alt || "";
    count.textContent = (index + 1) + " / " + items.length;
    if (dir && window.gsap && !HE.reduce) {
      window.gsap.fromTo(img, { x: dir * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "expo.out" });
    }
  }

  HE.lightbox = {
    open: function (list, start, from) {
      if (!list || !list.length) return;
      if (!dialog) build();
      items = list;
      opener = from || document.activeElement;
      labels();
      show(start || 0, 0);
      dialog.showModal();
      if (window.gsap && !HE.reduce) window.gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
    }
  };
})();
