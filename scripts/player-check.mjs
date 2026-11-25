// Ruh Haline Göre Plak Çalar için kanıt → docs/player-check/
// Plak döner mi, sekmeye tıklanınca vurgu/hızlanma/iframe değişimi olur mu, EN metinleri, mobilde dikey
// hizalama ve taşma, konsol hataları (ana sayfanın kendi hataları; Spotify çerçevesinin iç kayıtları ayrı tutulur).
// Ayrıca hakkimda.html'deki "Galeri: Takılarım" bağlantısının Takı filtresiyle açıldığını denetler.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/player-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};
const angle = (page) => page.evaluate(() => { const m = new DOMMatrix(getComputedStyle(document.querySelector('.vinyl__disc')).transform); return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI); });

for (const s of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [], frameLogs = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url || '';
    (url.includes('localhost') ? errors : frameLogs).push(m.text().slice(0, 120));
  });
  await page.goto(`${base}/index.html`);
  await page.waitForTimeout(1200);
  await page.evaluate(() => HE.scrollTo('[data-player]', { immediate: true, offset: -90 }));
  await page.waitForTimeout(3500);   // Spotify çerçevesi yüklensin
  const a0 = await angle(page); await page.waitForTimeout(1000); const a1 = await angle(page);
  await page.screenshot({ path: `${out}/${s.n}-plak-calar.png` });

  const before = await page.evaluate(() => HE.moodPlayer.src());
  await page.click('[data-playlist="violin"]');
  await page.waitForTimeout(150);
  const during = await page.evaluate(() => ({
    boost: document.querySelector('[data-vinyl]').classList.contains('is-boost'),
    loading: document.querySelector('[data-player-embed]').classList.contains('is-loading'),
    pressed: [...document.querySelectorAll('[data-playlist]')].map((t) => t.getAttribute('aria-pressed'))
  }));
  await page.waitForTimeout(3500);
  const after = await page.evaluate(() => ({ current: HE.moodPlayer.current(), src: HE.moodPlayer.src(), now: document.querySelector('[data-player-now]').textContent,
    loading: document.querySelector('[data-player-embed]').classList.contains('is-loading') }));
  await page.screenshot({ path: `${out}/${s.n}-keman-secili.png` });

  await page.evaluate(() => document.querySelector('[data-set-lang="en"]').click());
  await page.waitForTimeout(500);
  const en = await page.evaluate(() => ({ now: document.querySelector('[data-player-now]').textContent, title: document.querySelector('[data-player-frame]').title,
    tabs: [...document.querySelectorAll('.mood-tab')].map((t) => t.innerText.trim()) }));
  await page.screenshot({ path: `${out}/${s.n}-en.png` });
  await page.evaluate(() => document.querySelector('[data-set-lang="tr"]').click());

  const layout = await page.evaluate(() => {
    const p = document.querySelector('[data-player]').getBoundingClientRect();
    const tabs = [...document.querySelectorAll('.mood-tab')].map((t) => Math.round(t.getBoundingClientRect().top));
    return { left: Math.round(p.left), right: Math.round(innerWidth - p.right), stackedTabs: new Set(tabs).size === tabs.length };
  });

  // Hakkımda → Galeri: Takılarım
  await page.goto(`${base}/hakkimda.html`);
  await page.waitForTimeout(800);
  const link = await page.evaluate(() => { const a = [...document.querySelectorAll('.tl-card__links a')].find((x) => x.getAttribute('href').startsWith('galeri.html')); return a && { href: a.getAttribute('href'), text: a.innerText.trim() }; });
  await page.goto(`${base}/galeri.html#filtre-taki`);
  await page.waitForTimeout(1200);
  const gallery = await page.evaluate(() => ({ pressed: document.querySelector('[data-filter="taki"]').getAttribute('aria-pressed'), shown: [...document.querySelectorAll('.gallery > li')].filter((l) => !l.hidden).map((l) => l.dataset.category) }));

  report[s.n] = { spinDegIn1s: ((a1 - a0) + 360) % 360, changed: before !== after.src, during, after, en, layout, link, gallery,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), errors, spotifyFrameLogs: frameLogs.length };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
