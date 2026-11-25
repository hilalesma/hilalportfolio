// Vadinin durağan karesini üretir: assets/valley/valley-still.jpg
// Hareket azaltma açıkken, WebGL yokken ve intro oturumda zaten görüldüyse ana sayfada bu kare görünür.
// Kare, sitenin kendi Three.js sahnesinden (js/valley/) alınır; arayüz yazıları içermez.
// Kullanım: npm run serve → node scripts/valley-still.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const base = process.env.BASE ?? 'http://localhost:5500';
mkdirSync('assets/valley', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, reducedMotion: 'no-preference' });
await page.goto(`${base}/?intro=1&motion=full`);
await page.waitForFunction(() => window.HE?.valley?.state.phase === 'explore', null, { timeout: 60000 });
// yolun çiçeklerle dolu bir noktasına ilerle ve kameranın yerleşmesini bekle
await page.evaluate(() => { window.HE.valley.state.target = 0.3; });
await page.waitForTimeout(4000);
const dataUrl = await page.evaluate(() => window.HE.valley.snapshot());
await browser.close();
const png = Buffer.from(dataUrl.split(',')[1], 'base64');
await sharp(png).resize(1600, 900, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile('assets/valley/valley-still.jpg');
console.log('assets/valley/valley-still.jpg ready');
