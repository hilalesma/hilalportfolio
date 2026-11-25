// Blog sayfası için kanıt → docs/blog-check/
// Başlık, kart listesi ve üç yazının görünümleri (1440 ve 390), filtre, kart → yazı kaydırması,
// EN dil geçişi, görsellerin yüklenmesi, yatay taşma ve konsol hataları denetlenir.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/blog-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};

for (const s of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/blog.html`);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${s.n}-baslik.png` });
  await page.evaluate(() => HE.scrollTo('#yazilar', { immediate: true, offset: -90 }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${s.n}-liste.png` });

  const shots = [
    ['yazi1', '#layer-comps-960-grid'], ['yazi1-comps', '#layer-comps-960-grid .post-fig--trio'],
    ['yazi2', '#karakalemden-dijitale'], ['yazi2-burn', '#karakalemden-dijitale .shot-todo'],
    ['yazi3', '#iki-wordpress-sitesi'], ['yazi3-tablo', '#iki-wordpress-sitesi .compare'], ['yazi3-rozet', '#iki-wordpress-sitesi .post-entry__foot']
  ];
  for (const [name, sel] of shots) {
    await page.evaluate((q) => { const el = [...document.querySelectorAll(q)].find((e) => e.getClientRects().length); HE.scrollTo(el, { immediate: true, offset: -120 }); }, sel);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/${s.n}-${name}.png` });
  }

  // kart tıklanınca ilgili yazıya kayar
  await page.evaluate(() => HE.scrollTo('#yazilar', { immediate: true }));
  await page.waitForTimeout(600);
  await page.click('.jcards a[href="#karakalemden-dijitale"]');
  await page.waitForTimeout(1800);
  const jump = await page.evaluate(() => Math.round(document.querySelector('#karakalemden-dijitale').getBoundingClientRect().top));

  // filtre: Grafik → yalnız yazı 2 ve kartı görünür
  await page.evaluate(() => HE.scrollTo('#yazilar', { immediate: true }));
  await page.click('[data-tag="grafik"]');
  const filtered = await page.evaluate(() => ({
    cards: [...document.querySelectorAll('.jcards > li')].filter((l) => !l.hidden).length,
    posts: [...document.querySelectorAll('.post-entry')].filter((a) => !a.hidden).map((a) => a.id)
  }));
  await page.click('[data-tag=""]');

  // görseller: görünür dildeki bütün <img> yüklenebilmeli
  const imgs = await page.evaluate(async () => {
    const list = [...document.querySelectorAll('.posts-flow img, .jcards img')].filter((i) => i.getClientRects().length);
    list.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(list.map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })));
    return { count: list.length, broken: list.filter((i) => !i.naturalWidth).map((i) => i.currentSrc) };
  });

  // EN
  await page.evaluate(() => document.querySelector('[data-set-lang="en"]').click());   // menü kaydırınca gizlenir: doğrudan tıkla
  await page.waitForTimeout(600);
  await page.evaluate(() => HE.scrollTo('#iki-wordpress-sitesi', { immediate: true, offset: -120 }));
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}/${s.n}-en-yazi3.png` });
  const en = await page.evaluate(() => ({
    trVisible: [...document.querySelectorAll('[data-lang="tr"]')].some((e) => e.getClientRects().length > 0),
    title: document.querySelector('#p3-title').innerText.trim().slice(0, 40)
  }));
  await page.evaluate(() => document.querySelector('[data-set-lang="tr"]').click());

  // okuma alanları ekrana sığıyor mu (body overflow gizli olsa bile taşmayı yakala)
  const sheetsFit = await page.evaluate(() => [...document.querySelectorAll('.post-entry__sheet')].every((e) => e.getBoundingClientRect().right <= innerWidth + 1));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

  // ana sayfadaki karttan gelir gibi: blog.html#yazi ile doğrudan açılış
  await page.goto(`${base}/blog.html#iki-wordpress-sitesi`);
  await page.waitForTimeout(2500);
  const deepTop = await page.evaluate(() => Math.round(document.querySelector('#iki-wordpress-sitesi').getBoundingClientRect().top));
  await page.screenshot({ path: `${out}/${s.n}-dogrudan-yazi3.png` });

  report[s.n] = { jumpTop: jump, deepTop, filtered, imgs, en, todos: await page.evaluate(() => document.querySelectorAll('.posts-flow [data-lang="tr"] .shot-todo').length),
    sheetsFit, overflow, errors };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
