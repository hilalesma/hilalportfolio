// galeri.html içindeki fotoğraf listesini ve filtre düğmelerini aşağıdaki PHOTOS listesinden üretir.
// İşaretler arasına yazar: <!-- gallery:start --> … <!-- gallery:end --> ve <!-- filters:start --> … <!-- filters:end -->
// Yeni fotoğraf: önce node scripts/prepare-gallery.mjs ile hazırla, sonra buraya bir satır ekleyip
// node scripts/build-gallery.mjs çalıştır.
import { readFileSync, writeFileSync } from 'node:fs';

const M = JSON.parse(readFileSync('assets/gallery/manifest.json', 'utf8'));

const CATS = [
  ['spor', { tr: 'Spor', en: 'Sport' }, 'i-hockey'],
  ['sanat', { tr: 'Sanat', en: 'Art' }, 'i-palette'],
  ['muzik', { tr: 'Müzik', en: 'Music' }, 'i-guitar'],
  ['motor', { tr: 'Motor', en: 'Motorbike' }, 'i-motorbike'],
  ['taki', { tr: 'Takı', en: 'Jewellery' }, 'i-gem'],
  ['hobi', { tr: 'El işi', en: 'Crafts' }, 'i-sparkles'],
  ['anilar', { tr: 'Anılar', en: 'Moments' }, 'i-map-pin'],
];

// [dosya, alt TR, alt EN, kısa açıklama TR, kısa açıklama EN]
const PHOTOS = [
  ['spor/hokey-forma', 'Alanya Stars formasıyla, 11 numara, hokey sahasında; okul takımının kaptanıydım', 'In the Alanya Stars jersey, number 11, on the hockey pitch; I was the school team captain', 'Alanya Stars · 11 numara · Okul takımı kaptanı', 'Alanya Stars · number 11 · School team captain'],
  ['sanat/ataturk-silueti-cerceve', 'Çerçevelenmiş siyah-beyaz Atatürk silüeti resmini tutarken', 'Holding my framed black-and-white Atatürk silhouette painting', 'Atatürk silüeti — tamamlanmış hâli', 'Atatürk silhouette — finished'],
  ['muzik/keman', 'Gözleri kapalı keman çalarken', 'Playing the violin with eyes closed', 'Keman', 'Violin'],
  ['motor/motorla', 'Siyah bir motosikletin üzerinde', 'Sitting on a black motorbike', 'Motor sürmek', 'Riding'],
  ['spor/hokey-kupa', 'Okul Sporları Hokey Genç Kızlar Antalya üçüncülük kupası', 'School Sports Hockey Girls Antalya third-place trophy', 'Okul Sporları Hokey · Genç Kızlar · Antalya 3.’sü (2025–2026)', 'School Sports Hockey · Girls · 3rd in Antalya (2025–2026)'],
  ['taki/bileklikler', 'El yapımı doğal taş ve boncuk bileklikler', 'Handmade natural stone and bead bracelets', 'Tasarladığım bileklikler', 'Bracelets I designed'],
  ['sanat/ataturk-silueti-calisirken', 'Atatürk silüetini fırçayla boyarken', 'Painting the Atatürk silhouette with a brush', 'Atatürk silüeti — çalışırken', 'Atatürk silhouette — in progress'],
  ['anilar/alanya-kalesi', 'Alanya manzarası önünde özçekim', 'Selfie with the view over Alanya', 'Alanya', 'Alanya'],
  ['muzik/gitarlar', 'Klasik ve elektro gitarlarım', 'My classical and electric guitars', 'Gitarlarım', 'My guitars'],
  ['spor/hokey-toplu-fotograf', 'Hokey turnuvası sonrası takımlarla toplu fotoğraf', 'Group photo with the teams after the hockey tournament', 'Turnuva sonrası', 'After the tournament'],
  ['sanat/kolaj-defteri', 'Fotoğraf ve çıkartmalarla hazırladığım kolaj defteri sayfası', 'A collage journal spread I made with photos and stickers', 'Kolaj defteri', 'Collage journal'],
  ['hobi/el-orgusu-atki', 'Kırmızı kalpli beyaz el örgüsü atkıyla çimenlerde', 'On the grass wearing a hand-knitted white scarf with red hearts', 'El örgüsü atkı', 'Hand-knitted scarf'],
  ['motor/skuter', 'Kahverengi skuter', 'A brown scooter', 'Skuterim', 'My scooter'],
  ['spor/hokey-saha', 'Hokey sopası ve topu, yukarıdan görünüm', 'Hockey stick and ball seen from above', 'Antrenman', 'Training'],
  ['sanat/june-ajanda', 'Çilek ve kirazlarla süslediğim "June" ajanda sayfası', 'A "June" journal page I decorated with strawberries and cherries', 'Ajanda sayfası', 'Journal page'],
  ['muzik/gitar-dersi', 'Sınıfta klasik gitar çalarken', 'Playing classical guitar in a classroom', 'Gitar', 'Guitar'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const items = PHOTOS.map(([f, altTr, , capTr, capEn]) => {
  const cat = f.split('/')[0];
  const { w, h } = M[f];
  const sw = Math.round((w / Math.max(w, h)) * 800), sh = Math.round((h / Math.max(w, h)) * 800);
  return `          <li data-category="${cat}">
            <figure class="photo">
              <button type="button" class="photo__frame" data-zoom="assets/gallery/${f}.webp"
                      data-caption-tr="${esc(capTr)}" data-caption-en="${esc(capEn)}">
                <picture>
                  <source srcset="assets/gallery/${f}-800.webp" type="image/webp">
                  <img src="assets/gallery/${f}-800.jpg" width="${sw}" height="${sh}" loading="lazy" decoding="async"
                       alt="${esc(altTr)}" data-i18n-attr="alt:gallery.alt.${f.replace(/[/]/g, '.')}">
                </picture>
              </button>
              <figcaption><span data-lang="tr">${esc(capTr)}</span><span data-lang="en">${esc(capEn)}</span></figcaption>
            </figure>
          </li>`;
}).join('\n');

const filters = [
  `          <button type="button" class="btn btn--small" data-filter="all" aria-pressed="true"><span data-lang="tr">Tümü</span><span data-lang="en">All</span></button>`,
  ...CATS.filter(([c]) => PHOTOS.some(([f]) => f.startsWith(c + '/'))).map(([c, n, icon]) =>
    `          <button type="button" class="btn btn--small" id="filtre-${c}" data-filter="${c}" aria-pressed="false"><svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg><span data-lang="tr">${n.tr}</span><span data-lang="en">${n.en}</span></button>`),
].join('\n');

let html = readFileSync('galeri.html', 'utf8');
const put = (name, body) => {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(\\s*<!-- ${name}:end -->)`);
  if (!re.test(html)) throw new Error('işaret yok: ' + name);
  html = html.replace(re, `$1\n${body}$2`);
};
put('filters', filters);
put('gallery', items);
writeFileSync('galeri.html', html);

// İngilizce alt metinler i18n/en.js'e (gallery.alt.*)
let en = readFileSync('i18n/en.js', 'utf8');
en = en.replace(/\n  "gallery\.alt\.[^\n]*/g, '');
const lines = PHOTOS.map(([f, , altEn]) => `\n  "gallery.alt.${f.replace(/[/]/g, '.')}": ${JSON.stringify(altEn)},`).join('');
en = en.replace(/("gallery\.[^"]*": [^\n]*,)(?![\s\S]*"gallery\.[^"]*": )/, `$1${lines}`);
writeFileSync('i18n/en.js', en);
console.log(PHOTOS.length, 'fotoğraf yazıldı');
