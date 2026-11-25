// İmleç kıvılcımlarının kare kare kanıtı → docs/cursor-check/kivilcim-*.png
// Ana sayfada (vadi durağan karesi) ve hakkimda.html'de fare gerçekçi bir hızla bir yol boyunca
// hareket ettirilir: hareket sırasında, durduktan 0.4 sn ve 1.2 sn sonra kareler alınır
// (kümelenme, ataletle süzülme ve yavaş sönme görünsün diye). Hızlı ve yavaş hareket ayrı denenir.
// Kullanım: npm run serve → node scripts/sparks-check.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/cursor-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

/** Fareyi (x0,y0) → (x1,y1) arasında dalgalı bir yolda, verilen sürede hareket ettirir. */
async function path(x0, y0, x1, y1, ms, steps = 60) {
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    await page.mouse.move(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI * 2) * 90);
    await page.waitForTimeout(ms / steps);
  }
}

for (const [name, url] of [['ana', '/'], ['alt', '/hakkimda.html']]) {
  await page.goto(base + url);
  await page.waitForTimeout(1200);
  await page.mouse.move(200, 500);
  // yavaş hareket
  await path(200, 500, 700, 450, 1400);
  await page.screenshot({ path: `${out}/kivilcim-${name}-yavas.png` });
  // hızlı hareket
  await path(700, 450, 1150, 380, 450);
  await page.screenshot({ path: `${out}/kivilcim-${name}-hizli.png` });
  console.log(name, 'hareket sırasında', await page.evaluate(() => window.HE.cursorLights.count()));
  // hareket bittikten sonra kaç kıvılcımın yaşadığı (zaman çizelgesi, ekran görüntüsü gecikmesinden bağımsız)
  const decay = await page.evaluate(async () => {
    const out = [];
    const t0 = performance.now();
    for (const ms of [0, 300, 600, 1000, 1500, 2200]) {
      await new Promise((r) => setTimeout(r, ms - (performance.now() - t0)));
      out.push(`${ms}ms:${window.HE.cursorLights.count()}`);
    }
    return out.join(' ');
  });
  console.log(name, 'sönme', decay);
  await page.screenshot({ path: `${out}/kivilcim-${name}-sonra-04.png` });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/kivilcim-${name}-sonra-12.png` });
  console.log(name, 'particles', await page.evaluate(() => window.HE.cursorLights.count()), 'max', await page.evaluate(() => window.HE.cursorLights.max()));
}
await browser.close();
console.log(errors.length ? 'ERRORS ' + errors.join(' | ') : 'no errors');
