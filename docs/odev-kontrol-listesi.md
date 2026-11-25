# Ödev kontrol listesi — Hilal Esma Gündoğdu Portfolyosu

Bu dosya `node scripts/checklist.mjs` ile otomatik üretilir; satır numaraları kaynak dosyalardan hesaplanır.
Biçim: `dosya:satır` (ilk geçtiği yer).

| Gereksinim / etiket | Nerede |
|---|---|
| Ayrı HTML sayfaları (6) | `index.html`, `hakkimda.html`, `projeler.html`, `blog.html`, `galeri.html`, `iletisim.html` |
| Blog yazıları | `blog.html` içinde 3 `<article class="post-entry">` (eski tek sayfalık yazı `_arsiv/blog-kaldirilan/blog/`) |
| Ortak header (aktif sayfa `aria-current="page"`) | `index.html:203`, `hakkimda.html:205`, `projeler.html:300`, `blog.html:221`, `galeri.html:296`, `iletisim.html:185` |
| Ortak footer | `index.html:685`, `hakkimda.html:871`, `projeler.html:444`, `blog.html:818`, `galeri.html:613`, `iletisim.html:338` |
| Dil değiştirici (TR | EN) | `index.html:222`, `hakkimda.html:215`, `projeler.html:309`, `blog.html:229`, `galeri.html:303`, `iletisim.html:191` |
| GSAP / Lenis yerel (`vendor/`) | `index.html:734`, `hakkimda.html:920`, `projeler.html:493`, `blog.html:867`, `galeri.html:662`, `iletisim.html:387` |
| `<abbr title>` | `hakkimda.html:373` |
| `<code>` | `hakkimda.html:653` |
| `<pre><code>` | `hakkimda.html:653` |
| `<blockquote cite>` | `hakkimda.html:663` |
| `<time datetime>` | `hakkimda.html:369`, `blog.html:328` |
| `<figure>` / `<figcaption>` | `hakkimda.html:346`, `blog.html:399`, `galeri.html:403` |
| `<dl>` | `hakkimda.html:301` |
| `<ol>` (iş deneyimi `<ol reversed>`) | `hakkimda.html:424` |
| `<ol>` (yetenekler, büyükten küçüğe) | `hakkimda.html:549` |
| `<ul>` (ilgi alanları) | `hakkimda.html:639` |
| `<table>` ders programı | `hakkimda.html:700` |
| `<caption>` | `hakkimda.html:701` |
| `<th scope="col">` günler | `hakkimda.html:707` |
| `<th scope="row">` saatler | `hakkimda.html:717` |
| `rowspan` (ardışık aynı ders + derslik) | `hakkimda.html:719` |
| `colspan="5"` öğle arası | `hakkimda.html:770` |
| Ders → projeler bağlantısı | `hakkimda.html:733` |
| Renk lejantı | `hakkimda.html:853` |
| `<details>` / `<summary>` (IT görevleri) | `hakkimda.html:461` |
| Yetenek çubukları `<meter>` | `hakkimda.html:553` |
| CEFR seviye göstergesi | `hakkimda.html:623` |
| "Bölüm Birincisi" rozeti (SVG madalya) | `hakkimda.html:390`, `index.html:345` |
| `<address>` | `iletisim.html:270` |
| Telefon `tel:` bağlantısı | `iletisim.html:282` |
| E-posta kopyalama butonu | `iletisim.html:286` |
| Google Maps "Haritada aç" | `iletisim.html:277` |
| Form: `<label>`, `required`, `type="email"`/`"tel"` | `iletisim.html:312` |
| Alan yanında hata mesajı | `iletisim.html:303` |
| Galeri filtresi (Motor dahil) | `galeri.html:376` |
| Klasör rafı (projeler; veriler data/projeler.js) | `projeler.html:388` |
| Proje ayrıntısı: rol="dialog", ilerleme çubuğu, önceki/sonraki | `projeler.html:422` |
| Grup göstergesi (Web / Grafik Animasyon I) | `projeler.html:375` |
| Gece çiçek vadisi intro (Three.js, `js/valley/`) | `index.html:277` |
| Vadi: yükleyici, "Atla", ses düğmesi | `index.html:281` |
| Hikâye akışı: büyük Hakkımda metni (`data-lines`) | `index.html:318` |
| Hikâye akışı: klasör destesi | `index.html:399` |
| Hikâye akışı: dev e-posta (kopyalanır) | `index.html:660` |
| İmleç ışıkları (yalnız ana sayfa) | `index.html:752`, `hakkimda.html:931`, `projeler.html:504`, `blog.html:878`, `galeri.html:673`, `iletisim.html:398` |
| Kişi JSON-LD | `index.html:31`, `hakkimda.html:31` |
| Open Graph | `index.html:21` |

## Doğrulama
- HTML: `npm run validate` (html-validate) — tüm sayfalar temiz.
- Bağlantılar: `npm run links` — kırık bağlantı yok.
- Erişilebilirlik / klavye: `node scripts/qa.mjs`.
- Vadi intro'su: `npm run intro-check` → `docs/intro-check/` (0–6 sn kareleri, video, dağılma, ses, hareket azaltma).
- İmleç ışıkları ve sayfa geçişi: `npm run cursor-check` → `docs/cursor-check/`.
- Projeler klasörleri: `npm run projects-check` → `docs/projects-check/`; scroll kanıtı: `npm run scroll-check` → `docs/scroll-check/`.
