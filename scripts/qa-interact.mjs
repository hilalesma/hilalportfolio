// Interaction QA (keyboard, dialogs, menu, language memory, form validation, lightbox, print view).
// Usage: node scripts/qa-interact.mjs <outDir>   (needs the dev server on :4321)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'qa-out';
mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const ok = (name, pass, info = '') => results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? `  — ${info}` : ''}`);
const errors = [];

async function ctx(width, height = 900, extra = {}) {
  const c = await browser.newContext({ viewport: { width, height }, ...extra });
  await c.addInitScript(() => sessionStorage.setItem('he-intro', '1'));
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));
  return { c, p };
}
const go = async (p, path) => {
  await p.goto(base + path, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(700);
};

/* 1. Skip link + keyboard focus ring */
{
  const { c, p } = await ctx(1440);
  await go(p, '/');
  await p.keyboard.press('Tab');
  const first = await p.evaluate(() => document.activeElement?.className);
  ok('first Tab focuses skip link', String(first).includes('skip-link'), first);
  await p.keyboard.press('Tab');
  const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  ok('focus ring visible on nav link', outline !== 'none', outline);
  await c.close();
}

/* 2. Experience detail dialog: open, Escape, focus return */
{
  const { c, p } = await ctx(1440);
  await go(p, '/#experience');
  const card = p.locator('[data-exp-open]').first();
  await card.focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  ok('experience dialog opens with Enter', await p.evaluate(() => document.querySelector('[data-exp-dialog]').open));
  await p.screenshot({ path: `${out}/dialog-1440.png` });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  ok('dialog closes with Escape', !(await p.evaluate(() => document.querySelector('[data-exp-dialog]').open)));
  ok('focus returns to card', await p.evaluate(() => document.activeElement?.hasAttribute('data-exp-open')));
  await c.close();
}

/* 3. Mobile menu: open, focus trap, Escape */
{
  const { c, p } = await ctx(375, 812, { isMobile: true, hasTouch: true });
  await go(p, '/');
  await p.click('[data-menu-open]');
  await p.waitForTimeout(500);
  ok('mobile menu opens', await p.isVisible('[data-menu]'));
  await p.screenshot({ path: `${out}/menu-375.png` });
  for (let i = 0; i < 14; i++) await p.keyboard.press('Tab');
  ok('focus trapped in menu', await p.evaluate(() => !!document.activeElement?.closest('[data-menu]')));
  await p.keyboard.press('Escape');
  ok('menu closes with Escape', !(await p.isVisible('[data-menu]')));
  await c.close();
}

/* 4. Language switch keeps the page + remembers choice */
{
  const { c, p } = await ctx(1440);
  await go(p, '/projects/zanemoda');
  await p.click('.site-nav__tools [data-lang-link="tr"]');
  await p.waitForURL('**/tr/projects/zanemoda', { timeout: 15000 }).catch(() => {});
  ok('switcher goes to same page in TR', p.url().endsWith('/tr/projects/zanemoda'), p.url());
  ok('<html lang="tr">', (await p.getAttribute('html', 'lang')) === 'tr');
  const p2 = await c.newPage();
  await p2.goto(base + '/', { waitUntil: 'load' });
  await p2.waitForTimeout(800);
  ok('remembered language redirects entry visit to /tr/', p2.url().endsWith('/tr/'), p2.url());
  await c.close();
}

/* 5. Contact form validation */
{
  const { c, p } = await ctx(1440);
  await go(p, '/#contact');
  await p.click('#contact button[type="submit"]');
  await p.waitForTimeout(300);
  const errs = await p.$$eval('.field__err', (els) => els.map((e) => e.textContent.trim()).filter(Boolean).length);
  ok('empty submit shows 3 inline errors', errs === 3, String(errs));
  ok('focus moves to first invalid field', await p.evaluate(() => document.activeElement?.id === 'cf-name'));
  await p.fill('#cf-name', 'Test');
  await p.fill('#cf-email', 'not-an-email');
  await p.fill('#cf-message', 'short');
  await p.click('#contact button[type="submit"]');
  const emailErr = await p.textContent('#cf-email-err');
  ok('invalid e-mail message', !!emailErr?.trim(), emailErr?.trim());
  await p.fill('#cf-email', 'test@example.com');
  await p.fill('#cf-message', 'Hello, this is a longer test message.');
  await p.click('#contact button[type="submit"]');
  await p.waitForTimeout(300);
  ok('valid submit reaches a channel state', !!(await p.textContent('[data-status]'))?.trim(), (await p.textContent('[data-status]'))?.trim());
  await p.screenshot({ path: `${out}/form-1440.png` });
  await c.close();
}

/* 6. Lightbox (only when photos exist) */
{
  const { c, p } = await ctx(1440);
  await go(p, '/#photos');
  const n = await p.locator('[data-lightbox-index]').count();
  if (n) {
    await p.locator('[data-lightbox-index]').first().click();
    await p.waitForTimeout(500);
    ok('lightbox opens', await p.evaluate(() => document.querySelector('[data-lightbox]').open));
    await p.keyboard.press('ArrowRight');
    ok('arrow key navigates', (await p.textContent('[data-lightbox-count]'))?.startsWith(n > 1 ? '2' : '1'));
    ok('image has alt text', !!(await p.getAttribute('[data-lightbox-img]', 'alt')));
    await p.screenshot({ path: `${out}/lightbox-1440.png` });
    await p.keyboard.press('Escape');
    ok('lightbox closes with Escape', !(await p.evaluate(() => document.querySelector('[data-lightbox]').open)));
  } else ok('lightbox (skipped: no photos yet)', true);
  await c.close();
}

/* 7. Print view */
{
  const { c, p } = await ctx(900, 1200);
  await go(p, '/');
  await p.emulateMedia({ media: 'print' });
  await p.waitForTimeout(400);
  const hidden = await p.evaluate(() => getComputedStyle(document.querySelector('.site-nav')).display === 'none');
  ok('print hides navigation', hidden);
  await p.screenshot({ path: `${out}/print-home.png`, fullPage: true });
  await c.close();
}

await browser.close();
console.log(results.join('\n'));
console.log(errors.length ? `JS errors:\n${errors.join('\n')}` : 'no JS errors');
