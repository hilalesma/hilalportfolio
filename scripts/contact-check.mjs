// İletişim formu (Web3Forms) için kanıt → docs/contact-check/
// GERÇEK GÖNDERİM YAPILMAZ: api.web3forms.com istekleri Playwright ile yakalanıp taklit edilir
// (başarılı yanıt, sunucu hatası, bağlantı kopması). Böylece e-posta kutusuna deneme mesajı düşmez.
// Ayrıca: "Gönderiliyor..." durumu + pasif düğme, gönderilen JSON, honeypot, Kopyala düğmesi, TR/EN.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/contact-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};

async function fill(page) {
  await page.fill('#cf-name', 'Test Kullanıcı');
  await page.fill('#cf-email', 'test@example.com');
  await page.fill('#cf-message', 'Bu bir deneme mesajıdır, gerçekten gönderilmez.');
}

for (const s of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error' && (msg.location()?.url || '').includes('localhost')) errors.push(msg.text()); });
  const r = { requests: [] };

  // --- 1) başarılı gönderim (yanıt 1,2 sn gecikmeli: "Gönderiliyor..." görülsün)
  let mode = 'ok';
  await page.route('https://api.web3forms.com/submit', async (route) => {
    const req = route.request();
    r.requests.push({ method: req.method(), ct: req.headers()['content-type'], body: JSON.parse(req.postData() || '{}') });
    await new Promise((res) => setTimeout(res, 1200));
    if (mode === 'ok') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Email sent successfully!' }) });
    if (mode === 'server') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Error' }) });
    return route.abort('internetdisconnected');
  });
  await page.goto(`${base}/iletisim.html`);
  await page.waitForTimeout(900);
  const urlBefore = page.url();
  await fill(page);
  await page.evaluate(() => document.querySelector('[data-submit]').scrollIntoView({ block: 'center' }));
  await page.click('[data-submit]');
  await page.waitForTimeout(300);
  r.sending = await page.evaluate(() => { const b = document.querySelector('[data-submit]'); return { disabled: b.disabled, text: b.innerText.trim() }; });
  await page.screenshot({ path: `${out}/${s.n}-gonderiliyor.png` });
  // çift tıklama: gönderim sürerken ikinci istek gitmemeli (düğme pasif; olay doğrudan tetiklenir)
  await page.evaluate(() => document.querySelector('[data-contact]').requestSubmit());
  await page.waitForTimeout(1600);
  r.ok = await page.evaluate(() => ({
    toast: document.querySelector('.form-toast')?.innerText.trim(),
    toastVisible: document.querySelector('.form-toast')?.classList.contains('is-visible'),
    cleared: !document.querySelector('#cf-name').value && !document.querySelector('#cf-message').value,
    enabledAgain: !document.querySelector('[data-submit]').disabled
  }));
  r.sameUrl = page.url() === urlBefore;
  await page.screenshot({ path: `${out}/${s.n}-basarili.png` });

  // --- 2) bağlantı kopması → nazik uyarı + e-posta bağlantısı
  mode = 'offline';
  await page.evaluate(() => document.querySelector('.form-toast__close')?.click());
  await fill(page);
  await page.click('[data-submit]');
  await page.waitForTimeout(1800);
  r.fail = await page.evaluate(() => ({
    toast: document.querySelector('.form-toast')?.innerText.trim().slice(0, 120),
    mailto: !!document.querySelector('.form-toast a[href^="mailto:"]'),
    keptText: !!document.querySelector('#cf-message').value
  }));
  await page.screenshot({ path: `${out}/${s.n}-hata.png` });

  // --- 3) sunucu hatası (success:false)
  mode = 'server';
  await page.click('[data-submit]');
  await page.waitForTimeout(1800);
  r.serverErr = await page.evaluate(() => document.querySelector('.form-toast')?.dataset.tone);

  // --- 4) honeypot işaretliyse istek gitmez
  const n0 = r.requests.length;
  await page.evaluate(() => { document.querySelector('[name="botcheck"]').checked = true; });
  await page.click('[data-submit]');
  await page.waitForTimeout(1500);
  r.honeypotBlocked = r.requests.length === n0;
  await page.evaluate(() => { document.querySelector('[name="botcheck"]').checked = false; });

  // --- 5) Kopyala düğmesi
  await page.evaluate(() => document.querySelector('.copy-btn--labeled').scrollIntoView({ block: 'center' }));
  await page.click('.copy-btn--labeled');
  await page.waitForTimeout(200);
  r.copy = await page.evaluate(async () => ({
    label: document.querySelector('.copy-btn--labeled').innerText.trim(),
    clipboardHasAt: (await navigator.clipboard.readText().catch(() => '')).includes('@')
  }));
  await page.screenshot({ path: `${out}/${s.n}-kopyalandi.png` });
  await page.waitForTimeout(2200);
  r.copyAfter = await page.evaluate(() => document.querySelector('.copy-btn--labeled').innerText.trim());

  // --- 6) EN
  await page.evaluate(() => document.querySelector('[data-set-lang="en"]').click());
  await page.waitForTimeout(400);
  mode = 'ok';
  await fill(page);
  await page.click('[data-submit]');
  await page.waitForTimeout(300);
  r.enSending = await page.evaluate(() => document.querySelector('[data-submit]').innerText.trim());
  await page.waitForTimeout(1600);
  r.enOk = await page.evaluate(() => document.querySelector('.form-toast')?.innerText.trim());
  r.enCopy = await page.evaluate(() => document.querySelector('.copy-btn--labeled').innerText.trim());
  await page.screenshot({ path: `${out}/${s.n}-en-basarili.png` });
  await page.evaluate(() => document.querySelector('[data-set-lang="tr"]').click());

  r.payloadKeys = r.requests[0] ? Object.keys(r.requests[0].body) : [];
  r.payloadHasKey = !!(r.requests[0] && r.requests[0].body.access_key);
  r.requestCount = r.requests.length;
  delete r.requests;
  r.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  r.errors = errors;
  report[s.n] = r;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
