// Gece çiçek vadisi intro'sunun kanıtı (npm run intro-check; önce npm run serve).
// index.html?intro=1&motion=full, 1440×900 ve 390×844:
//   - 0–6. saniye kareleri (her saniye) + video (docs/intro-check/video-<genişlik>.webm)
//   - tekerlek / dokunma ile kameranın yol boyunca ilerlediği, imlecin noktaları ittiği kareler
//   - kaydırmaya devam edince yolun sonunda vadiden Hakkımda'ya geçiş (ok düğmesi yok), ardından Three.js kaynaklarının kaldırıldığı
// Ayrıca: hareket azaltma açıkken intro oynamaz, durağan vadi karesi + arayüz görünür.
// Sonuçlar docs/intro-check/report.json dosyasına yazılır.
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/intro-check';
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/\.(png|webm|json)$/.test(f)) rmSync(`${out}/${f}`, { force: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { sizes: [] };
const state = (page) => page.evaluate(() => ({
  phase: window.HE.valley?.state.phase,
  t: Number((window.HE.valley?.state.t ?? 0).toFixed(3)),
  canvas: !!document.querySelector('.valley__canvas'),
  cls: document.documentElement.className,
  scrollY: Math.round(window.scrollY),
}));

for (const size of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const videoDir = `${out}/video-tmp-${size.n}`;
  const ctx = await browser.newContext({
    viewport: { width: size.w, height: size.h }, reducedMotion: 'no-preference', isMobile: size.m, hasTouch: size.m,
    recordVideo: { dir: videoDir, size: { width: size.w, height: size.h } },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const steps = [];
  await page.goto(`${base}/?intro=1&motion=full`);

  // 0–6. saniye kareleri
  const t0 = Date.now();
  for (let s = 0; s <= 6; s++) {
    const wait = t0 + s * 1000 - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${size.n}-${s}s.png` });
    steps.push({ step: `${s}s`, ...(await state(page)) });
  }
  await page.waitForTimeout(1200);

  // İmleç: noktaları iter, yakınındakiler parlar (yalnız masaüstü)
  if (!size.m) {
    await page.mouse.move(size.w * 0.3, size.h * 0.7);
    await page.mouse.move(size.w * 0.55, size.h * 0.62, { steps: 8 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${size.n}-imlec.png` });
    steps.push({ step: 'imlec', ...(await state(page)) });
  }
  // Ok butonu kaldırıldı (akış kaydırmayla devam eder)
  const noArrow = await page.evaluate(() => !document.querySelector('.valley__enter'));

  // Ses: varsayılan kapalı, düğmeyle açılır (aria-pressed)
  const soundBefore = await page.getAttribute('[data-valley-sound]', 'aria-pressed');
  await page.click('[data-valley-sound]');
  await page.waitForTimeout(300);
  const soundAfter = await page.getAttribute('[data-valley-sound]', 'aria-pressed');
  const audioOn = await page.evaluate(() => HE.valleyAudio.isOn());
  steps.push({ step: 'ses', before: soundBefore, after: soundAfter, audioOn });

  // Tekerlek / dokunma ile ilerleme
  const before = (await state(page)).t;
  if (size.m) {
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        const fire = (type, y) => {
          const t = new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y });
          window.dispatchEvent(new TouchEvent(type, { cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
        };
        fire('touchstart', 600); fire('touchmove', 450); fire('touchmove', 300);
      });
      await page.waitForTimeout(150);
    }
  } else {
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(80); }
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/${size.n}-ilerleme.png` });
  const after = await state(page);
  steps.push({ step: 'ilerleme', ...after, advanced: Number((after.t - before).toFixed(3)) });

  // Kaydırmaya devam: yolun sonunda vadi kapanır ve Hakkımda gelir
  for (let i = 0; i < 60 && (await state(page)).phase === 'explore'; i++) {
    if (size.m) {
      await page.evaluate(() => {
        const fire = (type, y) => {
          const t = new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y });
          window.dispatchEvent(new TouchEvent(type, { cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
        };
        fire('touchstart', 650); fire('touchmove', 450); fire('touchmove', 250);
      });
    } else {
      await page.mouse.wheel(0, 160);
    }
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${size.n}-gecis.png` });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/${size.n}-hakkimda.png` });
  const end = await state(page);
  const aboutTop = await page.evaluate(() => Math.round(document.getElementById('hakkimda').getBoundingClientRect().top));
  steps.push({ step: 'cikis', ...end, aboutTop });

  await ctx.close();
  const vid = readdirSync(videoDir).find((f) => f.endsWith('.webm'));
  if (vid) renameSync(`${videoDir}/${vid}`, `${out}/video-${size.n}.webm`);
  rmSync(videoDir, { recursive: true, force: true });

  report.sizes.push({
    size: size.n, steps, errors,
    // 25.11.2026: çıkışta sahne kapatılmaz, park edilir (canlı vadi; geri kaydırınca yeniden girilir)
    ok: errors.length === 0 && end.phase === 'docked' && end.canvas && Math.abs(aboutTop) < 120 &&
      steps.find((s) => s.step === 'ilerleme').advanced > 0.02 &&
      steps.find((s) => s.step === 'ses').before === 'false' && steps.find((s) => s.step === 'ses').after === 'true' &&
      noArrow,
  });
}

// Hareket azaltma: intro oynamaz, durağan kare + arayüz
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${base}/?intro=1`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/reduced-1440.png` });
  const r = await page.evaluate(() => ({
    cls: document.documentElement.className,
    canvas: !!document.querySelector('.valley__canvas'),
    still: getComputedStyle(document.querySelector('.valley__stage')).backgroundImage.includes('valley-still'),
    titleVisible: getComputedStyle(document.querySelector('.valley__title')).opacity === '1',
  }));
  report.reduced = { ...r, ok: !r.canvas && r.still && r.titleVisible && r.cls.includes('intro-still') };
  await ctx.close();
}

await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
