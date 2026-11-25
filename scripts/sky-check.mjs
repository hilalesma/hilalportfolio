// Arka plan ışık küreleri, yavaş göz kırpan yıldızlar ve kayan yıldız için kanıt → docs/sky-check/
// Kürelerin süzüldüğünü, kayan yıldızın sağ üstten sol alta geçtiğini ölçer; 1440 ve 390 px görüntüleri alır.
// REDUCED=1 ile hareket azaltmada her şeyin durduğu denetlenir.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/sky-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};

for (const s of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }, { n: 'reduced', w: 1440, h: 900, m: false, reduced: true }]) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m, reducedMotion: s.reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/hakkimda.html`);
  const orb = () => page.evaluate(() => [...document.querySelectorAll('.ambient-orb')].map((o) => { const m = new DOMMatrix(getComputedStyle(o).transform); return [+m.m41.toFixed(0), +m.m42.toFixed(0)]; }));
  const star = () => page.evaluate(() => { const r = document.querySelector('.ambient__shooting::after') || document.querySelector('.ambient__shooting'); const b = r.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), o: +getComputedStyle(r).opacity }; });
  const o0 = await orb();
  // kayan yıldız 3 sn gecikmeyle başlar, ~1,1 sn sürer
  await page.waitForTimeout(3250);
  const s0 = await star();
  await page.screenshot({ path: `${out}/${s.n}-kayan-yildiz.png` });
  await page.waitForTimeout(450);
  const s1 = await star();
  await page.waitForTimeout(2000);
  const o1 = await orb();
  await page.screenshot({ path: `${out}/${s.n}-arka-plan.png` });
  const slow = await page.evaluate(() => {
    const st = [...document.querySelectorAll('.ambient__star--slow')];
    return { count: st.length, opacities: st.slice(0, 6).map((e) => +(+getComputedStyle(e).opacity).toFixed(2)) };
  });
  report[s.n] = { orbsStart: o0, orbsLater: o1, shootingA: s0, shootingB: s1, slowStars: slow,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), errors };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
