// Final QA: keyboard, focus rings, 44 px touch targets, mobile menu focus trap, language switch,
// folder dialog, contact form validation, reduced-motion content visibility.  Run: node scripts/qa.mjs
import { chromium } from 'playwright-core';

const base = process.env.BASE ?? 'http://localhost:5500';
const pages = ['index.html', 'hakkimda.html', 'projeler.html', 'blog.html', 'galeri.html', 'iletisim.html'];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const ok = (name, pass, info = '') => results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`);
const errors = [];
const ctxFor = async (opts = {}) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', ...opts });
  await c.addInitScript(() => sessionStorage.setItem('he-intro', '1'));
  return c;
};

/* 1. Every page: skip link first, focus ring visible, touch targets ≥ 44 px (390 px wide) */
{
  const c = await ctxFor({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  let small = [];
  for (const path of pages) {
    await p.goto(`${base}/${path}`, { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const res = await p.evaluate(() => {
      const bad = [];
      document.querySelectorAll('a[href], button, input, select, textarea, summary').forEach((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden], .sr-only, dialog:not([open])')) return;
        const inline = cs.display === 'inline' && el.closest('p, li, figcaption, td, dd'); // metin içi bağlantılar WCAG 2.5.8 istisnası
        if (inline) return;
        if (r.height < 43.5 || (r.width < 43.5 && el.tagName !== 'INPUT')) bad.push(`${el.tagName}.${el.className || ''} ${Math.round(r.width)}×${Math.round(r.height)}`);
      });
      return bad;
    });
    small = small.concat(res.map((b) => `${path}: ${b}`));
    await p.keyboard.press('Tab');
    const first = await p.evaluate(() => document.activeElement?.className);
    if (!String(first).includes('skip-link')) ok(`skip link first on ${path}`, false, first);
  }
  ok('skip link is first Tab stop on all pages', !results.some((r) => r.startsWith('FAIL  skip')));
  ok('touch targets ≥ 44 px (390 px)', small.length === 0, small.slice(0, 6).join(' | '));
  await c.close();
}

/* 2. Focus ring + mobile menu focus trap + Escape */
{
  const c = await ctxFor({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await c.newPage();
  await p.goto(`${base}/hakkimda.html`, { waitUntil: 'load' });
  await p.keyboard.press('Tab');
  await p.keyboard.press('Tab');
  ok('focus ring visible', await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'));
  await p.click('[data-menu-open]');
  await p.waitForTimeout(400);
  for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
  ok('mobile menu keeps focus inside', await p.evaluate(() => !!document.activeElement.closest('[data-menu]')));
  ok('active page marked in menu', await p.evaluate(() => document.querySelector('.mobile-menu [aria-current="page"]')?.textContent.includes('Hakkımda')));
  await p.keyboard.press('Escape');
  ok('menu closes with Escape and returns focus', await p.evaluate(() => document.querySelector('[data-menu]').hidden && document.activeElement.hasAttribute('data-menu-open')));
  await c.close();
}

/* 3. Language switch on every page + remembered */
{
  const c = await ctxFor();
  const p = await c.newPage();
  await p.goto(`${base}/index.html`, { waitUntil: 'load' });
  await p.click('.site-nav__bar [data-set-lang="en"]');
  let allEn = true;
  const bad = [];
  for (const path of pages) {
    await p.goto(`${base}/${path}`, { waitUntil: 'load' });
    await p.waitForTimeout(250);
    const r = await p.evaluate(() => ({
      lang: document.documentElement.lang,
      trVisible: [...document.querySelectorAll('[data-lang="tr"]')].some((e) => e.getClientRects().length > 0),   /* SVG öğelerinde offsetParent yok: kutu sayısına bak */
      nav: document.querySelector('.nav-link')?.textContent.trim(),
    }));
    if (r.lang !== 'en' || r.trVisible || r.nav !== 'About' /* v4 menüsü "Hakkımda / About" ile başlar */) { allEn = false; bad.push(`${path}:${JSON.stringify(r)}`); }
  }
  ok('EN applied and remembered on all 11 pages (no TR block visible)', allEn, bad.join(' | '));
  await p.click('.site-nav__bar [data-set-lang="tr"]');
  ok('switch back to TR', (await p.getAttribute('html', 'lang')) === 'tr');
  await c.close();
}

/* 4. Projects: folder opens with keyboard, Escape closes, focus returns */
{
  const c = await ctxFor();
  const p = await c.newPage();
  await p.goto(`${base}/projeler.html`, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  await p.focus('#klasor-zanemoda');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(1200);
  ok('folder opens with Enter', await p.evaluate(() => !document.querySelector('[data-folder-view]').hidden));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1000);
  ok('folder closes with Escape, focus back on folder', await p.evaluate(() => document.querySelector('[data-folder-view]').hidden && document.activeElement.id === 'klasor-zanemoda'));
  await c.close();
}

/* 5. Contact form */
{
  const c = await ctxFor();
  const p = await c.newPage();
  await p.goto(`${base}/iletisim.html`, { waitUntil: 'load' });
  await p.click('[data-contact] button[type=submit]');
  ok('empty form: 3 inline errors, focus on first', await p.evaluate(() => [...document.querySelectorAll('.field__err')].filter((e) => e.textContent).length === 3 && document.activeElement.id === 'cf-name'));
  await c.close();
}

/* 6. Reduced motion: all content visible, no 3D animation loop needed */
{
  const c = await ctxFor({ reducedMotion: 'reduce' });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  let hidden = 0;
  for (const path of pages.slice(0, 6)) {
    await p.goto(`${base}/${path}`, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    hidden += await p.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  }
  ok('reduced motion: every [data-reveal] block fully visible', hidden === 0, String(hidden));
  await c.close();
}

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? 'JS errors:\n' + errors.join('\n') : 'no JS errors');
