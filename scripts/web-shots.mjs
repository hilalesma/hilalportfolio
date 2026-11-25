// WordPress sitelerinin ekran görüntülerini alır → assets/projects/web/<slug>/ (WebP + JPG)
// Masaüstü (1440×900) ilk ekran + tam sayfa üst kısmı ve mobil (390×844) ilk ekran.
// Kullanım: node scripts/web-shots.mjs
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const SITES = [
  ['taki-sitesi', 'https://myjewelryworlld.wordpress.com/'],
  ['zanemoda', 'https://zanemoda.wordpress.com/'],
];
const manifestPath = 'assets/projects/web/manifest.json';
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function save(buf, slug, name, maxW) {
  const dir = `assets/projects/web/${slug}`;
  mkdirSync(dir, { recursive: true });
  const img = sharp(buf).resize(maxW, 1600, { fit: 'inside', withoutEnlargement: true });
  const m = await img.clone().webp({ quality: 80 }).toFile(`${dir}/${name}.webp`);
  await img.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${dir}/${name}.jpg`);
  manifest[slug] = manifest[slug] || {};
  manifest[slug][name] = { w: m.width, h: m.height };
  console.log(`${dir}/${name} ${m.width}×${m.height}`);
}

for (const [slug, url] of SITES) {
  for (const [vp, name] of [[{ width: 1440, height: 900 }, 'masaustu'], [{ width: 390, height: 844 }, 'mobil']]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 600, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
    // WordPress.com çerez / alt bilgi çubuklarını gizle (yalnız ekran görüntüsü için)
    await page.addStyleTag({ content: 'html,body{margin-top:0!important;padding-top:0!important}#marketingbar,.marketing-bar,#wpadminbar,.widget_eu_cookie_law_widget,#cmp-app-container,.cmp-root,#actionbar,.actnbr-pub-actions{display:none!important}' }).catch(() => {});
    const first = await page.screenshot();
    await save(first, slug, name, name === 'mobil' ? 390 : 1600);
    if (name === 'masaustu') {
      const full = await page.screenshot({ fullPage: true });
      const meta = await sharp(full).metadata();
      const cropped = await sharp(full).extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, 2600) }).toBuffer();
      await save(cropped, slug, 'uzun', 1000);
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
