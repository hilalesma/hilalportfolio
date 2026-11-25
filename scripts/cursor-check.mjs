// İmleç ışıklarının kanıtı (npm run cursor-check; önce npm run serve) → docs/cursor-check/
//   1. Ana sayfada imleç bir yol boyunca hareket eder: 3 ekran görüntüsü (vadi, içerik, bağlantı üzerinde)
//   2. Başka sayfaya giden bir bağlantıya tıklanır: dağılma anının 3 karesi, sonra yeni sayfa
//   3. Diğer sayfalarda (hakkimda, projeler, blog, galeri, iletisim) aynı ışıltıların, motiflerin ve ışığın olduğu doğrulanır
//   4. Hareket azaltma açıkken ana sayfada da partikül olmadığı doğrulanır
// Sonuç: docs/cursor-check/report.json
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/cursor-check';
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (/\.(png|json)$/.test(f)) rmSync(`${out}/${f}`, { force: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = {};
const errors = [];

/** Yumuşak bir imleç yolu: (x0,y0) → (x1,y1), dalgalı */
async function sweep(page, x0, y0, x1, y1, steps = 24) {
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    await page.mouse.move(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI * 3) * 60);
    await page.waitForTimeout(16);
  }
}

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));   // intro'yu geç: durağan vadi
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/`);
  await page.waitForTimeout(1200);

  // 1a. Vadinin üstünde (koyu zemin, açık tonlar)
  await sweep(page, 200, 700, 1200, 600);
  await page.screenshot({ path: `${out}/1-vadi-iz.png` });
  const c1 = await page.evaluate(() => HE.cursorLights.count());

  // 1b. Açık içerik zemininde (koyu tonlar, daha seyrek)
  await page.evaluate(() => { HE.scrollTo('#calismalar', { immediate: true }); });
  await page.waitForTimeout(800);
  await sweep(page, 1300, 300, 300, 700);
  await page.screenshot({ path: `${out}/2-icerik-iz.png` });
  const c2 = await page.evaluate(() => HE.cursorLights.count());

  // 1c. Bağlantı üzerinde: partiküller çevresinde toplanır
  const link = page.locator('a.works__all').first();   // "Tüm projeler" → projeler.html
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await link.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/3-baglanti-uzerinde.png` });

  // 2. Tıkla → dağılma kareleri (yaklaşık 0.15 / 0.4 / 0.7 sn) → yeni sayfa
  const start = Date.now();
  await page.mouse.down();
  await page.mouse.up();
  const frames = [150, 400, 700];
  for (let i = 0; i < frames.length; i++) {
    const wait = start + frames[i] - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/4-dagilma-${i + 1}.png` });
  }
  await page.waitForURL(/projeler\.html/, { timeout: 5000 });
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(900);
  // yeni sayfanın görüntüsü yalnızca belge içindir; makine yoğunken zaman aşımı testi düşürmesin
  await page.screenshot({ path: `${out}/5-yeni-sayfa.png`, timeout: 60000 }).catch((e) => console.warn('5-yeni-sayfa alınamadı:', e.message));
  report.home = { trailVadi: c1, trailIcerik: c2, navigatedTo: new URL(page.url()).pathname };

  // 2b. Geri tuşu: ana sayfa ve partiküller geri gelir
  await page.goBack();
  await page.waitForTimeout(800);
  await sweep(page, 400, 400, 900, 500, 12);
  report.back = await page.evaluate(() => ({ canvas: !!document.querySelector('canvas.cursor-lights'), particles: HE.cursorLights.count(), veil: document.querySelector('.page-curtain').classList.contains('is-on') }));

  // 3. Diğer sayfalarda da aynı imleç ışıltıları ve arka plan katmanı (motifler + ışık) var
  report.subpages = {};
  for (const p of ['hakkimda.html', 'projeler.html', 'blog.html', 'galeri.html', 'iletisim.html']) {
    await page.goto(`${base}/${p}`);
    await page.waitForTimeout(500);
    await sweep(page, 300, 300, 900, 600, 16);
    if (p === 'hakkimda.html') await page.screenshot({ path: `${out}/7-alt-sayfa-iz.png` });
    report.subpages[p] = await page.evaluate(() => ({
      cursorCanvas: !!document.querySelector('canvas.cursor-lights'),
      particles: HE.cursorLights ? HE.cursorLights.count() : 0,
      motifs: document.querySelectorAll('.ambient__motif').length,
      glowOn: !!document.querySelector('.ambient__glow.is-on'),
    }));
  }
  await ctx.close();
}

// 4. Hareket azaltma: ana sayfada partikül yok
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await page.waitForTimeout(600);
  report.reduced = await page.evaluate(() => ({ cursorCanvas: !!document.querySelector('canvas.cursor-lights') }));
  await ctx.close();
}

// 5. Mobil: dokunarak sürükleme izi ve dokunma patlaması
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await page.waitForTimeout(800);
  await page.touchscreen.tap(195, 600);
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${out}/6-mobil-dokunma.png` });
  report.mobile = { particlesAfterTap: await page.evaluate(() => HE.cursorLights.count()), max: await page.evaluate(() => HE.cursorLights.max()) };
  await ctx.close();
}

await browser.close();
report.errors = errors;
report.ok = errors.length === 0 && report.home.trailVadi > 5 && report.home.trailIcerik > 3 &&
  report.home.navigatedTo.endsWith('projeler.html') && report.back.canvas && !report.back.veil &&
  Object.values(report.subpages).every((s) => s.cursorCanvas && s.particles > 0 && s.motifs > 0 && s.glowOn) && !report.reduced.cursorCanvas && report.mobile.particlesAfterTap > 0;
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
