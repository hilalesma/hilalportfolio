# HİLAL ESMA GÜNDOĞDU — Kişisel Dijital Portfolyo · Proje Brief'i

Bu dosya Claude Code'un bu projede her oturumda okuyacağı ana talimattır. Tasarım, içerik ve teknik kararlar burada. Çelişki olursa bu dosya geçerlidir.

## 0. GÜNCEL KURALLAR (v4 — aşağıdaki eski bölümlerle çelişirse bunlar geçerlidir)

- **v4 yapı (23.11.2026, onaylı plan):** index.html orchestrated.nl akışından uyarlanmış hikâye sayfası (metin/logo/iş kopyalanmaz): (1) gece çiçek vadisi intro (Three.js, sıfırdan; gladeye.com'dan hiçbir şey kullanılmaz) (2) maskeden satır satır açılan büyük Hakkımda metni (3) Eğitim ve Başarılar (4) Seçili çalışmalar (klasör destesi) (5) Hayatımdan kareler (parallax) (6) Neler yapıyorum (vesikalık + liste) (7) Blog önizlemesi (8) dev e-posta ile İletişime geç. Hakkımda'nın tam içeriği yalnızca hakkimda.html'dedir.
- **v4 header:** solda HE + isim; sağda Hakkımda · Projeler · Blog · Galeri · İletişim, TR/EN ve krem "İletişime geç" pill; sağ üstte sabit "● Staj ve projelere açık / Open to internships & projects" etiketi. Lenis akıcı kaydırma tüm sayfalarda (`js/smooth.js`), maskeden açılan satırlar `data-lines` (`js/reveal.js`).
- **v4 tipografi:** büyük başlıklar Antonio 400; gövde Manrope; italik serif (Cormorant Garamond) yalnızca tek kelimelik vurgular (`.script`). Palet aynı; yalnız intro vadisi koyu.
- **Vadi intro'su (v4 C, 23.11.2026):** `js/valley/intro.js` (yönetici), `world.js` (prosedürel arazi, çiçek/yaprak noktaları, CatmullRom kamera yolu), `shaders.js` (GLSL), `audio.js` (Web Audio ile sentezlenen ortam sesi, varsayılan kapalı). D aşaması: toz, ışık huzmeleri, son geçiş (RGB ayrışması + gren + hıza bağlı vinyet), ses. Aşağı ok düğmesi 24.11.2026'da kaldırıldı: akış kaydırmayla devam eder (yolun sonunda Hakkımda gelir). Yükleyici + uçuş oturumda bir kez oynar (`he-valley`), `?intro=1` zorlar; bölüme doğrudan bağlantıyla gelinince oynamaz. **Canlı vadi (25.11.2026):** çıkışta sahne kapatılmaz, park edilir (`docked`; yalnız görünürken çizilir). Sayfanın en üstünde yukarı kaydırmaya devam edilince (tekerlek, parmak, ↑/PageUp/Home) vadiye yeniden girilir ve kamera yol boyunca geri gider; aşağı kaydırınca yeniden Hakkımda'ya çıkılır. Sonraki ziyaretlerde (`HE.valleyLive`) sahne arka planda yüklenir, durağan karenin yerini alır; sayfa en üstten açılınca doğrudan keşif. Boşta ilerleme 0.93'te durur, çıkış yalnız kaydırmayla. Kanıt `npm run valley-return-check` → `docs/valley-return-check/`. Oynamadığında `assets/valley/valley-still.jpg` görünür (`npm run valley-still` sahneden üretir). Kanıt: `npm run intro-check` → `docs/intro-check/`.
- **GECE TEMASI (24.11.2026, tüm site — kullanıcı isteği; "palet krem ağırlıklı" kuralının yerine geçer):** bütün sayfalar girişteki gece vadisiyle aynı koyu atmosferde. `css/theme-night.css` her sayfada EN SON yüklenir; renk rollerini çevirir (--espresso → kırık beyaz metin #f5f3ff, --cream/--pearl → koyu yüzey, vurgu metni şeftali-altın #f6c08a), kartlar/butonlar rgba(255,255,255,.05) cam + 1px soluk altın/mor kenarlık. Doğası gereği koyu bileşenlerde (vadi, dumanlı cam, ışık kutusu, kod) eski anlamlar yerel olarak geri verilir. Hex değerleri yine yalnız `tokens.css`'te (gece paleti bölümü). Açık temaya dönmek için yalnız bu `<link>` kaldırılır. Vadinin alt kenarı sayfa zeminine erir; bölüm sırası, içerik ve tipografi değişmedi.
- **Arka plan derinliği (24.11.2026, TÜM sayfalar — kullanıcı isteğiyle v4 E/F kuralının yerine geçer):** `partials/header.html` içindeki `.ambient` katmanı (z-index:-1, pointer-events:none): sıcak mesh gradient (fildişi/şampanya → şeftali/toz pembe, blur), 1px %4 ızgara, %3 kâğıt greni, %9 opaklıkta parallax ile süzülüp dönen pastel altın/şeftali çiçek/yıldız motifleri ve imleci izleyen 400px şeftali/altın ışık (`css/ambient.css`, `js/ambient.js`). Vadiden Hakkımda'ya geçişte yumuşak renk erimesi (`.intro-text::before`). Vadi çiçekleri ve imleç ışıkları doygun altın/şeftali/lavanta/gül kurusu tonlarında, ışıltılarda drop-shadow parlaması. Metin okunabilirliği önceliklidir.
- **İmleç ışıkları** (`js/cursor-lights.js`) tüm sayfalarda aynı yoğunluk ve hareketle: iz, bekleme süzülmesi, bağlantı çevresinde toplanma, tıklama patlaması, başka sayfaya geçişte dağılma + gece perdesi (`HE.leaveTo`, aşağıya bkz.); kanıt `npm run cursor-check` → `docs/cursor-check/`. Alt sayfalarda Three.js/3D arka plan yoktur (v4 F: eski `bg3d.js`, `three-kit.js` ve bahçe görselleri `_arsiv/` içinde). **Projeler (25.11.2026):** projeler.html "dosya klasörü" rafı — tek veri kaynağı `data/projeler.js` (8 proje: 2 Web/WordPress şampanya etiket, 6 Grafik Animasyon I/Photoshop lila etiket), `js/projects.js` üretir; klasör açılınca ayrıntı (View Transitions, yoksa FLIP), önce/sonra kaydırıcısı, hash (#slug), Esc/geri tuşu. Görseller `assets/projects/grafik-animasyon/<slug>/` (`npm run prepare-projects`). Kanıt `npm run projeler-check` → `docs/projeler-check/`. Mood Tracker sitede hiçbir yerde yoktur.

- **Manyetik butonlar (25.11.2026):** `js/magnetic.js` tüm sayfalarda; `.nav-cta`, `.pill-cta`, `.btn--solid`, `[data-magnetic]` imleç çevresinde (70 px) en fazla 16 px kayar, uzaklaşınca 0,8 sn'de `cubic-bezier(0.22, 1, 0.36, 1)` ile merkeze döner (eğri JS'te çözülür). CSS `translate` özelliğine yazar (mevcut `transform` hover'larıyla çakışmaz). Yalnız fareli cihazlar; reduced-motion'da kapalı. Kanıt `npm run magnetic-check` → `docs/magnetic-check/`.
- **Başlıklar (25.11.2026):** `main` içindeki h1/h2'lerin kelimeleri yerinde `.wmask > .wmask__inner` ile sarılır, kaydırınca translateY(100%) → 0 süzülür; ≥ 40 px başlıklarda ardından altın/beyaz shimmer (`js/reveal.js` §3). Başlıklarda artık `data-lines` satır maskesi kullanılmaz (scrub hariç).
- **Cam kartlar (25.11.2026):** `[data-tilt]` ve `main .glass` (menü paneli, form, tablo kabı, `.pill` hariç) imlece göre en fazla 5° eğilir; `.glass-spot` altın/lavanta radial ışık (`js/site.js` §5).
- **Dönen mühür (25.11.2026):** "WEB TASARIM ✦ YAZILIM ✦ GRAFİK TASARIM ✦" SVG rozeti ana sayfa İletişim bölümünde ve iletisim.html başlığında; kaydırma hızıyla hızlanır (`js/seal.js`).
- **Sayfa geçişi (25.11.2026):** krem `.lights-veil` / `.page-fade` kaldırıldı. Gece perdesi `.page-curtain` + soluk altın "HE" belirir (`HE.leaveTo`); yeni sayfada `boot.js` `he-pt` işaretiyle `html.pt-in::before` perdesi yukarı kayarak açılır. Kanıt `npm run effects-check` → `docs/effects-check/`.
- **Gökyüzü (25.11.2026):** `.ambient-orbs` (z-index:-2) üç ışık küresi (lavanta, koyu mor, şampanya; 500–700 px, blur 120px, opaklık 0.14, 20–25 sn çapraz süzülme); yıldızların üçte biri yavaş göz kırpar (`.ambient__star--slow`); `.ambient__shooting` her 10 sn'de sağ üstten sol alta kayar. Yalnız transform/opacity; reduced-motion'da durur/gizlenir. Kanıt `npm run sky-check` → `docs/sky-check/`.

- **Mini Takı Atölyesi (25.11.2026):** ana sayfa "Hayatımdan kareler" bölümünün altında koyu cam kart (`.studio`, `js/jewelry-studio.js`): altın ipte 7 boncuklu SVG bileklik, 5 taş (altın, lavanta, inci beyazı, gül kurusu, turkuaz; token `--stone-*`), sıradaki boncuk scale + parlama ile boyanır (7'den sonra başa döner), kombinasyona göre TR/EN enerji mesajı, Sıfırla.
- **Vize teslimi (25.11.2026):** SEO/GEO `npm run seo` (`scripts/build-seo.mjs`: her sayfada `<!-- seo:start/end -->` arası Open Graph/Twitter + sayfaya özel JSON-LD; `robots.txt`, `llms.txt`; `SITE_URL` verilince canonical + `sitemap.xml`). Elle `og:`/JSON-LD yazılmaz, betik üretir. Erişilebilirlik `npm run a11y-check` (axe-core WCAG 2.1 AA, 0 ihlal). Paket `npm run package` → `teslim/<ÖğrenciNo>-WEB.zip` + `.PDF` (tar ile, yollar "/"; node_modules/docs/_arsiv hariç). Rapor: `npm run report-shots` + scratchpad'deki docx betiği → `teslim/<ÖğrenciNo>-Hilal Esma Gündoğdu.docx`. E-posta adresi betiklere yazılmaz (gizlilik eklentisi engeller).
- **İletişim formu (25.11.2026):** Web3Forms; `action="https://api.web3forms.com/submit"`, gizli `access_key` iletisim.html'de, `botcheck` honeypot (`.hp-field`). `js/contact.js` fetch + JSON, "Gönderiliyor..." + disabled, sağ altta cam `.form-toast` (başarı / hata + mailto), e-posta `config.contactEmail`'den. Kopyala düğmesi `.copy-btn--labeled` ("Kopyala" → 2 sn "Kopyalandı ✓"). Test `npm run contact-check` gerçek gönderim yapmaz (istek taklit edilir); siteyi denerken gerçek gönderim kullanıcının kutusuna düşer.
- **Plak çalar (25.11.2026):** ana sayfa `.extras` alanında atölyenin yanında (≥1024px iki sütun) `.player` kartı (`js/mood-player.js`): CSS vinil plak (`spin 10s`), sekme değişince `vinyl-boost` hızlanma, 4 ekolayzır çubuğu, 3 ruh hali sekmesi (emoji kullanıcı isteğiyle), standart Spotify Embed `<iframe>` (`theme=0`, API anahtarı yok). Listeler düğmelerin `data-src` değerinde, `[[TODO: SPOTIFY PLAYLIST EMBED URL]]` yorumlarıyla; şimdilik örnek: Deep Focus, Peaceful Piano, Classical Essentials. Kanıt `npm run player-check` → `docs/player-check/`. Testlerde yalnız localhost kaynaklı konsol hataları sayılır (Spotify çerçevesinin kendi kayıtları hariç).
- **Galeri bağlantılı filtre:** `galeri.html#filtre-<kategori>` o filtreyle açılır (`js/gallery.js`; düğme id'leri `scripts/build-gallery.mjs` üretir). Hakkımda'daki takı kartı "Galeri: Takılarım" → `#filtre-taki`.
- **İmleç modları (25.11.2026):** `js/cursor-lights.js` sağ altta `.cursor-mode` hap düğmesi oluşturur (fixed, 24px; ≤768px'te 16px; z-index 90; intro oynarken gizli). Çiçek ✿ (varsayılan, pastel nokta/çiçek/yıldız) → Yıldız Tozu ✦ (altın/şampanya) → Müzik Notaları ♪ (lavanta/altın ♪ ♫, seyrek, en fazla 70). Tercih localStorage `he-cursor`, bütün sayfalarda sürer. Genel değişken adı `effect` (spawn() içindeki `mode` parametresiyle karışmasın). Kanıt `npm run studio-check` → `docs/studio-check/`.
- **Blog (25.11.2026):** blog.html = "Blog notlarım" başlığı + giriş, kategori hapları (ui / grafik / web; `js/blog.js` kartları ve yazıları birlikte süzer), kartlar + dizin, altında akıcı makale düzeninde 3 yazı (`.post-entry`, kimlikler `#layer-comps-960-grid`, `#karakalemden-dijitale`, `#iki-wordpress-sitesi`). Metinler `data-lang` bloklarında, görseller `assets/projects/` içinden `<figure>`/`<figcaption>` ile; eksik ekran görüntüsü yok: 960 grid adımı `.grid-viz` (tasarımın üzerine CSS ile 12 sütun; Proje6.psd 1020 px, içerik 960 px); bulunamayan Burn/Dodge, Özelleştirici ve eklenti görüntüleri kaldırıldı (`.shot-todo` stili ileride gerekirse duruyor). Eski tek sayfalık takı yazısı `_arsiv/blog-kaldirilan/blog/` içinde, sitede yok. Altta cam rozetler (`.badge`). Ana sayfa blog önizlemesi bu üç yazıya bağlanır. Kanıt `npm run blog-check` → `docs/blog-check/`.

- **İçerik kaynağı:** tüm kişisel bilgiler `CONTENT.md` içindedir. Orada olmayan bilgi uydurulmaz; eksikler `[[TODO: …]]`.
- **Ad:** her yerde "Hilal Esma Gündoğdu" (hero, `<title>`, meta, Open Graph, JSON-LD Person, footer, Hakkımda, İletişim). Hero'da büyük serif "Hilal Esma", altında ince "Gündoğdu". İsimde CSS `text-transform: uppercase` kullanılmaz; büyük harf gerekirse HTML'e "HİLAL ESMA GÜNDOĞDU" yazılır. Monogram "HE".
- **Vesikalık (v4, 23.11.2026):** Hakkımda sayfasında ve ana sayfanın "Neler yapıyorum" bölümünde kullanılır; intro/hero'da kullanılmaz. §2 ve §4.2'deki "hero'da portre" maddeleri geçersizdir.
- **Yasak ifadeler:** "Okul birincisi", "Valedictorian" ve benzeri; doğru rozet yalnızca "Bölüm Birincisi / Ranked 1st in IT Department".
- **Mimari (ders ödevi):** Astro yerine **düz HTML + CSS + JS** statik site. Sayfalar: `index.html`, `hakkimda.html`, `projeler.html`, `blog.html`, `galeri.html`, `iletisim.html`, `404.html` (blog yazıları blog.html içinde; eski `blog/` ve `demos/` arşivde). GSAP, ScrollTrigger ve Three.js yerel olarak `vendor/` içinde (klasik script; `file://` ile de çalışır). Eski Astro sürümü `_arsiv/astro-surumu/` içinde, siteye dahil değildir.
- **Kod:** okunaklı, girintili, yorumlu ve semantik (hoca kaynak kodu inceleyecek). Ortak header/footer `partials/` içinden `npm run partials` ile tüm sayfalara yazılır; aktif menü öğesi `aria-current="page"`.
- **Dil:** TR varsayılan; EN geçişi `js/i18n.js` + `i18n/en.js`. Kısa metinler `data-i18n`, uzun metinler `data-lang="tr|en"` blokları. Kurum ve şirket adları çevrilmez. Seçim `localStorage` ile hatırlanır.
- **Hareket:** `prefers-reduced-motion` açıkken sabitleme (pin), kamera hareketi ve 3D animasyon kapanır; içerik doğrudan görünür. Test parametresi: `?motion=full` (reduced-motion yok sayılır).
- **Eski intro'lar geçersiz:** laptop görseli (`intro-laptop-scene.jpg`, `_arsiv/intro-eski/`) ve v3 bahçe → bulut yolculuğu (`_arsiv/v3-ana-sayfa/`) sitede kullanılmaz; yerine v4 gece çiçek vadisi geldi. §2 ve §4.1–4.2'deki laptop/bahçe/hero maddeleri geçersizdir.
- **Menü (v4):** ana sayfada Hakkımda · Projeler · Blog · Galeri · İletişim bölümlere kaydırır (`#hakkimda`, `#calismalar`, `#blog`, `#kareler`, `#iletisim`; `scripts/sync-partials.mjs` HOME_SECTIONS), diğer sayfalarda ilgili dosyaya gider. Ana sayfa artık alt sayfalardan `<!-- include -->` ile içerik kopyalamaz.
- **Doğrulama:** `npm run validate`, `links`, `qa`, `intro-check`, `cursor-check`, `projects-check` temiz; konsol hatası ve 375/768/1024/1440 px'te yatay kaydırma yok.
- **Çalışma şekli:** her aşamanın sonunda 390 ve 1440 px ekran görüntüsü kullanıcıya gösterilir ve onay beklenir.

---

## 1. Amaç ve ton

- **HILAL ESMA** adına kişisel bir dijital portfolyo. Güzellik markası veya alışveriş sitesi **değil**: ürün kartı, fiyat, sepet, "Shop" gibi öğeler olmayacak.
- Site vize başvurusunda da kullanılacak. Büyülü ve sanatsal olsun, ama içerik bölümleri **okunaklı, güvenilir ve profesyonel** kalsın. Efektler içeriğin önüne geçmesin.
- Ziyaretçi, içinde gezindiği **kişisel bir dijital evren** hissi yaşamalı.
- Kişisel deneyimler, hobiler, spor hayatı, projeler ve fotoğraflar etkileşimli kartlarla gösterilecek.

## 2. Referans görseller ve kullanım kuralları

| Dosya | Rol |
|---|---|
| `assets/photos/hilal-esma-portrait.jpg` | Kişisel fotoğraf. **Ana sayfada** (hero) ve **Hakkımda** bölümünde kullanılacak. Yüz ve kıyafet üzerinde hiçbir düzenleme, filtre, yapay zekâ değişikliği yapılmayacak. Yalnızca kırpma, çerçeve, maske (kemer/oval form) ve ışık efekti uygulanabilir. Mavi düz arka plan, sayfanın paletine uymuyorsa fotoğrafı yumuşak kenarlı bir kemer/oval çerçeve içinde göster. |
| `assets/intro/intro-laptop-scene.jpg` | **Açılış geçişi (intro).** Siteye girişte bu sahne görünür, kamera laptop ekranına doğru yakınlaşır ve ekranın içindeki dünya ana sayfaya dönüşür (ayrıntı: §4.1). |
| `assets/references/02-home-intro-wonder.png` | Ana sayfa atmosfer referansı (masalsı bahçe, ışık, derinlik, ince serif büyük başlık, yatay cam kartlar). |
| `assets/references/03-projects-folders.png` | **Projeler** bölümünün düzen referansı: üst üste dizilmiş klasörler, dikey sekmeler, sekme etiketleri, editoryal dosya düzeni. |
| `assets/references/04-blog-glass.png` | **Blog** bölümü ve genel **cam panel** dili referansı: yarı saydam buzlu cam kartlar, sedef küreler, kristaller, havada süzülen bağımsız paneller, yumuşak pastel ışık. |

**Kurallar:**
- **Sonuç görsellere mümkün olduğunca yakın olmalı.** Her bölümün kompozisyonu, yerleşimi, renk ve ışık atmosferi, tipografi karakteri, cam/3D malzeme hissi ve detay yoğunluğu ilgili referansla yan yana konduğunda aynı tasarımın devamı gibi görünmeli. "Esinlenip başka bir şey yapma" yaklaşımı yerine referansı yakından takip et; yalnızca **içerik** (isim, metinler, kartların konusu, fotoğraflar) Hilal Esma'ya ait olsun.
- Her bölümü bitirdiğinde ekran görüntüsünü ilgili referansla yan yana karşılaştır, fark eden noktaları (renk sıcaklığı, ışık yönü, cam opaklığı, köşe yuvarlaklığı, boşluklar, yazı ağırlığı) listele ve düzelt.
- Referanslardaki üçüncü taraf içerikler (marka logoları, Starbucks, "PinkMelo", "Jreami", "Jaylin Graphics", ürün fotoğrafları, başka kişilerin fotoğrafları, referanslardaki başlık yazıları) **sitede kullanılmayacak**. Bunların yerine Hilal Esma'nın içerikleri gelecek. Referans PNG'leri sitede gösterilmeyecek; intro görseli hariç.
- `intro-laptop-scene.jpg` **kalıcı intro görselidir** ve olduğu gibi kullanılacak (§4.1).

## 3. Bilgi mimarisi

Tek sayfalık akış + proje/blog detay sayfaları:

1. **Intro** (yalnızca ilk ziyarette, atlanabilir)
2. **Ana Sayfa / Hero** — masalsı dünya
3. **Hakkımda** — editoryal, romantik
4. **Deneyim · Spor · Hobiler** — etkileşimli cam kartlar
5. **Projeler** — klasör/dosya arşivi
6. **Fotoğraflar** — galeri (lightbox)
7. **Blog / Journal** — cam paneller
8. **İletişim**

Rotalar (her iki dil için): `/`, `/projects/[slug]`, `/blog/[slug]`, `/en/...` karşılıkları.

## 4. Bölüm bölüm tasarım

### 4.1 Intro geçişi (görsel 2 → ana sayfa)
- Sahne `intro-laptop-scene.jpg` ile, görselin kendisi tam ekran (object-fit: cover, laptop her ekranda görünür kalacak şekilde odak noktası ekranın merkezi) gösterilerek açılır. Görsel değiştirilmez veya yeniden çizilmez; üzerine yalnızca hafif nefes alan bir parallax, yumuşak ışık parıltısı ve süzülen petal parçacıkları eklenir.
- Ana sayfa (hero), intro'daki laptop ekranının içindeki dünyanın **devamı** gibi görünmeli: aynı karanlık masalsı bahçe, çiçek kemeri, pembe bulutlu gökyüzü, sıcak ışık, sağda yatay cam kartlar ve büyük ince serif başlık. Böylece yakınlaşma bittiğinde geçiş kesintisiz hissedilir.
- Laptop ekranının görseldeki yaklaşık konumu (görsel boyutuna oranla): **left %11.4, top %24.9, width %78.8, height %48.1**. Bu dikdörtgeni JS ile ölç / CSS değişkeni olarak tut.
- 1.5–2 sn sonra veya kullanıcı kaydırınca/tıklayınca: GSAP timeline ile kamera ekrana yakınlaşır (scale + translate, ekran dikdörtgeni viewport'u dolduracak şekilde). Ekran alanı, ana sayfa hero'suna crossfade/mask reveal ile dönüşür. Etrafındaki çiçekler kenarlara doğru dağılır.
- "Atla / Skip" butonu her zaman görünür. Intro yalnızca oturumdaki ilk ziyarette oynar (`sessionStorage`, try/catch ile).
- `prefers-reduced-motion` açıksa intro atlanır, doğrudan hero gösterilir.

### 4.2 Ana Sayfa (Hero) — masalsı, büyülü, sürükleyici
- Çiçekler, bulutlar, ışık huzmeleri (god rays), doğa detayları ve derinlik veren 3D katmanlar.
- **Three.js** sahnesi: süzülen sedef inciler, cam/kristal formlar, uçuşan petaller. Hepsi **prosedürel veya kendi üretilmiş** modeller. **Mouse hareketine tepki** verir (hafif dönme, parallax, imleç yakınında itilme). Mobilde jiroskop yerine yavaş otomatik hareket.
- Büyük ince serif başlık: **HILAL ESMA**, altında kısa bir tanıtım cümlesi (placeholder).
- Kişisel fotoğraf, kemer biçimli cam çerçevede, ışık halesiyle.
- Hero'nun sağında/altında yatay kaydırılabilir küçük cam kartlar: "Projeler", "Hakkımda", "Blog" gibi bölümlere kısayol (referanstaki üçlü kart düzeninden ilham, içerik kişisel).
- Aşağı kaydır göstergesi (dairesel döner yazı + ok).

### 4.3 Hakkımda — sanatsal, romantik, zarif, editoryal
- Lüks dergi düzeni: büyük serif başlık, italik vurgu kelimeler, sütunlu metin, drop cap, ince çizgiler, sayfa numarası/künye gibi editoryal detaylar.
- Klasik sanat eserlerinden ve çiçeklerden ilham: botanik çizim tarzı süslemeler (kendi çizilmiş SVG), çerçeve, kâğıt dokusu. Telifli sanat eseri görseli kullanma.
- Kişisel fotoğraf bu bölümde de büyük ve zarif çerçeveyle yer alır.
- Hakkımda metni `src/content/` altındaki içerik dosyasından gelir (placeholder; §7).

### 4.4 Deneyim · Spor · Hobiler
- Birbirinden bağımsız, havada süzülen **cam kartlar** (referans 4).
- Kartlarda perspektif tilt (mouse ile), ışık yansıması (imleci takip eden radial highlight), hover'da hafif yükselme.
- Kategoriler: Deneyimler, Spor hayatı, Hobiler. Her kart tıklanınca detay paneli açılır (modal/drawer, klavye ile kapatılabilir).

### 4.5 Projeler — klasör arşivi (referans 3)
- Üst üste kademeli dizilmiş klasörler, her klasörün **dikey sekmesi** ve sekme etiketi (ör. "wordpress", "e-commerce", "fashion content", "coming soon").
- Sol tarafta büyük dikey editoryal başlık (ör. "selected *works*", serif + script karışımı).
- Hover'da klasör hafifçe dışarı kayar, içindeki kapak görseli görünür. Tıklayınca klasör açılma animasyonu ile proje detayına geçilir.
- Mobilde klasörler dikey yığına dönüşür; sekmeler üstte yatay etiket olur. Dokunarak açılır.
- **Proje detay sayfası**: büyük görseller (galeri), proje açıklaması, rol, kullanılan teknolojiler (etiketler), tarih, varsa canlı bağlantı ve önceki/sonraki proje gezintisi.

Projeler:
1. **WordPress Takı Web Sitesi**: slug `wordpress-jewelry`
2. **ZaneModa**: moda ve kombin içerikleri üzerine WordPress projesi, slug `zanemoda`
3. **Yakında: Yazılım projeleri**: "coming soon" durumundaki boş klasör(ler); yeni proje eklemek yalnızca bir içerik dosyası eklemek kadar kolay olmalı.

### 4.6 Fotoğraflar
- Masonry / editoryal galeri, lightbox (klavye, swipe, alt metin). Fotoğraflar `src/content/photos/` veya `public/photos/` altından otomatik okunur.

### 4.7 Blog / Journal (referans 4)
- Kristaller, sedef küreler ve pastel kum/gökyüzü atmosferi içinde **süzülen cam paneller**. Panel kenarlarında akışkan "damla" formu (referanstaki eriyen cam kenar), SVG mask ile.
- Yazı kartları: kapak, başlık, tarih, okuma süresi, etiketler. Detay sayfası okunaklı (cam efekti yalnızca çevrede; metin alanı düz, yüksek kontrastlı).
- Yazılar Markdown/MDX içerik koleksiyonundan gelir. 1–2 örnek placeholder yazı.

### 4.8 İletişim
- Cam panel içinde form (ad, e-posta, mesaj) + sosyal bağlantılar. Form gerçekten çalışsın: Formspree/Netlify Forms gibi bir uç noktayla, endpoint `.env` üzerinden; yoksa `mailto:` fallback. Doğrulama ve hata mesajları alanın yanında.

## 5. Ortak tasarım sistemi

Bölümlerin atmosferi farklı olabilir. Tipografi, renk, animasyon dili ve navigasyon **tek bir sistem** olmalı.

### Renk paleti (dengeli kullan, her yer pembe olmasın)
| Token | Ton | Öneri |
|---|---|---|
| `--powder` | Pudra pembesi | `#F3D9DC` |
| `--rose` | Gül kurusu | `#B9777E` |
| `--lilac` | Lila | `#C9B6E4` |
| `--cream` | Krem | `#F8F2EA` |
| `--champagne` | Şampanya | `#E9D8BE` |
| `--pearl` | Sedef | `#EEEAF0` (+ iridescent gradient) |
| `--silver` | Hafif gümüş | `#D9D9DE` |
| `--espresso` | Koyu kahve (metin, kontrast) | `#3B2A26` |

- Zemin ağırlıkla krem/şampanya/sedef, vurgular gül kurusu ve lila. Koyu kahve ana metin rengi.
- Tüm metinler WCAG AA kontrastı (4.5:1) sağlamalı; cam paneller üzerindeki metin için gerekirse panel opaklığını artır.
- Hex değerleri yalnızca token dosyasında; bileşenlerde semantik token kullan.

### Tipografi
- Başlık: zarif, yüksek kontrastlı serif (ör. **Cormorant Garamond** veya **Playfair Display**).
- Vurgu: tek bir script/italik font, az kullanım (ör. "works", "journal" gibi tek kelimeler).
- Gövde: okunaklı sans (ör. **Manrope** veya **Inter**). Gövde en az 16px, satır aralığı 1.6.
- Türkçe karakterleri (ş, ğ, ı, İ, ç, ö, ü) eksiksiz destekleyen fontlar seç; `font-display: swap`, kendi barındırılan (self-hosted) fontlar tercih.

### Cam panel bileşeni (tek bileşen, her yerde)
- `backdrop-filter: blur()` + yarı saydam beyaz/sedef dolgu + ince açık kenar + iç parıltı + yumuşak gölge.
- Havada süzülme: hafif, kartlar arasında faz kayması olan yüzme animasyonu.
- Hover: perspektif tilt (max ~8°), imleci takip eden ışık yansıması, gölge derinleşmesi.
- `backdrop-filter` desteklenmiyorsa opak fallback.

### Animasyon dili (GSAP)
- Tek bir ease ailesi ve süre ölçeği (ör. giriş 0.8–1.2 sn, UI 0.2–0.3 sn).
- ScrollTrigger ile bölümler yumuşak açılır (opacity + y + hafif blur), stagger'lı.
- Bölüm geçişlerinde atmosfer değişimi (arka plan renk/ışık geçişi).
- Görünüm dışındaki 3D sahneler duraklatılır.
- `gsap.matchMedia()` ile `prefers-reduced-motion`: parallax, tilt, intro ve scroll-scrub kapanır; içerik son halinde görünür.

### Navigasyon
- Cam bir üst bar: logo/monogram "HE", bölüm bağlantıları, dil değiştirici (TR | EN). Kaydırınca küçülür, aktif bölüm işaretlenir.
- Mobilde tam ekran cam menü (aç/kapat animasyonlu, Escape ile kapanır, odak tuzağı).
- Dil değiştirici tasarımla bütünleşik bir cam "hap" (pill) olsun.

## 6. Teknik mimari

- **Astro** (statik çıktı) + **TypeScript** + **Tailwind CSS v4** + **GSAP** (ScrollTrigger) + **Three.js** (yalnızca hero/arka plan adalarında, lazy-load).
- İçerik: Astro Content Collections (`projects`, `blog`, `experiences`), Markdown/MDX + şema doğrulama (zod).
- **Çok dil (i18n):** Astro'nun yerleşik i18n yönlendirmesi. Varsayılan dil İngilizce (`/`), Türkçe `/tr/`. Tüm arayüz metinleri `src/i18n/{en,tr}.json` dosyalarında; içerik dosyalarında her iki dil. Dil değiştirici aynı sayfanın diğer dildeki karşılığına gider. `<html lang>`, `hreflang` etiketleri ve seçimin hatırlanması doğru çalışmalı.
- Görseller: `astro:assets` ile AVIF/WebP, responsive `srcset`, lazy-load, boyut rezervasyonu (CLS < 0.1).
- Performans hedefleri: Lighthouse Performance ≥ 85 (mobil), Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. Three.js ve GSAP yalnızca gerektiği yerde yüklenir. Düşük güçlü cihazlarda parçacık sayısı azalır.
- SEO: başlık/açıklama, Open Graph görseli, `sitemap`, `robots.txt`, kişi için JSON-LD (`Person`).
- Yazdırma stili: Hakkımda, Deneyim ve Projeler sayfaları `@media print` ile sade, okunaklı çıktı versin (vize dosyası için).
- Yayın: Vercel/Netlify/GitHub Pages'e hazır; README'de kurulum ve yayın adımları.

## 7. İçerik kuralları

- **Hiçbir başarı, tarih, kurum, sayı veya referans uydurulmayacak.** Bilgi yoksa açıkça işaretlenmiş placeholder kullan: `[[TODO: ...]]` ve README'de doldurulacak alanların listesi.
- Tüm içerik `src/content/` altında, kod değiştirmeden güncellenebilir olmalı.
- Fotoğraflara anlamlı `alt` metinleri (TR/EN).

## 8. Erişilebilirlik ve kalite kontrol listesi

- [ ] Klavye ile tüm menüler, kartlar, klasörler, modal ve lightbox kullanılabiliyor; odak halkaları görünür.
- [ ] Dokunma hedefleri ≥ 44×44 px.
- [ ] Emoji ikon yok; SVG ikon seti (ör. Lucide).
- [ ] `prefers-reduced-motion` tamamen destekleniyor.
- [ ] 375 / 768 / 1024 / 1440 px genişliklerde yatay kaydırma yok, estetik korunuyor.
- [ ] Dil değiştirici her sayfada çalışıyor, tüm metinler çevrili.
- [ ] Tüm bağlantılar çalışıyor (kırık link yok), 404 sayfası tasarıma uygun.
- [ ] Konsol hatası yok; `astro check` ve build temiz.
- [ ] Tarayıcıda (gerekirse Playwright ile) ekran görüntüleri alınıp görsel kontrol yapıldı.

## 9. Kullanılacak skill'ler

- **ui-ux-pro-max**: tasarım sistemi kararları, UX kuralları, teslim öncesi kontrol listesi.
- **ui-styling**: Tailwind token'ları, responsive düzen, erişilebilir bileşenler.
- **gsap-core / gsap-timeline / gsap-scrolltrigger / gsap-performance / gsap-plugins**: intro timeline'ı, scroll animasyonları, reduced-motion.
- **Blender MCP** (bağlıysa, opsiyonel): referanslardaki görünüme yakın 3D objeler (inci, sedef küre, kristal, cam form, çiçek, bulut) ve hero arka plan katmanları; çıktılar `public/3d/` veya optimize görseller olarak.
