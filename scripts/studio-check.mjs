// Mini Takı Atölyesi + imleç modu düğmesi için kanıt → docs/studio-check/
// 1) Taşlara tıklayınca boncuklar sırayla boyanır, 8. tıklamada başa döner, mesaj değişir, Sıfırla temizler, EN çalışır.
// 2) İmleç düğmesi Çiçek → Yıldız Tozu → Müzik arasında döner; seçim localStorage ile başka sayfada da sürer.
// 1440×900 ve 390×844; yatay taşma ve konsol hataları da denetlenir.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/studio-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};

for (const s of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: s.m, hasTouch: s.m });
  await ctx.addInitScript(() => { sessionStorage.setItem('he-valley', '1'); });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // yalnız sitenin kendi hataları (Spotify çerçevesinin dış kaynak kayıtları hariç)
  page.on('console', (m) => { if (m.type() === 'error' && (m.location()?.url || '').includes('localhost')) errors.push(m.text()); });
  await page.goto(`${base}/index.html`);
  await page.evaluate(() => localStorage.removeItem('he-cursor'));
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(() => HE.scrollTo('[data-studio]', { immediate: true, offset: -100 }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${s.n}-atolye-bos.png` });

  // 1. atölye
  const msgs = [];
  const seq = ['gold', 'gold', 'lavender', 'turquoise', 'pearl', 'rose', 'lavender', 'turquoise'];
  for (const c of seq) {
    await page.evaluate((cc) => document.querySelector(`[data-stone="${cc}"]`).click(), c);
    await page.waitForTimeout(260);
    msgs.push(await page.evaluate(() => HE.studio.message()));
  }
  await page.waitForTimeout(700);
  const after8 = await page.evaluate(() => ({ colors: HE.studio.colors(), next: HE.studio.next(), label: document.querySelector('[data-studio-bracelet]').getAttribute('aria-label') }));
  const card = await page.locator('[data-studio]').boundingBox();
  await page.screenshot({ path: `${out}/${s.n}-atolye-dolu.png`, clip: { x: 0, y: Math.max(0, card.y - 30), width: s.w, height: Math.min(s.h - Math.max(0, card.y - 30), card.height + 60) } });
  // boncuk büyüme animasyonu tetikleniyor mu
  await page.evaluate(() => document.querySelector('[data-stone="rose"]').click());
  await page.waitForTimeout(120);
  const popScale = await page.evaluate(() => getComputedStyle(document.querySelector('[data-bead="1"] .bead__body')).transform);
  // EN
  await page.evaluate(() => document.querySelector('[data-set-lang="en"]').click());
  await page.waitForTimeout(500);
  const en = await page.evaluate(() => ({ msg: HE.studio.message(), title: document.querySelector('.studio__title').innerText.trim(), cursor: document.querySelector('.cursor-mode').innerText.trim() }));
  await page.screenshot({ path: `${out}/${s.n}-atolye-en.png`, clip: { x: 0, y: Math.max(0, card.y - 30), width: s.w, height: Math.min(s.h - Math.max(0, card.y - 30), card.height + 60) } });
  await page.evaluate(() => document.querySelector('[data-set-lang="tr"]').click());
  // sıfırla
  await page.evaluate(() => document.querySelector('[data-studio-reset]').click());
  await page.waitForTimeout(500);
  const afterReset = await page.evaluate(() => ({ colors: HE.studio.colors().filter(Boolean).length, next: HE.studio.next(), msg: HE.studio.message() }));

  // 2. imleç modu düğmesi
  const modes = [await page.evaluate(() => [HE.cursorLights.mode(), document.querySelector('.cursor-mode').innerText.trim()])];
  for (let i = 0; i < 3; i++) {
    await page.click('.cursor-mode');
    await page.waitForTimeout(150);
    modes.push(await page.evaluate(() => [HE.cursorLights.mode(), document.querySelector('.cursor-mode').innerText.trim()]));
  }
  // her mod için imleç izi görüntüsü (masaüstü)
  if (!s.m) {
    for (const m of ['flowers', 'stardust', 'notes']) {
      await page.evaluate((mm) => HE.cursorLights.setMode(mm), m);
      await page.evaluate(() => HE.scrollTo('#hakkimda', { immediate: true }));
      await page.waitForTimeout(400);
      await page.mouse.move(300, 450);
      for (let i = 0; i <= 30; i++) { await page.mouse.move(300 + i * 28, 450 + Math.sin(i / 4) * 140); await page.waitForTimeout(16); }
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${out}/${s.n}-imlec-${m}.png` });
    }
  }
  // tercih başka sayfada sürüyor mu
  await page.evaluate(() => HE.cursorLights.setMode('notes'));
  await page.goto(`${base}/blog.html`);
  await page.waitForTimeout(900);
  const persisted = await page.evaluate(() => [HE.cursorLights.mode(), document.querySelector('.cursor-mode').innerText.trim()]);
  const btn = await page.locator('.cursor-mode').boundingBox();
  await page.screenshot({ path: `${out}/${s.n}-blog-dugme.png` });

  report[s.n] = { msgs, after8, popScale, en, afterReset, modes, persisted,
    button: { right: Math.round(s.w - btn.x - btn.width), bottom: Math.round(s.h - btn.y - btn.height), w: Math.round(btn.width) },
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), errors };
  await page.evaluate(() => localStorage.removeItem('he-cursor'));
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
