// Manyetik butonlar için kanıt → docs/magnetic-check/
// İmleç butonun yanına gelince butonun imlece doğru kaydığını, uzaklaşınca yay ile
// (hafif taşmayla) merkeze döndüğünü ölçer. 1440×900 masaüstü; 390 px dokunmatikte etkinin kapalı olduğunu doğrular.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/magnetic-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};
const tr = (page, sel) => page.evaluate((s) => getComputedStyle(document.querySelector(s)).translate, sel);

for (const [name, path, sel] of [['ana-sayfa', '/#iletisim', '.site-nav__bar .nav-cta'], ['iletisim', '/iletisim.html', '.contact-form .btn--solid']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + path);
  await page.waitForTimeout(1200);
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const box = await page.locator(sel).boundingBox();
  // butonun sağ altında, çekim alanı içinde (kenardan ~30 px dışarıda)
  await page.mouse.move(box.x + box.width + 30, box.y + box.height + 20, { steps: 8 });
  await page.waitForTimeout(500);
  const near = await tr(page, sel);
  await page.screenshot({ path: `${out}/${name}-yakin.png`, clip: { x: Math.max(0, box.x - 120), y: Math.max(0, box.y - 80), width: box.width + 240, height: box.height + 160 } });
  // çok uzağa çek → yay ile dönüş; taşmayı yakalamak için kısa aralıklarla örnekle
  await page.mouse.move(20, 450);
  const samples = [];
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(40); samples.push(await tr(page, sel)); }
  await page.waitForTimeout(800);
  report[name] = { near, returnSamples: samples, rest: await tr(page, sel), errors };
  await ctx.close();
}

// dokunmatik: etki kapalı olmalı
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(base + '/iletisim.html');
await mp.waitForTimeout(800);
report.mobil = { magneticCount: await mp.evaluate(() => document.querySelectorAll('.is-magnetic').length) };
await m.close();
await browser.close();
console.log(JSON.stringify(report, null, 1));
