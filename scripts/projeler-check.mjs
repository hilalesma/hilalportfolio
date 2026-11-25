// Projeler sayfası ("dosya klasörü" rafı) için uçtan uca test → docs/projeler-check/
// 1440×900 ve 390×844'te: raf, hover, klasör açma (tıklama), önce/sonra kaydırıcısı (klavye + sürükleme),
// ilerleme çubuğu, ← → ile sonraki proje, Esc ile kapatma ve odağın klasöre dönmesi, tarayıcının geri tuşu,
// hash ile doğrudan açma (projeler.html#zanemoda), hareket azaltmada açma/kapama. Konsol hataları raporlanır.
// Kullanım: npm run serve → node scripts/projeler-check.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/projeler-check';
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/\.(png|json)$/.test(f)) rmSync(`${out}/${f}`, { force: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};
const state = (p) => p.evaluate(() => ({
  open: !document.querySelector('[data-folder-view]').hidden,
  hash: location.hash,
  current: window.HE.projects.current(),
  focusInView: !!document.activeElement.closest('[data-folder-view]'),
  focusId: document.activeElement.id || document.activeElement.className,
}));

for (const size of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, isMobile: size.m, hasTouch: size.m, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const r = { steps: [] };
  const step = async (name, extra = {}) => r.steps.push({ step: name, ...(await state(page)), ...extra });

  await page.goto(`${base}/projeler.html`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${size.n}-1-raf.png` });
  r.folders = await page.locator('.folder').count();

  // Hover (masaüstü)
  if (!size.m) {
    await page.hover('#klasor-history-brush');
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${out}/${size.n}-2-hover.png` });
    r.hoverLift = await page.evaluate(() => getComputedStyle(document.querySelector('#klasor-history-brush')).transform);
    // Raf yatay kaydırılabiliyor mu, sağ ok görünüyor mu
    r.shelfScrollable = await page.evaluate(() => { const t = document.querySelector('[data-shelf-track]'); return t.scrollWidth > t.clientWidth; });
    r.nextArrowVisible = await page.evaluate(() => document.querySelector('[data-shelf-next]').classList.contains('is-visible'));
  }

  // Klasörü aç
  await page.locator('#klasor-history-brush').scrollIntoViewIfNeeded();
  await page.click('#klasor-history-brush');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/${size.n}-3-aciliyor.png` });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${out}/${size.n}-4-acik.png` });
  await step('ac', { expanded: await page.getAttribute('#klasor-history-brush', 'aria-expanded') });

  // Önce/sonra: klavye
  await page.focus('.ba__handle');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  const kb = await page.getAttribute('.ba__handle', 'aria-valuenow');
  // Önce/sonra: sürükleme
  const box = await page.locator('[data-ba]').boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();
  const drag = await page.getAttribute('.ba__handle', 'aria-valuenow');
  await page.locator('[data-ba]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${size.n}-5-once-sonra.png` });
  r.beforeAfter = { keyboardTo: Number(kb), dragTo: Number(drag) };

  // İlerleme çubuğu
  await page.evaluate(() => { const s = document.querySelector('[data-fv-scroll]'); s.scrollTop = (s.scrollHeight - s.clientHeight) / 2; });
  await page.waitForTimeout(200);
  r.progress = await page.evaluate(() => document.querySelector('[data-fv-progress]').style.transform);

  // ← → ile sonraki proje (odak başlıkta)
  await page.focus('#fv-title');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(900);
  await step('sonraki');
  await page.screenshot({ path: `${out}/${size.n}-6-sonraki.png` });

  // Esc ile kapat → odak klasöre döner
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await step('esc');
  await page.screenshot({ path: `${out}/${size.n}-7-kapandi.png` });

  // Tekrar aç, tarayıcının geri tuşu ile kapat
  await page.click('#klasor-smart-object');
  await page.waitForTimeout(1000);
  await step('ac-2');
  await page.goBack();
  await page.waitForTimeout(1000);
  await step('geri-tusu', { url: page.url() });

  // Hash ile doğrudan açma
  await page.goto(`${base}/projeler.html#zanemoda`);
  await page.waitForTimeout(1400);
  await step('hash');
  await page.screenshot({ path: `${out}/${size.n}-8-hash-zanemoda.png` });
  await page.goBack();
  await page.waitForTimeout(900);
  await step('hash-geri');

  // Grup bağlantısı (#grafik-animasyon) rafı o gruba götürür
  await page.goto(`${base}/projeler.html#grafik-animasyon`);
  await page.waitForTimeout(1200);
  r.groupFocus = await page.evaluate(() => document.activeElement.id);

  r.errors = errors;
  report[size.n] = r;
  await ctx.close();
}

// Hareket azaltma: yalnız opaklık; açma/kapama çalışır
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${base}/projeler.html`);
  await page.waitForTimeout(600);
  await page.click('#klasor-web-arayuzu');
  await page.waitForTimeout(600);
  const opened = await page.evaluate(() => !document.querySelector('[data-folder-view]').hidden);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const closed = await page.evaluate(() => document.querySelector('[data-folder-view]').hidden);
  report.reduced = { opened, closed };
  await ctx.close();
}
await browser.close();

const ok = (r, m) => {
  const s = Object.fromEntries(r.steps.map((x) => [x.step, x]));
  return r.errors.length === 0 && r.folders === 8 &&
    s.ac.open && s.ac.hash === '#history-brush' && s.ac.expanded === 'true' && s.ac.focusInView &&
    r.beforeAfter.keyboardTo > 50 && r.beforeAfter.dragTo < 35 && /scaleX\(0\.[1-9]/.test(r.progress) &&
    s.sonraki.current === 'urun-tanitimi' &&
    !s.esc.open && s.esc.focusId === 'klasor-urun-tanitimi' &&
    s['ac-2'].open && !s['geri-tusu'].open &&
    s.hash.open && s.hash.current === 'zanemoda' && !s['hash-geri'].open &&
    r.groupFocus === 'klasor-history-brush' &&
    (m || (r.shelfScrollable && r.nextArrowVisible));
};
report.ok = ok(report['1440'], false) && ok(report['390'], true) && report.reduced.opened && report.reduced.closed;
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));
