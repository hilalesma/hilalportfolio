// Home page scroll journey proof: screenshots at 0, 25, 50, 75 and 100 % of the scroll height
// (1440×900 and 390×844, reducedMotion "no-preference", ?motion=full, intro skipped) → docs/scroll-check/
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/scroll-check';
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f.endsWith('.png')) rmSync(`${out}/${f}`, { force: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = [];
for (const size of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, reducedMotion: 'no-preference', isMobile: size.m, hasTouch: size.m });
  await ctx.addInitScript(() => sessionStorage.setItem('he-intro', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}/index.html?motion=full`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const pct of [0, 25, 50, 75, 100]) {
    // kaydırmayı adım adım yap: ScrollTrigger scrub ve pin doğal çalışsın
    const target = Math.round((max * pct) / 100);
    for (let k = 0; k < 6; k++) {
      await page.mouse.wheel(0, (target - (await page.evaluate(() => scrollY))) / (6 - k));
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${out}/home-${size.n}-${pct}.png` });
  }
  const state = await page.evaluate(() => ({ journey: !!document.querySelector('canvas.journey.is-ready'), overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
  report.push({ size: size.n, ...state, errors });
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
