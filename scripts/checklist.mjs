// Generates docs/odev-kontrol-listesi.md: for each assignment requirement, the page and line number
// where it is met (first occurrence per page). Line numbers are computed, so the list stays current.
// Run: node scripts/checklist.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const pages = ['index.html', 'hakkimda.html', 'projeler.html', 'blog.html', 'galeri.html', 'iletisim.html', '404.html'];
const src = Object.fromEntries(pages.map((p) => [p, readFileSync(p, 'utf8').split('\n')]));

/** First line (1-based) in page matching regex, or null. */
const line = (page, re) => {
  const i = src[page].findIndex((l) => re.test(l));
  return i === -1 ? null : i + 1;
};
const where = (re, only) =>
  (only || pages)
    .map((p) => [p, line(p, re)])
    .filter(([, n]) => n)
    .map(([p, n]) => `\`${p}:${n}\``)
    .join(', ') || '—';

const rows = [
  ['Ayrı HTML sayfaları (6)', pages.slice(0, 6).map((p) => `\`${p}\``).join(', ')],
  ['Blog yazıları', '`blog.html` içinde 3 `<article class="post-entry">` (eski tek sayfalık yazı `_arsiv/blog-kaldirilan/blog/`)'],
  ['Ortak header (aktif sayfa `aria-current="page"`)', where(/aria-current="page"/)],
  ['Ortak footer', where(/<footer class="site-footer">/)],
  ['Dil değiştirici (TR | EN)', where(/data-set-lang="en"/)],
  ['GSAP / Lenis yerel (`vendor/`)', where(/vendor\/(gsap|lenis)\.min\.js/)],
  ['`<abbr title>`', where(/<abbr title=/, ['hakkimda.html'])],
  ['`<code>`', where(/<code>/, ['hakkimda.html', 'blog.html'])],
  ['`<pre><code>`', where(/<pre><code>/, ['hakkimda.html'])],
  ['`<blockquote cite>`', where(/<blockquote cite=/, ['hakkimda.html'])],
  ['`<time datetime>`', where(/<time datetime=/, ['hakkimda.html', 'blog.html'])],
  ['`<figure>` / `<figcaption>`', where(/<figcaption/, ['hakkimda.html', 'blog.html', 'galeri.html'])],
  ['`<dl>`', where(/<dl/, ['hakkimda.html'])],
  ['`<ol>` (iş deneyimi `<ol reversed>`)', where(/<ol class="timeline timeline--split" reversed>/, ['hakkimda.html'])],
  ['`<ol>` (yetenekler, büyükten küçüğe)', where(/<ol class="skill-list">/, ['hakkimda.html'])],
  ['`<ul>` (ilgi alanları)', where(/<ul class="interests"/, ['hakkimda.html'])],
  ['`<table>` ders programı', where(/<table class="timetable">/, ['hakkimda.html'])],
  ['`<caption>`', where(/<caption/, ['hakkimda.html'])],
  ['`<th scope="col">` günler', where(/<th scope="col">/, ['hakkimda.html'])],
  ['`<th scope="row">` saatler', where(/<th scope="row">/, ['hakkimda.html'])],
  ['`rowspan` (ardışık aynı ders + derslik)', where(/rowspan="2"/, ['hakkimda.html'])],
  ['`colspan="5"` öğle arası', where(/colspan="5"/, ['hakkimda.html'])],
  ['Ders → projeler bağlantısı', where(/href="projeler\.html#grafik-animasyon"/, ['hakkimda.html'])],
  ['Renk lejantı', where(/<ul class="legend"/, ['hakkimda.html'])],
  ['`<details>` / `<summary>` (IT görevleri)', where(/<details/, ['hakkimda.html'])],
  ['Yetenek çubukları `<meter>`', where(/<meter /, ['hakkimda.html'])],
  ['CEFR seviye göstergesi', where(/class="cefr__steps"/, ['hakkimda.html'])],
  ['"Bölüm Birincisi" rozeti (SVG madalya)', where(/class="(badge|medal)"/, ['hakkimda.html', 'index.html'])],
  ['`<address>`', where(/<address>/, ['iletisim.html'])],
  ['Telefon `tel:` bağlantısı', where(/href="tel:\+905372018566"/, ['iletisim.html'])],
  ['E-posta kopyalama butonu', where(/data-copy=/, ['iletisim.html'])],
  ['Google Maps "Haritada aç"', where(/google\.com\/maps\/search/, ['iletisim.html'])],
  ['Form: `<label>`, `required`, `type="email"`/`"tel"`', where(/type="tel"/, ['iletisim.html'])],
  ['Alan yanında hata mesajı', where(/class="field__err"/, ['iletisim.html'])],
  ['Galeri filtresi (Motor dahil)', where(/data-filter="motor"/, ['galeri.html'])],
  ['Klasör rafı (projeler; veriler data/projeler.js)', where(/data-shelf-list/, ['projeler.html'])],
  ['Proje ayrıntısı: rol="dialog", ilerleme çubuğu, önceki/sonraki', where(/data-folder-view/, ['projeler.html'])],
  ['Grup göstergesi (Web / Grafik Animasyon I)', where(/class="shelf-legend"/, ['projeler.html'])],
  ['Gece çiçek vadisi intro (Three.js, `js/valley/`)', where(/id="vadi"/, ['index.html'])],
  ['Vadi: yükleyici, "Atla", ses düğmesi', where(/data-valley-(loader|skip|sound)/, ['index.html'])],
  ['Hikâye akışı: büyük Hakkımda metni (`data-lines`)', where(/data-lines="scrub"/, ['index.html'])],
  ['Hikâye akışı: klasör destesi', where(/data-deck/, ['index.html'])],
  ['Hikâye akışı: dev e-posta (kopyalanır)', where(/class="contact-xl__email"/, ['index.html'])],
  ['İmleç ışıkları (yalnız ana sayfa)', where(/js\/cursor-lights\.js/)],
  ['Kişi JSON-LD', where(/application\/ld\+json/, ['index.html', 'hakkimda.html'])],
  ['Open Graph', where(/property="og:title"/, ['index.html'])],
];

const md = `# Ödev kontrol listesi — Hilal Esma Gündoğdu Portfolyosu

Bu dosya \`node scripts/checklist.mjs\` ile otomatik üretilir; satır numaraları kaynak dosyalardan hesaplanır.
Biçim: \`dosya:satır\` (ilk geçtiği yer).

| Gereksinim / etiket | Nerede |
|---|---|
${rows.map(([a, b]) => `| ${a} | ${b} |`).join('\n')}

## Doğrulama
- HTML: \`npm run validate\` (html-validate) — tüm sayfalar temiz.
- Bağlantılar: \`npm run links\` — kırık bağlantı yok.
- Erişilebilirlik / klavye: \`node scripts/qa.mjs\`.
- Vadi intro'su: \`npm run intro-check\` → \`docs/intro-check/\` (0–6 sn kareleri, video, dağılma, ses, hareket azaltma).
- İmleç ışıkları ve sayfa geçişi: \`npm run cursor-check\` → \`docs/cursor-check/\`.
- Projeler klasörleri: \`npm run projects-check\` → \`docs/projects-check/\`; scroll kanıtı: \`npm run scroll-check\` → \`docs/scroll-check/\`.
`;
writeFileSync('docs/odev-kontrol-listesi.md', md);
console.log('docs/odev-kontrol-listesi.md written,', rows.length, 'rows;', rows.filter((r) => r[1] === '—').length, 'missing');
