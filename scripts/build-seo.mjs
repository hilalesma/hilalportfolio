// SEO + GEO dosyalarını ve etiketlerini üretir (her sayfa için ayrı):
//  - Her sayfanın <head> içinde <!-- seo:start --> … <!-- seo:end --> arasına: Open Graph / Twitter etiketleri,
//    dil bilgisi (og:locale), sayfaya özel JSON-LD (schema.org) ve — alan adı biliniyorsa — canonical.
//  - robots.txt (her zaman), llms.txt (yapay zekâ arama motorları için site özeti, GEO),
//    sitemap.xml (yalnız alan adı biliniyorsa: sitemap mutlak adres ister).
// Alan adı: SITE_URL ortam değişkeni. Örn:
//   $env:SITE_URL = "https://ornek.com"; node scripts/build-seo.mjs
// Kişisel bilgiler CONTENT.md ile aynıdır; burada yeni bilgi uydurulmaz.
// (E-posta yapılandırılmış veriye eklenmez; sayfalarda görünür durumdadır.)
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import vm from 'node:vm';

const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');   // [[TODO: yayın alan adı]]
const abs = (p) => (SITE_URL ? `${SITE_URL}/${p}` : p);
const NAME = 'Hilal Esma Gündoğdu';
const OG_IMAGE = 'assets/og.jpg';
const TODAY = '2026-11-25';

/* ---------- Ortak kişi bilgisi (CONTENT.md) ---------- */
const PERSON = {
  '@type': 'Person',
  '@id': abs('index.html') + '#person',
  name: NAME,
  image: abs('assets/photos/hilal-esma-portrait.jpg'),
  jobTitle: 'Bilgisayar Programcılığı öğrencisi',
  description: 'Akdeniz Üniversitesi Bilgisayar Programcılığı öğrencisi; web tasarımı, WordPress ve Photoshop ile çalışıyor.',
  telephone: '+905372018566',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Alanya', addressRegion: 'Antalya', addressCountry: 'TR'
  },
  alumniOf: { '@type': 'EducationalOrganization', name: 'Okurcalar Çok Programlı Anadolu Lisesi' },
  affiliation: { '@type': 'CollegeOrUniversity', name: 'Akdeniz Üniversitesi' },
  knowsLanguage: ['tr', 'en', 'nl'],
  knowsAbout: ['WordPress', 'Python', 'HTML', 'Adobe Photoshop', 'Web tasarımı', 'Ağ ve Wi-Fi yönetimi', 'Yapısal kablolama', 'CCTV', 'Ön muhasebe'],
  sameAs: ['https://github.com/hilalesma', 'https://myjewelryworlld.wordpress.com/', 'https://zanemoda.wordpress.com/']
};
const PERSON_REF = { '@id': PERSON['@id'] };

/* ---------- Projeler: data/projeler.js'ten okunur ---------- */
const sandbox = { window: {} };
vm.runInNewContext(readFileSync('data/projeler.js', 'utf8'), sandbox);
const PROJECTS = sandbox.window.HE_PROJECTS.PROJELER;

/* ---------- Galeri: galeri.html'deki görseller ---------- */
const galeri = readFileSync('galeri.html', 'utf8');
const PHOTOS = [...galeri.matchAll(/<img src="(assets\/gallery\/[^"]+)"[^>]*?alt="([^"]*)"/g)].map((m) => ({ src: m[1], alt: m[2] }));

/* ---------- Blog yazıları (blog.html) ---------- */
const POSTS = [
  { id: 'layer-comps-960-grid', title: "Adobe Photoshop'ta Layer Comps ve 960 Grid Sistemiyle Web Arayüzü Tasarlamak",
    titleEn: 'Designing a Web Interface in Adobe Photoshop with Layer Comps and the 960 Grid System',
    image: 'assets/projects/grafik-animasyon/web-arayuzu/sonrasi.jpg', keywords: ['Photoshop', '960 Grid', 'Layer Comps', 'UI/UX'], section: 'Web Tasarım & UI' },
  { id: 'karakalemden-dijitale', title: 'Karakalem Çizimden Dijital İllüstrasyona: Photoshop Katman Modları ve Burn/Dodge Teknikleri',
    titleEn: 'From Pencil Drawing to Digital Illustration: Photoshop Blend Modes and Burn/Dodge Techniques',
    image: 'assets/projects/grafik-animasyon/karakalem-renklendirme/sonrasi.jpg', keywords: ['Photoshop', 'Multiply', 'Burn / Dodge', 'Dijital boyama'], section: 'Grafik Tasarım & Dijital Boyama' },
  { id: 'iki-wordpress-sitesi', title: 'Sıfırdan İki Farklı WordPress Sitesi Kurma Deneyimim: E-Ticaret ve İçerik Odaklı Yaklaşımlar',
    titleEn: 'My Experience Building Two Different WordPress Sites from Scratch: Shop-Window and Content-Focused Approaches',
    image: 'assets/projects/web/taki-sitesi/masaustu.jpg', keywords: ['WordPress', 'CMS', 'Responsive', 'UI/UX'], section: 'Web Geliştirme & CMS' }
];

/* ---------- Sayfalar ---------- */
const PAGES = [
  { file: 'index.html', type: 'website', title: `${NAME} — Kişisel Portfolyo`,
    desc: `Akdeniz Üniversitesi Bilgisayar Programcılığı öğrencisi ${NAME}'nun kişisel portfolyosu: hakkımda, projeler, blog, galeri ve iletişim.`,
    ld: () => [
      { '@type': 'WebSite', '@id': abs('index.html') + '#website', name: `${NAME} — Kişisel Portfolyo`, url: abs('index.html'),
        inLanguage: ['tr', 'en'], author: PERSON_REF, publisher: PERSON_REF },
      PERSON
    ] },
  { file: 'hakkimda.html', type: 'profile', title: `Hakkımda — ${NAME}`,
    desc: `${NAME}: Akdeniz Üniversitesi Bilgisayar Programcılığı öğrencisi. Özgeçmiş, eğitim, iş deneyimi, yetenekler, diller ve ders programı.`,
    ld: () => [{ '@type': 'ProfilePage', name: `Hakkımda — ${NAME}`, url: abs('hakkimda.html'), inLanguage: ['tr', 'en'], mainEntity: PERSON }] },
  { file: 'projeler.html', type: 'website', title: `Projeler — ${NAME}`,
    desc: `${NAME}'nun projeleri: Grafik Animasyon I (Photoshop) dersindeki altı çalışma ve iki WordPress web sitesi.`,
    ld: () => [{ '@type': 'CollectionPage', name: `Projeler — ${NAME}`, url: abs('projeler.html'), inLanguage: ['tr', 'en'], author: PERSON_REF,
      mainEntity: { '@type': 'ItemList', numberOfItems: PROJECTS.length, itemListElement: PROJECTS.map((p, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'CreativeWork', name: p.baslik.tr, alternateName: p.baslik.en, description: p.kisa.tr, url: abs('projeler.html#' + p.slug),
          image: abs(p.kapak.src + '.jpg'), creator: PERSON_REF, keywords: p.araclar.join(', '),
          ...(p.baglanti && /^https?:/.test(p.baglanti) ? { sameAs: p.baglanti } : {}) }
      })) } }] },
  { file: 'blog.html', type: 'website', title: `Blog — ${NAME}`,
    desc: `${NAME}'nun blogu: Photoshop'ta web arayüzü, karakalemden dijital illüstrasyon ve iki WordPress sitesi üzerine adım adım yazılar.`,
    ld: () => [{ '@type': 'Blog', name: `Blog notlarım — ${NAME}`, url: abs('blog.html'), inLanguage: ['tr', 'en'], author: PERSON_REF,
      blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, alternativeHeadline: p.titleEn, url: abs('blog.html#' + p.id),
        datePublished: TODAY, dateModified: TODAY, author: PERSON_REF, image: abs(p.image), keywords: p.keywords.join(', '),
        articleSection: p.section, inLanguage: ['tr', 'en'] })) }] },
  { file: 'galeri.html', type: 'website', title: `Galeri — ${NAME}`,
    desc: `${NAME}'yu en çok yansıtan fotoğraflar: çim hokeyi, sanat, müzik, motor, takı, el işi ve anılar.`,
    ld: () => [{ '@type': 'ImageGallery', name: `Galeri — ${NAME}`, url: abs('galeri.html'), inLanguage: ['tr', 'en'], author: PERSON_REF,
      associatedMedia: PHOTOS.map((ph) => ({ '@type': 'ImageObject', contentUrl: abs(ph.src), caption: ph.alt, creator: PERSON_REF })) }] },
  { file: 'iletisim.html', type: 'website', title: `İletişim — ${NAME}`,
    desc: `${NAME} ile iletişim: adres, telefon, e-posta, GitHub ve iletişim formu.`,
    ld: () => [{ '@type': 'ContactPage', name: `İletişim — ${NAME}`, url: abs('iletisim.html'), inLanguage: ['tr', 'en'],
      mainEntity: { ...PERSON_REF, '@type': 'Person', name: NAME, address: PERSON.address,
        contactPoint: { '@type': 'ContactPoint', contactType: 'personal', telephone: '+905372018566', availableLanguage: ['Turkish', 'English'] } } }] }
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const pg of PAGES) {
  let html = readFileSync(pg.file, 'utf8');
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  // önceki üretim ve eski elle yazılmış og:* etiketleri / JSON-LD blokları kaldırılır
  html = html.replace(/[ \t]*<!-- seo:start[\s\S]*?<!-- seo:end -->\r?\n?/, '');
  html = html.replace(/^[ \t]*<meta property="og:[^>]*>\r?\n/gm, '');
  html = html.replace(/^[ \t]*<!-- Arama motorları için kişi bilgisi[^\n]*\r?\n/gm, '');
  html = html.replace(/^[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\r?\n/gm, '');

  const graph = { '@context': 'https://schema.org', '@graph': pg.ld() };
  const json = JSON.stringify(graph, null, 2).split('\n').map((l) => '    ' + l).join(nl);
  const lines = [
    '  <!-- seo:start — scripts/build-seo.mjs üretir; elle düzenleme -->',
    ...(SITE_URL ? [`  <link rel="canonical" href="${abs(pg.file)}">`] : []),
    `  <meta property="og:site_name" content="${esc(NAME)}">`,
    `  <meta property="og:title" content="${esc(pg.title)}">`,
    `  <meta property="og:description" content="${esc(pg.desc)}">`,
    `  <meta property="og:type" content="${pg.type}">`,
    ...(SITE_URL ? [`  <meta property="og:url" content="${abs(pg.file)}">`] : []),
    `  <meta property="og:image" content="${abs(OG_IMAGE)}">`,
    '  <meta property="og:locale" content="tr_TR">',
    '  <meta property="og:locale:alternate" content="en_US">',
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <meta name="twitter:title" content="${esc(pg.title)}">`,
    `  <meta name="twitter:description" content="${esc(pg.desc)}">`,
    '  <!-- Yapılandırılmış veri (schema.org JSON-LD): arama motorları ve yapay zekâ yanıt motorları için (SEO + GEO) -->',
    '  <script type="application/ld+json">',
    json,
    '  </script>',
    '  <!-- seo:end -->'
  ].join(nl);
  html = html.replace(/<\/head>/, lines + nl + '</head>');
  writeFileSync(pg.file, html);
}

/* ---------- robots.txt ---------- */
writeFileSync('robots.txt', [
  '# Hilal Esma Gündoğdu — kişisel portfolyo',
  'User-agent: *',
  'Allow: /',
  'Disallow: /_arsiv/',
  'Disallow: /docs/',
  'Disallow: /scripts/',
  'Disallow: /node_modules/',
  SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml` : '# Sitemap: alan adı belli olunca SITE_URL ile "npm run seo" çalıştırılınca eklenir',
  ''
].join('\n'));

/* ---------- sitemap.xml (yalnız alan adıyla) ---------- */
if (SITE_URL) {
  const urls = PAGES.map((p) => `  <url><loc>${abs(p.file)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n');
  writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
} else if (existsSync('sitemap.xml')) rmSync('sitemap.xml');

/* ---------- llms.txt (GEO: yapay zekâ araçları için kısa, düz metin site özeti) ---------- */
writeFileSync('llms.txt', `# ${NAME} — Kişisel Portfolyo

> Akdeniz Üniversitesi Teknik Bilimler MYO, Bilgisayar Programcılığı 1. sınıf öğrencisi ${NAME}'nun kişisel web sitesi. Site Türkçe (varsayılan) ve İngilizcedir.

## Kim
- Okurcalar Çok Programlı Anadolu Lisesi Bilişim Teknolojileri bölümünden bölüm birincisi olarak mezun oldu.
- Wome Deluxe otelinde Bilgi Teknolojileri ve Muhasebe stajı yaptı (Eylül 2025 – Haziran 2026).
- Kendi el yapımı takılarını tasarlıyor; çim hokeyi oynuyor (Alanya Stars, okul takımı kaptanı); keman ve gitar çalıyor.
- Yetenekler: WordPress, Python, HTML, Adobe Photoshop; ağ/Wi-Fi yönetimi, yapısal kablolama, CCTV, ön muhasebe.
- Diller: Türkçe, İngilizce (B1), Felemenkçe (A2).

## Sayfalar
- [Ana sayfa](${abs('index.html')}): gece çiçek vadisi girişi, Hakkımda özeti, eğitim ve başarılar, seçili projeler, fotoğraflar, blog önizlemesi, iletişim.
- [Hakkımda](${abs('hakkimda.html')}): özgeçmiş, eğitim, iş deneyimi, yetenekler (yüzdeli), diller, ilgi alanları, ders programı tablosu.
- [Projeler](${abs('projeler.html')}): Grafik Animasyon I (Photoshop) dersinin 6 projesi (History Brush, Ürün Tanıtımı, Karakalem Renklendirme, Smart Object, Image Stack, Web Arayüzü) ve 2 WordPress sitesi (My Jewelry World, ZaneModa).
- [Blog](${abs('blog.html')}): ${POSTS.map((p) => p.title).join('; ')}.
- [Galeri](${abs('galeri.html')}): spor, sanat, müzik, motor, takı, el işi ve anılar fotoğrafları.
- [İletişim](${abs('iletisim.html')}): adres (Alanya/Antalya), telefon ve iletişim formu.

## Bağlantılar
- My Jewelry World (WordPress): https://myjewelryworlld.wordpress.com/
- ZaneModa (WordPress): https://zanemoda.wordpress.com/
- GitHub: https://github.com/hilalesma
`);

console.log({ pages: PAGES.length, projects: PROJECTS.length, photos: PHOTOS.length, siteUrl: SITE_URL || '(yok: canonical/sitemap atlandı)' });
