// Visual QA: screenshots at fixed widths using the system Edge (no browser download).
// Usage: node scripts/shots.mjs <outDir> <path>[#sel] [path2 ...]   (BASE env overrides http://localhost:5500)
//   A "#id" suffix scrolls that element into view; "@full" captures the full page.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [outDir, ...targets] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5500';
const widths = (process.env.WIDTHS ?? '390,1440').split(',').map(Number);
const heights = { 375: 812, 390: 844, 768: 1024, 1024: 768, 1440: 900 };
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: heights[w] ?? 900 },
    deviceScaleFactor: 1,
    reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
    hasTouch: w < 768,
    isMobile: w < 768,
  });
  await ctx.addInitScript(() => {
    // intro yalnız ?intro=1 ile oynasın (ekran görüntüleri sayfanın kendisini göstersin)
    if (!location.search.includes('intro')) sessionStorage.setItem('he-valley', '1');
  });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${w}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${w}] ${e.message}`));
  for (const t of targets) {
    const full = t.endsWith('@full');
    const clean = t.replace('@full', '');
    const [p, sel] = clean.split('#');
    await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(600);
    if (sel) {
      await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), sel);
      await page.waitForTimeout(400);
      // trigger lazy reveals below the fold
      await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    }
    await page.waitForTimeout(Number(process.env.WAIT ?? 1800));
    if (process.env.EVAL) console.log(`[${w}] ${clean}:`, JSON.stringify(await page.evaluate(process.env.EVAL)));
    const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 || window.innerWidth > document.documentElement.clientWidth + 20);
    if (hScroll) errors.push(`[${w}] horizontal overflow on ${clean}`);
    const name = `${clean.replace(/[\/#?=&]+/g, '_').replace(/^_|_$/g, '') || 'home'}-${w}.png`;
    await page.screenshot({ path: `${outDir}/${name}`, fullPage: full });
    console.log('saved', name);
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no console errors / overflow');
