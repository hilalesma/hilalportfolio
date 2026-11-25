// Galeri fotoğraflarını web için hazırlar: en uzun kenar 1600 px (küçük önizleme 800 px),
// WebP + JPG yedeği, EXIF yönüne göre döndürme. Dosya adları küçük harf, Türkçe karaktersiz.
// Kullanım: node scripts/prepare-gallery.mjs <kaynak-klasör>
// Kaynak dosya → hedef (kategori/ad) eşlemesi aşağıdaki MAP listesindedir.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
const out = 'assets/gallery';
const MAP = [
  ['5.webp', 'sanat/ataturk-silueti-cerceve'],
  ['6.jpg', 'sanat/kolaj-defteri'],
  ['7.webp', 'motor/motorla'],
  ['8.jpg', 'hobi/el-orgusu-atki'],
  ['9.jpg', 'muzik/keman'],
  ['10.jpg', 'anilar/alanya-kalesi'],
  ['11.jpg', 'spor/hokey-forma'],
  ['12.jpg', 'spor/hokey-kupa'],
  ['13.jpg', 'spor/hokey-toplu-fotograf'],
  ['14.jpg', 'taki/bileklikler'],
  ['15.jpg', 'sanat/june-ajanda'],
  ['16.jpg', 'spor/hokey-saha'],
  ['17.jpg', 'motor/skuter'],
  ['18.jpg', 'muzik/gitarlar'],
  ['19.jpg', 'sanat/ataturk-silueti-calisirken'],
  ['20.jpg', 'muzik/gitar-dersi'],
];
const manifest = {};
for (const [from, to] of MAP) {
  const dir = join(out, to.split('/')[0]);
  mkdirSync(dir, { recursive: true });
  const base = sharp(join(src, from)).rotate();
  const big = base.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true });
  const meta = await big.clone().webp({ quality: 80 }).toFile(join(out, `${to}.webp`));
  await big.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(join(out, `${to}.jpg`));
  const sm = base.clone().resize(800, 800, { fit: 'inside', withoutEnlargement: true });
  await sm.clone().webp({ quality: 78 }).toFile(join(out, `${to}-800.webp`));
  await sm.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(join(out, `${to}-800.jpg`));
  manifest[to] = { w: meta.width, h: meta.height };
  console.log(`${from} → ${out}/${to} (${meta.width}×${meta.height})`);
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
