# Hilal Esma Gündoğdu — Kişisel Dijital Portfolyo

Düz **HTML + CSS + JavaScript** ile yazılmış, iki dilli (TR / EN) statik bir portfolyo sitesi.
Animasyonlar **GSAP + ScrollTrigger**, akıcı kaydırma **Lenis**, ana sayfadaki 3D vadi **Three.js** ile yapılır; hepsi `vendor/` klasöründe yereldir (internet gerekmez).

- İçerik kaynağı: [`CONTENT.md`](CONTENT.md) · Proje kuralları: [`CLAUDE.md`](CLAUDE.md)
- Ödev kontrol listesi (etiket → sayfa:satır): [`docs/odev-kontrol-listesi.md`](docs/odev-kontrol-listesi.md)
- Eski Astro sürümü yalnızca arşivdir: `_arsiv/astro-surumu/` (siteye dahil değildir)

---

## 1. Siteyi açmak

**En kolay yol:** klasördeki `index.html` dosyasına çift tıkla. Site çalışır (proje verileri `data/projeler.js` klasik betik olarak yüklendiği için dosyadan açınca da görünür).

**Tam deneyim için yerel sunucu** (Node.js kuruluysa):

```bash
npm install          # yalnızca geliştirme/test araçları için (site bunlara ihtiyaç duymaz)
npm run serve        # http://localhost:5500
```

Alternatif: VS Code'da "Live Server" eklentisiyle `index.html`'i aç.

### Test parametreleri
| Adres | Etkisi |
|---|---|
| `index.html?motion=full` | İşletim sistemindeki "hareketi azalt" ayarını bu oturum için yok sayar |
| `?motion=auto` | Normale döner |
| `?lang=en` | Sayfayı İngilizce açar |
| `index.html?intro=1` | Vadi intro'sunu yeniden oynatır (normalde oturumda bir kez oynar) |

> Not: Windows'ta **Ayarlar › Erişilebilirlik › Görsel efektler › Animasyon efektleri** kapalıysa tarayıcı "hareketi azalt" bildirir. Bu durumda site animasyonları, 3D vadiyi, imleç ışıklarını ve sabitlenen bölümleri kapatır; içerik doğrudan görünür. Animasyonları görmek için bu ayarı aç ya da `?motion=full` kullan.

## 2. Ana sayfa: hikâye akışı

Ana sayfa tek, uzun bir hikâye sayfasıdır (Lenis ile akıcı kaydırma):

1. **Gece çiçek vadisi (intro):** siyah ekranda nabız gibi atan nokta ve yüzde sayacı, ardından kamera Three.js ile çizilen vadiye iner. Aşağı ok düğmesi yoktur: sayfayı kaydırdıkça (tekerlek, dokunma, klavye okları) kamera vadide ilerler; imleç çiçekleri iter. Yolun sonunda (ya da "Atla" ile) vadi kapanır ve akış Hakkımda'dan devam eder.
2. **Hakkımda:** büyük, birinci ağızdan metin; satırlar kaydırdıkça maskeden açılır.
3. **Eğitim ve Başarılar:** Akdeniz Üniversitesi, Bölüm Birincisi, Wome Deluxe stajı (bağlantılar `hakkimda.html`'e gider).
4. **Seçili çalışmalar:** klasör destesi; kaydırdıkça klasörler sırayla açılır.
5. **Hayatımdan kareler:** farklı hızlarda kayan (parallax) kartlar.
6. **Neler yapıyorum:** vesikalık + iki sütunlu liste.
7. **Son yazılar:** üç blog yazısı.
8. **İletişime geç:** tıklayınca kopyalanan dev e-posta adresi, telefon ve GitHub.

Üstteki menü ana sayfada bu bölümlere kaydırır, diğer sayfalarda ilgili dosyaya gider. Hakkımda'nın tam içeriği yalnızca `hakkimda.html`'dedir.

Sitenin tamamı girişteki gece vadisiyle aynı **koyu gece temasındadır** (`css/theme-night.css`, her sayfada en son yüklenir; açık temaya dönmek için yalnız bu bağlantıyı kaldırmak yeterli). Tüm sayfalarda imleci takip eden **ışık partikülleri** vardır (`js/cursor-lights.js`); başka bir sayfaya giden bağlantıya tıklanınca imlecin olduğu noktadan dağılırlar ve sayfa krem renge dönerek değişir. Açık bölümlerin arkasında sıcak bir mesh gradient, ince ızgara, kâğıt greni, kaydırdıkça süzülen silik çiçek/yıldız motifleri ve imleci izleyen yumuşak bir ışık vardır (`css/ambient.css`, `js/ambient.js`). 3D sahne yalnız ana sayfadaki vadidedir.

### Vadi intro'su: ses ve kaynaklar
- **Ses:** dosya kullanılmaz; `js/valley/audio.js` yumuşak bir pad ve rüzgâr sesini tarayıcıda Web Audio ile sentezler. Lisans gerekmez. Varsayılan olarak kapalıdır, sağ alttaki hoparlör düğmesiyle açılır.
- **3D:** arazi, çiçekler, dokular, kamera yolu ve shader'lar `js/valley/` içinde kodla üretilir; dışarıdan model veya doku yoktur.
- **Durağan kare:** `assets/valley/valley-still.jpg`, aynı sahneden `npm run valley-still` ile üretilir.

## 2b. Klasör yapısı

```
index.html  hakkimda.html  projeler.html  blog.html  galeri.html  iletisim.html  404.html
blog/                 1 yazı: takı sitesi (TR + EN aynı dosyada); iki yeni yazı bekleniyor
data/                 projeler.js — projeler sayfasının tek veri kaynağı
css/                  tokens (renkler), fonts, base, components + sayfa stilleri
js/                   boot, i18n, site, smooth (Lenis), reveal, home, cursor-lights, about, projects, blog, gallery, contact, lightbox
js/valley/            gece çiçek vadisi intro'su: intro, world, shaders, audio (yalnız ana sayfa)
i18n/en.js            İngilizce arayüz metinleri
vendor/               gsap, ScrollTrigger, lenis, three (yerel)
partials/             ortak header, footer ve ikon seti
assets/               fotoğraflar, vadinin durağan karesi, fontlar, görseller
_arsiv/               eski sürümler (Astro, laptop intro'su, v3 bahçe ana sayfası, alt sayfa 3D arka planı, kaldırılan blog yazıları ve demoları) — siteye dahil değil
scripts/              geliştirme araçları (sunucu, doğrulama, ekran görüntüsü, test)
docs/                 kontrol listesi, intro/scroll kanıt kareleri, aşama ekran görüntüleri
```

## 3. İçerik güncelleme

Önce [`CONTENT.md`](CONTENT.md)'yi güncelle, sonra ilgili sayfayı düzenle. Her metnin iki dili vardır:

```html
<span data-lang="tr">Türkçe metin</span><span data-lang="en">English text</span>
```

Kısa arayüz metinlerinin İngilizcesi `i18n/en.js` dosyasında durur (`data-i18n="anahtar"`).

### Ortak header / footer
Menüyü veya alt bilgiyi değiştirmek için `partials/header.html` ya da `partials/footer.html` dosyasını düzenle, sonra:
```bash
npm run partials
```
Bu komut tüm sayfalara yazar ve aktif menü öğesini işaretler.

### Projeler sayfası: "dosya klasörü" rafı
`projeler.html` klasörleri ve proje ayrıntılarını **tek bir veri dosyasından**, `data/projeler.js`'ten üretir (`js/projects.js`). Klasörler yan yana dizilir; sekme etiketinin rengi grubu gösterir: **şampanya = Web (WordPress)**, **lila = Grafik Animasyon I (Photoshop)**. Bir klasöre tıklayınca ayrıntı açılır; `projeler.html#zanemoda` gibi bir adres o klasörü doğrudan açar. Esc, "Klasörü kapat" ve tarayıcının geri tuşu kapatır; ← → önceki/sonraki projeye geçer.

#### Yeni proje nasıl eklenir
1. **Görselleri koy:** `assets/projects/<grup>/<slug>/` (ör. `assets/projects/web/taki-sitesi/`). Her görselin bir `.webp` ve bir `.jpg` sürümü olmalı, en uzun kenar en fazla 1600 px. Grafik Animasyon görselleri için hazır komut:
   ```bash
   node scripts/prepare-projects.mjs "<Grafik Animasyon kaynak klasörü>"
   ```
   (Kopyalanacak dosyalar betiğin başındaki `MAP` listesinde; boyutlar `assets/projects/grafik-animasyon/manifest.json`'a yazılır.)
2. **Veriyi ekle:** `data/projeler.js` içindeki `PROJELER` dizisine bir nesne ekle. En kolayı benzer bir projeyi kopyalayıp değiştirmek:
   ```js
   {
     slug: "yeni-proje",                       // adres: projeler.html#yeni-proje
     grup: "web",                              // "web" (şampanya etiket) ya da "grafik" (lila etiket)
     baslik: { tr: "Yeni Proje", en: "New Project" },
     etiket: "wordpress",                      // sekmedeki küçük etiket
     renk: "lila",                             // pudra | gul | lila | krem | sampanya | inci
     kapak: { src: "assets/projects/web/yeni-proje/kapak", w: 1600, h: 1000 },   // uzantısız; null olabilir
     kisa: { tr: "Kısa açıklama", en: "Short description" },
     neYaptim: { tr: "…", en: "…" },
     araclar: ["WordPress", "Elementor"],
     onceSonra: null,                          // ya da { once: {...}, sonra: {...} }
     gorseller: [ { src: "…/ana-sayfa", w: 1600, h: 1000, alt: { tr: "…", en: "…" }, not: null } ],
     baglanti: "https://…",                    // "[[TODO: …]]" kaldıkça "Siteyi ziyaret et" düğmesi görünmez
   }
   ```
3. Bitti. Klasör, renk, etiket, ayrıntı sayfası, galeri ve adres kendiliğinden oluşur. Kontrol için: `npm run projeler-check`.

Web projelerinin ekran görüntüleri sitelerden alınır: `node scripts/web-shots.mjs` (→ `assets/projects/web/<slug>/`).

### Galeri fotoğrafları
1. Fotoğrafı `scripts/prepare-gallery.mjs` içindeki `MAP` listesine ekle (kaynak dosya → `kategori/ad`) ve çalıştır: WebP + JPG, 1600 px ve 800 px önizleme `assets/gallery/<kategori>/` altına yazılır.
2. `scripts/build-gallery.mjs` içindeki `PHOTOS` listesine bir satır ekle (alt metin ve kısa açıklama, TR/EN).
3. `node scripts/build-gallery.mjs` — galeri listesi, filtreler ve İngilizce alt metinler yeniden yazılır. Kategoriler: spor, sanat, müzik, motor, takı, el işi, anılar.

### Blog yazıları
Üç yazı `blog.html` içinde, her biri bir `<article class="post-entry">` (TR/EN `data-lang` blokları). Yeni ekran görüntüsü eklemek için görseli `assets/projects/…` altına koyup ilgili adıma `<figure class="post-fig">` + `<figcaption>` ekle. Kontrol: `npm run blog-check`.

### Plak çalar (Spotify)
`index.html` içinde her ruh hali düğmesinin `data-src` değerine kendi Spotify Embed bağlantını yapıştır (Spotify › Paylaş › "Çalma listesini yerleştir"). Yerler `[[TODO: SPOTIFY PLAYLIST EMBED URL]]` yorumlarıyla işaretli; ilk açılan listeyi değiştirirsen `<iframe>`'in `src` değerini de güncelle. Kontrol: `npm run player-check`.


## 4. İletişim formu (Web3Forms)
Form, sayfa yenilenmeden [Web3Forms](https://web3forms.com) ile e-posta adresime gönderilir (`js/contact.js`).
1. Uç nokta formun `action` değeridir: `https://api.web3forms.com/submit`.
2. Erişim anahtarı `iletisim.html` içindeki gizli `access_key` alanındadır (Web3Forms panelinden alınır; herkese açık kullanım içindir). Anahtarı değiştirmek için yalnız bu değeri güncelle.
3. Gönderim `fetch` ile JSON olarak yapılır; düğme "Gönderiliyor..." olur ve pasifleşir. Başarıda form temizlenir ve sağ altta cam bildirim çıkar; bağlantı sorununda nazik bir uyarı ve doğrudan e-posta bağlantısı gösterilir (adres `js/config.js` › `contactEmail`).
4. Spam koruması: görünmez `botcheck` honeypot alanı; işaretliyse hiçbir şey gönderilmez.
5. Test: `npm run contact-check` — Web3Forms yanıtı taklit edilir (başarı, sunucu hatası, bağlantı kopması); gerçek e-posta gönderilmez.

GitHub bağlantısını gizlemek için `js/config.js` içinde `showGithub: false` yap.

## 5. Kalite kontrol komutları
| Komut | Ne yapar |
|---|---|
| `npm run validate` | Tüm sayfaları html-validate ile denetler |
| `npm run links` | Yerel bağlantıları ve `#bağlantı` hedeflerini denetler |
| `npm run qa` | Klavye, odak halkası, 44 px dokunma hedefi, menü odak tuzağı, dil değiştirici, klasör paneli, form, hareket azaltma |
| `npm run intro-check` | Vadi intro'sunun 0–6. saniye karelerini, imleç/dağılma/ses/ilerleme adımlarını ve videoyu (1440 ve 390 px) `docs/intro-check/` klasörüne kaydeder; hareket azaltmada durağan kareyi denetler |
| `npm run cursor-check` | İmleç ışıklarını, sayfa geçişindeki dağılmayı, geri tuşunu ve alt sayfalarda da aynı ışıltıların, motiflerin ve ışığın olduğunu denetler → `docs/cursor-check/` |
| `npm run projeler-check` | Projeler rafını uçtan uca dener (açma/kapama, Esc, geri tuşu, hash, önce/sonra kaydırıcısı) → `docs/projeler-check/` |
| `npm run valley-still` | Vadinin durağan karesini (`assets/valley/valley-still.jpg`) sahneden yeniden üretir |
| `npm run scroll-check` | Ana sayfa kaydırma karelerini (%0–100) `docs/scroll-check/` klasörüne kaydeder |
| `npm run checklist` | `docs/odev-kontrol-listesi.md` dosyasını yeniden üretir |
| `npm run a11y-check` | Erişilebilirlik (WCAG 2.1 AA): axe-core taraması (6 sayfa × TR/EN × 1440/390 px), klavye odak halkaları, %200 yakınlaştırma → `docs/a11y-check/rapor.json` |
| `npm run seo` | SEO/GEO etiketlerini (Open Graph, Twitter, JSON-LD), `robots.txt`, `llms.txt` ve — `SITE_URL` verilirse — `sitemap.xml` + canonical üretir |
| `npm run blog-check` · `studio-check` · `player-check` · `valley-return-check` · `magnetic-check` · `effects-check` · `sky-check` | Blog sayfası, takı atölyesi + imleç modları, plak çalar, vadiye geri dönüş, manyetik butonlar, başlık/kart/mühür/perde efektleri, arka plan gökyüzü |
| `npm run package` | Teslim paketini üretir: `teslim/<ÖğrenciNo>-WEB.zip` ve aynı dosyanın `.PDF` uzantılı kopyası |

Ekran görüntüsü araçları Microsoft Edge'i kullanır (`playwright-core`, tarayıcı indirmez).

## 6. Yayınlama

Site tamamen statiktir; derleme adımı yoktur. Kök klasörü olduğu gibi yayınla.

**Netlify**
1. app.netlify.com → *Add new site → Deploy manually* → proje klasörünü sürükle-bırak. (Ya da GitHub deposunu bağla.)
2. Build command: boş · Publish directory: `.` (kök).
3. `404.html` otomatik kullanılır.

**Vercel**
1. vercel.com → *Add New Project* → GitHub deposunu içe aktar.
2. Framework: **Other** · Build command: boş · Output directory: `.`

**GitHub Pages**
1. Depoyu GitHub'a gönder → *Settings › Pages* → Branch: `main`, klasör: `/ (root)`.
2. Site adresi `kullanici.github.io/depo-adi/` gibi bir alt klasördeyse 404 sayfasındaki `/css/…` yolları çalışmaz; o durumda `404.html` içindeki yolların başındaki `/` işaretini kaldır.

`node_modules/`, `_arsiv/` ve `docs/` klasörlerinin yayınlanması gerekmez.

## 7. Senden beklenen içerikler

- **Plak çalar:** kendi Spotify çalma listelerin (`index.html`, `[[TODO: SPOTIFY PLAYLIST EMBED URL]]`); şimdilik örnek listeler çalışıyor.
- **Yayın:** alan adı belli olunca `$env:SITE_URL = "https://alan-adi"; npm run seo` → canonical, `og:url` ve `sitemap.xml` eklenir.

## 8. SEO ve GEO
- **Her sayfa ayrı:** `<title>` ve `<meta name="description">` (İngilizceleri `i18n/en.js`), Open Graph + Twitter kartı, `og:locale` (tr_TR / en_US).
- **Yapılandırılmış veri (JSON-LD, schema.org):** ana sayfa `WebSite` + `Person`, Hakkımda `ProfilePage`, Projeler `CollectionPage` + 8 `CreativeWork`, Blog `Blog` + 3 `BlogPosting`, Galeri `ImageGallery` + 16 `ImageObject`, İletişim `ContactPage` + `ContactPoint`.
- **GEO (yapay zekâ yanıt motorları):** `llms.txt` — sitenin kim, ne, hangi sayfalar özetini düz metinle verir; JSON-LD aynı bilgiyi makine okunur verir. Metinler kısa, olgusal ve başlıklarla bölümlenmiştir.
- `robots.txt`: içerik açık; `_arsiv/`, `docs/`, `scripts/` kapalı. Hepsi `npm run seo` ile yeniden üretilir.

## 9. Yapay zekâ ve skill kullanımı
Site, yapay zekâ ile birlikte hazırlandı: **Claude Code** (Anthropic, Claude masaüstü uygulaması). Tasarım kararları, kod, içerik düzeni ve testler sohbetle, adım adım ve her aşamada ekran görüntüsüyle onaylanarak ilerledi. Kişisel bilgiler yalnız benim verdiğim bilgilerden alındı (`CONTENT.md`); yapay zekâ bilgi uydurmadı, eksikler `[[TODO]]` ile işaretlendi.

**Skill'ler (yapay zekâya yüklenen uzmanlık paketleri)**
- `design:accessibility-review` — WCAG 2.1 AA erişilebilirlik denetimi. Bulgular (erişilebilir ad uyuşmazlığı, klavyeyle ulaşılamayan kaydırma alanları, gece temasında görünmeyen odak halkası) düzeltildi; tekrar tarama 0 ihlal. Kanıt: `npm run a11y-check`.
- Proje talimatında (`CLAUDE.md` §9) tasarım ve animasyon için planlanan skill'ler: ui-ux-pro-max (tasarım sistemi ve UX kuralları), ui-styling, gsap-core / gsap-timeline / gsap-scrolltrigger / gsap-performance / gsap-plugins. [[TODO: hangilerinin gerçekten çalıştırıldığını kontrol et]]
- Impeccable bu ortamda yüklü değildi. [[TODO: Impeccable kurulup çalıştırılırsa sonucu buraya ekle]]

**Yapay zekâ ile yapılan doğrulamalar:** html-validate (W3C kuralları), bağlantı denetimi, axe-core erişilebilirlik taraması, Playwright ile 375–1440 px ekran görüntüleri ve etkileşim testleri (`docs/`).

## 10. Vize teslimi
1. Öğrenci numaranı bir kez proje kökündeki `.ogrenci-no` dosyasına yaz (depoya girmez), sonra `npm run package` → `teslim/<ÖğrenciNo>-WEB.zip` ve Teams için aynı dosyanın `<ÖğrenciNo>-WEB.PDF` kopyası (yalnız site dosyaları; `node_modules`, `docs`, `_arsiv` hariç, ~22 MB).
2. Rapor: `teslim/<ÖğrenciNo>-Hilal Esma Gündoğdu.docx` — ana sayfa ve alt sayfaların ekran görüntüleri.
3. YouTube: siteyi (ana sayfa + bütün alt sayfalar) gezen tanıtım videosu. [[TODO: video bağlantısı]]
