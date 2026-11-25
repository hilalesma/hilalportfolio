/* ==========================================================================
   contact.js — İletişim formu (Web3Forms, sayfa yenilenmeden gönderim)
   - Alan yanında doğrulama: zorunlu alanlar, e-posta ve telefon biçimi, mesaj uzunluğu
   - Gönderim: form.action (https://api.web3forms.com/submit) adresine fetch ile JSON POST.
     Formdaki gizli access_key alanı mesajı sahibinin e-posta adresine yönlendirir.
   - Spam: "botcheck" honeypot işaretliyse hiçbir şey gönderilmez.
   - Gönderilirken düğme "Gönderiliyor..." olur ve pasifleşir (çift tıklama yok).
   - Sonuç: sağ altta koyu cam bildirim (toast). Başarıda form temizlenir; bağlantı sorununda
     nazik bir uyarı ve tek tıkla e-posta gönderme bağlantısı gösterilir.
   - Adres koda yazılmaz: js/config.js › contactEmail kullanılır.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("[data-contact]");
  if (!form) return;
  var config = window.HE_CONFIG || {};
  var isEn = function () { return document.documentElement.lang === "en"; };
  var MSG = {
    required: ["Bu alan zorunludur.", "This field is required."],
    email: ["Lütfen geçerli bir e-posta adresi gir.", "Please enter a valid e-mail address."],
    tel: ["Lütfen geçerli bir telefon numarası gir (yalnızca rakam, boşluk, +, -, parantez).", "Please enter a valid phone number (digits, spaces, +, -, brackets)."],
    short: ["Lütfen en az 10 karakter yaz.", "Please write at least 10 characters."],
    sending: ["Gönderiliyor...", "Sending..."],
    ok: ["Mesajın bana ulaştı! En kısa sürede dönüş yapacağım ✦", "Your message has been received! I will get back to you soon ✦"],
    fail: ["Şu an bağlantı kurulamadı, mesajın gönderilemedi. Dilersen bana doğrudan e-posta ile ulaşabilirsin:", "We couldn't connect right now, so your message wasn't sent. You can reach me directly by e-mail:"],
    close: ["Bildirimi kapat", "Close notification"]
  };
  var m = function (key) { return MSG[key][isEn() ? 1 : 0]; };

  var status = form.querySelector("[data-status]");
  var button = form.querySelector("[data-submit]");
  var fields = Array.prototype.slice.call(form.querySelectorAll('input[name]:not([type="hidden"]):not([name="botcheck"]), textarea[name]'));

  /** Bir alanı denetler; hata metnini alanın yanına yazar. */
  function check(el) {
    var v = el.value.trim();
    var error = "";
    if (el.required && !v) error = m("required");
    else if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) error = m("email");
    else if (v && el.type === "tel" && !/^[0-9+()\-\s]{7,20}$/.test(v)) error = m("tel");
    else if (v && el.name === "message" && v.length < 10) error = m("short");
    el.setAttribute("aria-invalid", error ? "true" : "false");
    var out = document.getElementById(el.id + "-err");
    if (out) out.textContent = error;
    return !error;
  }
  fields.forEach(function (el) {
    el.addEventListener("blur", function () { if (el.value) check(el); });
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") check(el); });
  });

  /* ---------- Cam bildirim (toast) ---------- */
  var toast = null, toastTimer = 0;
  function showToast(tone, text, withMail) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "form-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.dataset.tone = tone;
    toast.innerHTML = "";
    var icon = document.createElement("span");
    icon.className = "form-toast__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = tone === "ok" ? "✓" : "!";
    var body = document.createElement("p");
    body.className = "form-toast__text";
    body.textContent = text;
    if (withMail && config.contactEmail) {
      body.appendChild(document.createTextNode(" "));
      var a = document.createElement("a");
      a.href = "mailto:" + config.contactEmail;
      a.textContent = config.contactEmail;
      body.appendChild(a);
    }
    var close = document.createElement("button");
    close.type = "button";
    close.className = "form-toast__close";
    close.setAttribute("aria-label", m("close"));
    close.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-x"/></svg>';
    close.addEventListener("click", hideToast);
    toast.appendChild(icon);
    toast.appendChild(body);
    toast.appendChild(close);
    // bir sonraki karede görünür yap (geçiş animasyonu için)
    window.requestAnimationFrame(function () { toast.classList.add("is-visible"); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, tone === "ok" ? 6000 : 12000);
  }
  function hideToast() {
    if (toast) toast.classList.remove("is-visible");
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideToast(); });

  function setStatus(text, tone) {
    status.textContent = text;
    status.dataset.tone = tone || "";
  }
  function setBusy(on) {
    button.disabled = on;
    button.classList.toggle("is-sending", on);
    button.setAttribute("aria-busy", on ? "true" : "false");
  }

  /* ---------- Gönderim ---------- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();   // tarayıcı başka sayfaya gitmesin
    if (button.disabled) return;
    var results = fields.map(check);
    if (results.indexOf(false) !== -1) {
      var firstBad = fields.filter(function (el) { return el.getAttribute("aria-invalid") === "true"; })[0];
      if (firstBad) firstBad.focus();
      return;
    }
    if (form.elements.botcheck && form.elements.botcheck.checked) return;   // honeypot: bot

    // form verisi → JSON (honeypot gönderilmez)
    var data = {};
    new FormData(form).forEach(function (value, key) { if (key !== "botcheck") data[key] = value; });

    setBusy(true);
    setStatus(m("sending"));
    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok || json.success === false) throw new Error(json.message || String(res.status));
          return json;
        });
      })
      .then(function () {
        form.reset();
        fields.forEach(function (el) {
          el.removeAttribute("aria-invalid");
          var out = document.getElementById(el.id + "-err");
          if (out) out.textContent = "";
        });
        setStatus(m("ok"), "ok");
        showToast("ok", m("ok"));
      })
      .catch(function () {
        setStatus(m("fail") + (config.contactEmail ? " " + config.contactEmail : ""), "err");
        showToast("err", m("fail"), true);
      })
      .then(function () { setBusy(false); });
  });

  // Doğrulama için (scripts/contact-check.mjs)
  window.HE = window.HE || {};
  window.HE.contactForm = { endpoint: function () { return form.action; } };
})();
