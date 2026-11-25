// Başlık maskesi + shimmer, cam kart tilt + spotlight, dönen mühür ve gece perdesi için kanıt
// → docs/effects-check/  (1440×900 masaüstü; 390×844 dokunmatikte yerleşim görüntüleri)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/effects-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};
const ty = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s + ' .wmask__inner')].filter((w) => w.getClientRects().length).map((w) => +new DOMMatrix(getComputedStyle(w).transform).m42.toFixed(1)), sel);

async function desk() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { ctx, page, errors };
}

/* 1. Başlıklar: kelimeler maskede bekler, kaydırınca yukarı süzülür, büyük başlıkta shimmer */
{
  const { ctx, page, errors } = await desk();
  await page.goto(base + '/index.html#calismalar');
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => {
    const w = [...document.querySelectorAll('#posts-title .wmask__inner')].filter((x) => x.getClientRects().length);
    return w.map((x) => +new DOMMatrix(getComputedStyle(x).transform).m42.toFixed(1));
  });
  await page.evaluate(() => HE.scrollTo('#posts-title', { immediate: true, offset: -300 }));
  await page.waitForTimeout(500);
  const mid = await ty(page, '#posts-title');
  await page.screenshot({ path: `${out}/1440-baslik-suzulme.png` });
  await page.waitForTimeout(700);
  const shimmer = await page.evaluate(() => document.querySelector('#posts-title').classList.contains('is-shimmer'));
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/1440-baslik-shimmer.png` });
  await page.waitForTimeout(1500);
  report.baslik = { beforeY: before, midY: mid, endY: await ty(page, '#posts-title'), shimmerSeen: shimmer, errors };
  await ctx.close();
}

/* 2. Cam kart: köşeye gelince ≤5° eğim + spotlight */
{
  const { ctx, page, errors } = await desk();
  await page.goto(base + '/hakkimda.html#yetenek-title');
  await page.waitForTimeout(1500);
  const card = page.locator('.skill-card').first();
  // kart sürekli süzüldüğü (float) için Playwright'ın "sabit" beklemesi yerine sitenin kaydırması
  await page.evaluate(() => HE.scrollTo('.skill-card', { immediate: true, offset: -120 }));
  await page.waitForTimeout(800);
  const b = await card.boundingBox();
  await page.mouse.move(b.x + b.width * 0.95, b.y + b.height * 0.08, { steps: 10 });
  await page.waitForTimeout(900);
  const t = await card.evaluate((el) => {
    const m = getComputedStyle(el).transform;
    const spot = el.querySelector('.glass-spot');
    return { transform: m, sheen: getComputedStyle(el).getPropertyValue('--sheen'), spot: !!spot, spotOpacity: spot && getComputedStyle(spot).opacity,
      tiltable: document.querySelectorAll('.is-tiltable').length };
  });
  const r = await card.boundingBox();
  await page.screenshot({ path: `${out}/1440-kart-tilt.png`, clip: { x: Math.max(0, r.x - 30), y: Math.max(0, r.y - 30), width: r.width + 60, height: Math.min(860, r.height + 60) } });
  report.kart = { ...t, errors };
  await ctx.close();
}

/* 3. Mühür: boşta yavaş, kaydırınca hızlı */
{
  const { ctx, page, errors } = await desk();
  await page.goto(base + '/iletisim.html');
  await page.waitForTimeout(1500);
  const a0 = await page.evaluate(() => HE.seal.angle()); await page.waitForTimeout(1000);
  const a1 = await page.evaluate(() => HE.seal.angle());
  await page.screenshot({ path: `${out}/1440-iletisim-muhur.png` });
  // mühür ekranda kalacak kadar az kaydır (ekrandan çıkınca dönüş durur); kaydırırken ölç
  const b0 = await page.evaluate(() => HE.seal.angle());
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 50); await page.waitForTimeout(80); }
  const b1 = await page.evaluate(() => HE.seal.angle());
  const idle = ((a1 - a0 + 360) % 360);
  const scrolling = ((b1 - b0 + 360) % 360) / 0.4;   // ≈ 5 × 80 ms
  await page.goto(base + '/index.html#iletisim');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/1440-ana-sayfa-muhur.png` });
  report.muhur = { idleDegPerSec: +idle.toFixed(1), scrollDegPerSec: +scrolling.toFixed(1), errors };
  await ctx.close();
}

/* 4. Gece perdesi: tıklayınca belirir, yeni sayfada yukarı kayarak açılır */
{
  const { ctx, page, errors } = await desk();
  await page.goto(base + '/index.html#iletisim');
  await page.waitForTimeout(1500);
  await page.click('.contact-xl__links a[href="iletisim.html"]');
  await page.waitForTimeout(380);
  const leaving = await page.evaluate(() => getComputedStyle(document.querySelector('.page-curtain')).opacity);
  await page.screenshot({ path: `${out}/1440-perde-kapaniyor.png` }).catch(() => {});
  await page.waitForURL('**/iletisim.html', { timeout: 10000 });
  const arrived = await page.evaluate(() => document.documentElement.classList.contains('pt-in'));
  await page.waitForTimeout(550);
  await page.screenshot({ path: `${out}/1440-perde-aciliyor.png` });
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({ ptIn: document.documentElement.classList.contains('pt-in'), flag: sessionStorage.getItem('he-pt') }));
  await page.screenshot({ path: `${out}/1440-perde-sonra.png` });
  report.perde = { leavingOpacity: leaving, arrivedCovered: arrived, after, errors };
  await ctx.close();
}

/* 5. Mobil: yerleşim (etkiler yalnız görsel kontrol) */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/iletisim.html');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/390-iletisim.png` });
  await page.goto(base + '/index.html#iletisim');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/390-ana-sayfa-iletisim.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  report.mobil = { overflow, tiltable: await page.evaluate(() => document.querySelectorAll('.is-tiltable').length), errors };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 1));
