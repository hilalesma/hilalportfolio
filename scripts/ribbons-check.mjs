// Şeritler ve "oynak" fotoğraf kartları için kanıt → docs/ribbons-check/
// Şeritlerin kendiliğinden kaydığını, kaydırınca hızlandığını, hover'da yavaşladığını ölçer;
// kartların eğimini ve hover'da düzelip büyüdüğünü denetler. 1440×900 ve 390×844.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/ribbons-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};
for (const s of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/`);
  await page.waitForTimeout(1200);
  await page.evaluate(() => HE.scrollTo('.ribbons', { immediate: true, offset: -200 }));
  await page.waitForTimeout(800);
  const pos = () => page.evaluate(() => [...document.querySelectorAll('[data-ribbon-track]')].map((t) => new DOMMatrix(getComputedStyle(t).transform).m41));
  const a = await pos(); await page.waitForTimeout(1000); const b = await pos();
  const drift = b.map((v, i) => +(v - a[i]).toFixed(1));
  await page.screenshot({ path: `${out}/${s.n}-seritler.png` });
  // kaydırma ile hızlanma
  await page.mouse.wheel(0, 300); await page.waitForTimeout(150);
  const c = await pos(); await page.waitForTimeout(300); const d = await pos();
  const scrollDrift = d.map((v, i) => +(v - c[i]).toFixed(1));
  // hover'da yavaşlama (masaüstü)
  let hoverDrift = null;
  if (!s.m) {
    await page.evaluate(() => HE.scrollTo('.ribbons', { immediate: true, offset: -200 }));
    await page.waitForTimeout(1500);
    const box = await page.locator('.ribbon--lilac').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1200);
    const e = await pos(); await page.waitForTimeout(1000); const f = await pos();
    hoverDrift = +(f[0] - e[0]).toFixed(1);
  }
  // kartlar
  await page.evaluate(() => HE.scrollTo('#kareler', { immediate: true }));
  await page.waitForTimeout(900);
  const tilts = await page.evaluate(() => [...document.querySelectorAll('.frame__card--photo')].map((c) => getComputedStyle(c).transform));
  await page.screenshot({ path: `${out}/${s.n}-kartlar.png` });
  let hover = null;
  if (!s.m) {
    await page.hover('.frames__grid .frame:nth-child(2) .frame__card');
    await page.waitForTimeout(500);
    hover = await page.evaluate(() => getComputedStyle(document.querySelector('.frames__grid .frame:nth-child(2) .frame__card')).transform);
    await page.screenshot({ path: `${out}/${s.n}-kart-hover.png` });
  }
  report[s.n] = { drift, scrollDrift, hoverDrift, tilts, hover, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), errors };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
