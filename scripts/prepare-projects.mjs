// Grafik Animasyon I proje görsellerini kaynak klasörden kopyalar ve web için hazırlar.
//   - Yalnız JPG/PNG alınır (PSD, PDF, video ve kaynak afişler kopyalanmaz)
//   - En uzun kenar 1600 px; her görsel için WebP + JPG yedeği (<picture> ile kullanılır)
//   - Dosya adları küçük harf, Türkçe karaktersiz
//   - Boyutlar (genişlik/yükseklik) assets/projects/grafik-animasyon/manifest.json'a yazılır;
//     data/projeler.js içindeki width/height değerleri buradan alınır (yerleşim kayması olmasın).
// Kullanım: node scripts/prepare-projects.mjs "<Grafik Animasyon kaynak klasörü>"
import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
if (!src || !existsSync(src)) { console.error('Kaynak klasör bulunamadı:', src); process.exit(1); }
const out = 'assets/projects/grafik-animasyon';

// slug → [kaynak dosya (kaynak klasöre göre), hedef ad (uzantısız)]
const MAP = {
  'history-brush': [
    ['proje1-History-Brush/proje-1-oncesi.jpg', 'oncesi'],
    ['proje1-History-Brush/proje-1-sonrasi.jpg', 'sonrasi'],
    ['proje1-History-Brush/proje1-sonrasi.jpg', 'sonrasi-yatay'],
    ['proje1-History-Brush/history-states.jpg', 'history-paneli'],
  ],
  'urun-tanitimi': [
    ['proje2-Urun-Tanitimi/proje2-oncesi.jpg', 'oncesi'],
    ['proje2-Urun-Tanitimi/proje2-sonrasi.jpg', 'sonrasi'],
  ],
  'karakalem-renklendirme': [
    ['proje3-Karakalem-Renklendirme/proje3-sonrasi.jpg', 'sonrasi'],
    ['proje3-Karakalem-Renklendirme/proje3-oncesi.png', 'oncesi-katmanlar'],
    ['proje3-Karakalem-Renklendirme/proje3-sonrasi.png', 'sonrasi-katmanlar'],
  ],
  'smart-object': [
    ['proje4-Smart-Object/proje4-sonrasi.jpg', 'sonrasi'],
    ['proje4-Smart-Object/proje4-oncesi.png', 'bos-cerceveler'],
    ['proje4-Smart-Object/proje4-ana-calisma-oncesi.png', 'ana-calisma-oncesi'],
    ['proje4-Smart-Object/proje4-ana-calisma-sonrasi.png', 'ana-calisma-sonrasi'],
    ['proje4-Smart-Object/proje4-smart-object-oncesi.png', 'smart-object-oncesi'],
    ['proje4-Smart-Object/proje4-smart-object-sonrasi.png', 'smart-object-sonrasi'],
  ],
  'image-stack': [
    ['proje5-Image-Stack/proje5.jpg', 'sonrasi'],
    ['proje5-Image-Stack/proje5-oncesi.png', 'oncesi-kirpma'],
    ['proje5-Image-Stack/proje5-sonrasi (2).png', 'stack-sonucu'],
    ['proje5-Image-Stack/proje5-sonrasi.png', 'sonrasi-ekran'],
  ],
  'web-arayuzu': [
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-sonrasi.jpg', 'sonrasi'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-eskiz.jpg', 'eskiz'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-duzen1.jpg', 'duzen-1'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-duzen2.jpg', 'duzen-2'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-duzen3.jpg', 'duzen-3'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-layer-comps.jpg', 'layer-comps'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-katman-yapisi1.jpg.png', 'katman-yapisi-1'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-katman-yapisi2.jpg.png', 'katman-yapisi-2'],
    ['proje6-Web-Sitesi-Arayuzu-Hazirlama/Claude outputs/Proje6-katman-yapisi3.jpg.png', 'katman-yapisi-3'],
  ],
};

const manifest = {};
const copied = [];
for (const [slug, files] of Object.entries(MAP)) {
  mkdirSync(join(out, slug), { recursive: true });
  manifest[slug] = {};
  for (const [from, name] of files) {
    const input = join(src, from);
    const base = sharp(input).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true });
    const meta = await base.clone().webp({ quality: 82 }).toFile(join(out, slug, `${name}.webp`));
    await base.clone().flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(out, slug, `${name}.jpg`));
    manifest[slug][name] = { w: meta.width, h: meta.height };
    copied.push(`${from}  →  ${out}/${slug}/${name}.{webp,jpg}  (${meta.width}×${meta.height})`);
  }
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(copied.join('\n'));
