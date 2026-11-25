/* ==========================================================================
   data/projeler.js — Projeler sayfasının TEK veri kaynağı
   projeler.html bu listeyi okuyup klasörleri ve proje ayrıntılarını üretir (js/projects.js).
   Klasik betik olarak yüklenir: sayfa dosyadan (file://) açılınca da çalışır.

   YENİ PROJE EKLEMEK (README.md › "Yeni proje nasıl eklenir"):
     1. Görselleri assets/projects/<grup-klasörü>/<slug>/ içine koy (WebP + JPG, en uzun kenar 1600 px;
        Grafik Animasyon için: node scripts/prepare-projects.mjs "<kaynak klasör>").
     2. Aşağıdaki PROJELER dizisine bir nesne daha ekle (en kolayı: benzer bir projeyi kopyalayıp değiştirmek).
     3. Bitti: klasör, sekme etiketi, renk, ayrıntı sayfası ve URL (projeler.html#<slug>) kendiliğinden oluşur.

   Alanlar
     slug        URL'de görünen kısa ad (küçük harf, Türkçe karaktersiz, tire ile)
     grup        "web" (WordPress, şampanya etiket) | "grafik" (Grafik Animasyon I, lila etiket)
     baslik      { tr, en }
     etiket      sekmedeki küçük etiket yazısı
     renk        klasör rengi: "pudra" | "gul" | "lila" | "krem" | "sampanya" | "inci"
     kapak       { src (uzantısız yol), w, h } — klasörler arasından görünen şerit ve ayrıntıdaki ilk görsel
     kisa        { tr, en } — kısa açıklama
     neYaptim    { tr, en }
     araclar     [ "…" ] — rozet olarak gösterilir
     onceSonra   { once, sonra } | null — karşılaştırma kaydırıcısı (aynı boyutlu iki görsel en iyisidir)
     gorseller   [ { src, w, h, alt: { tr, en }, not: { tr, en } } ] — galeri (lightbox ile açılır)
     baglanti    "https://…" ya da "[[TODO: …]]" (TODO kaldıkça "Siteyi ziyaret et" düğmesi görünmez)
     instagram   (isteğe bağlı) Instagram sayfası; "[[TODO: …]]" kaldıkça düğme görünmez
   Metinlerde [[TODO: …]] doldurulacak yerleri, [[KONTROL]] onay bekleyen önerileri işaretler.
   ========================================================================== */
(function () {
  "use strict";

  var GA = "assets/projects/grafik-animasyon/";
  var WEB = "assets/projects/web/";   // ekran görüntüleri: node scripts/web-shots.mjs

  /** Kısa yol: görsel nesnesi */
  function img(src, w, h, altTr, altEn, notTr, notEn) {
    return { src: src, w: w, h: h, alt: { tr: altTr, en: altEn }, not: notTr ? { tr: notTr, en: notEn } : null };
  }

  window.HE_PROJECTS = {
    /* Grup bilgileri: lejant ve detaydaki künye */
    gruplar: {
      web: {
        ad: { tr: "Web (WordPress)", en: "Web (WordPress)" },
        kunye: null
      },
      grafik: {
        ad: { tr: "Grafik Animasyon I (Photoshop)", en: "Graphic Animation I (Photoshop)" },
        kunye: {
          tr: "Akdeniz Üniversitesi · Grafik Animasyon I · Ders Sorumlusu: Öğr. Gör. Dr. Erokan Canbazoğlu",
          en: "Akdeniz University · Graphic Animation I · Instructor: Öğr. Gör. Dr. Erokan Canbazoğlu"
        },
        video: {
          href: "https://youtu.be/GQuDYzYwrss",
          kapak: { src: GA + "video-kapak", w: 960, h: 540 },
          ad: { tr: "Tüm projelerin tanıtım videosu", en: "Video presenting all projects" }
        }
      }
    },

    PROJELER: [
      /* ================================ WEB ================================ */
      {
        slug: "taki-sitesi",
        grup: "web",
        baslik: { tr: "My Jewelry World", en: "My Jewelry World" },
        etiket: "wordpress",
        renk: "sampanya",
        kapak: { src: WEB + "taki-sitesi/masaustu", w: 1440, h: 900 },
        kisa: { tr: "Kendi el yapımı takılarım için WordPress ile hazırladığım takı sitesi.", en: "The WordPress jewelry site I built for my own handmade jewelry." },
        neYaptim: { tr: "Kendi el yapımı takılarım için WordPress ile bir web sitesi hazırladım.", en: "I built a WordPress website for my own handmade jewelry." },
        araclar: ["WordPress"],
        onceSonra: null,
        gorseller: [
          img(WEB + "taki-sitesi/uzun", 886, 1600, "My Jewelry World ana sayfası: takı fotoğrafları galerisi ve kategoriler", "My Jewelry World home page: jewelry photo gallery and categories", "Ana sayfa (tam görünüm)", "Home page (full view)"),
          img(WEB + "taki-sitesi/mobil", 390, 844, "My Jewelry World sitesinin mobil görünümü", "My Jewelry World on a phone", "Mobil görünüm", "Mobile view")
        ],
        baglanti: "https://myjewelryworlld.wordpress.com/",
        instagram: "https://www.instagram.com/my.jewelry_worlld/",
      },
      {
        slug: "zanemoda",
        grup: "web",
        baslik: { tr: "ZaneModa", en: "ZaneModa" },
        etiket: "fashion content",
        renk: "pudra",
        kapak: { src: WEB + "zanemoda/masaustu", w: 1440, h: 900 },
        kisa: { tr: "Moda ve kombin içerikleri üzerine WordPress sitesi.", en: "A WordPress site about fashion and outfit content." },
        neYaptim: { tr: "Moda ve kombin içerikleri üzerine bir WordPress sitesi hazırladım.", en: "I built a WordPress site about fashion and outfit content." },
        araclar: ["WordPress"],
        onceSonra: null,
        gorseller: [
          img(WEB + "zanemoda/uzun", 1000, 1580, "ZaneModa ana sayfası: Tarzını keşfet başlığı, şal stilleri, renk rehberi ve kombinler", "ZaneModa home page: Discover your style header, scarf styles, colour guide and outfits", "Ana sayfa (tam görünüm)", "Home page (full view)"),
          img(WEB + "zanemoda/mobil", 390, 844, "ZaneModa sitesinin mobil görünümü", "ZaneModa on a phone", "Mobil görünüm", "Mobile view")
        ],
        baglanti: "https://zanemoda.wordpress.com/",
      },

      /* ===================== GRAFİK ANİMASYON I (Photoshop) ===================== */
      {
        slug: "history-brush",
        grup: "grafik",
        baslik: { tr: "Proje 1 – History Brush", en: "Project 1 – History Brush" },
        etiket: "history brush",
        renk: "lila",
        kapak: { src: GA + "history-brush/sonrasi", w: 1131, h: 1600 },
        kisa: { tr: "Siyah-beyaz görüntüde History Brush ile seçili alanları renklendirme.", en: "Bringing color back to selected areas of a black-and-white image with the History Brush." },
        neYaptim: { tr: "Görseli siyah-beyaza çevirdim; History Brush ile yalnız seçtiğim alanlara özgün renklerini geri getirdim.", en: "I turned the image black and white, then used the History Brush to bring back the original colors only in the areas I chose." },
        araclar: ["Photoshop", "History Brush", "History paneli", "Snapshot"],
        onceSonra: {
          once: img(GA + "history-brush/oncesi", 736, 920, "Renkli özgün çizim", "The original color illustration"),
          sonra: img(GA + "history-brush/sonrasi", 1131, 1600, "Siyah-beyaz görselde yalnız seçili karakterler renkli", "Black-and-white image with only selected characters in color")
        },
        gorseller: [
          img(GA + "history-brush/sonrasi-yatay", 800, 600, "History Brush çalışmasının yatay sonucu", "Landscape result of the History Brush work"),
          img(GA + "history-brush/history-paneli", 291, 442, "Photoshop History paneli: Snapshot ve History Brush adımları", "Photoshop History panel: snapshot and History Brush steps", "Süreç: History paneli", "Process: History panel")
        ],
        baglanti: null,
      },
      {
        slug: "urun-tanitimi",
        grup: "grafik",
        baslik: { tr: "Proje 2 – Ürün Tanıtımı", en: "Project 2 – Product Showcase" },
        etiket: "product",
        renk: "krem",
        kapak: { src: GA + "urun-tanitimi/sonrasi", w: 800, h: 600 },
        kisa: { tr: "Ürün, gölge, maskeli yansıma, parlaklık ve yazı katmanları.", en: "Product, shadow, masked reflection, highlight and text layers." },
        neYaptim: { tr: "Ürünü arka planından ayırıp yeni bir zemine yerleştirdim; gölge, maskeli yansıma, parlaklık ve yazı katmanlarıyla bir tanıtım görseli hazırladım.", en: "I cut the product out of its background and placed it on a new one, then built a showcase image with shadow, masked reflection, highlight and text layers." },
        araclar: ["Photoshop", "Katmanlar", "Katman maskesi", "Gölge", "Yansıma", "Yazı aracı"],
        onceSonra: {
          once: img(GA + "urun-tanitimi/oncesi", 1600, 1600, "Beyaz zeminde ürün fotoğrafı", "Product photo on a white background"),
          sonra: img(GA + "urun-tanitimi/sonrasi", 800, 600, "Gölge, yansıma ve yazılarla ürün tanıtım görseli", "Product showcase with shadow, reflection and text")
        },
        gorseller: [],
        baglanti: null,
      },
      {
        slug: "karakalem-renklendirme",
        grup: "grafik",
        baslik: { tr: "Proje 3 – Karakalem Renklendirme", en: "Project 3 – Coloring a Pencil Drawing" },
        etiket: "coloring",
        renk: "gul",
        kapak: { src: GA + "karakalem-renklendirme/sonrasi", w: 800, h: 600 },
        kisa: { tr: "Karakalem çizimi ayrı katmanlarda renklendirme (Multiply, Burn/Dodge).", en: "Coloring a pencil drawing on separate layers (Multiply, Burn/Dodge)." },
        neYaptim: { tr: "Karakalem bir kurbağa çizimini her renk için ayrı katmanda boyadım; Multiply karışım modu ve Burn/Dodge ile gölge ve ışık verdim.", en: "I painted a pencil drawing of a frog with a separate layer for each color, using the Multiply blend mode and Burn/Dodge for shadows and light." },
        araclar: ["Photoshop", "Multiply", "Burn / Dodge", "Katmanlar"],
        onceSonra: {
          once: img(GA + "karakalem-renklendirme/oncesi-katmanlar", 1600, 845, "Photoshop'ta renklendirme öncesi karakalem çizim", "The pencil drawing in Photoshop before coloring"),
          sonra: img(GA + "karakalem-renklendirme/sonrasi-katmanlar", 1600, 848, "Photoshop'ta ayrı katmanlarla renklendirilmiş çizim", "The drawing colored on separate layers in Photoshop")
        },
        gorseller: [
          img(GA + "karakalem-renklendirme/sonrasi", 800, 600, "Renklendirilmiş kurbağa çiziminin sonucu", "Final colored frog drawing")
        ],
        baglanti: null,
      },
      {
        slug: "smart-object",
        grup: "grafik",
        baslik: { tr: "Proje 4 – Smart Object", en: "Project 4 – Smart Object" },
        etiket: "smart object",
        renk: "inci",
        kapak: { src: GA + "smart-object/sonrasi", w: 800, h: 600 },
        kisa: { tr: "Galeri duvarındaki üç çerçeveye film afişlerini Smart Object olarak yerleştirme.", en: "Placing film posters into three frames on a gallery wall as Smart Objects." },
        neYaptim: { tr: "Boş çerçeveli bir duvar görseline Smart Object katmanları ekledim; Smart Object'in içeriğini değiştirerek üç çerçevedeki afişi birlikte güncelledim.", en: "I added Smart Object layers to a wall image with empty frames and updated the poster in all three frames at once by changing the Smart Object's contents." },
        araclar: ["Photoshop", "Smart Object"],
        onceSonra: {
          once: img(GA + "smart-object/ana-calisma-oncesi", 1600, 848, "Çerçevelerde ilk afiş", "The first poster in the frames"),
          sonra: img(GA + "smart-object/ana-calisma-sonrasi", 1600, 845, "Smart Object içeriği değiştirilince güncellenen afişler", "Posters updated after changing the Smart Object contents")
        },
        gorseller: [
          img(GA + "smart-object/bos-cerceveler", 1600, 851, "Başlangıç: boş çerçeveli duvar", "Starting point: wall with empty frames", "Başlangıç", "Starting point"),
          img(GA + "smart-object/smart-object-oncesi", 1600, 845, "Smart Object içeriği: ilk afiş", "Smart Object contents: first poster", "Smart Object içeriği", "Smart Object contents"),
          img(GA + "smart-object/smart-object-sonrasi", 1600, 848, "Smart Object içeriği: yeni afiş", "Smart Object contents: new poster", "Smart Object içeriği", "Smart Object contents")
        ],
        baglanti: null,
      },
      {
        slug: "image-stack",
        grup: "grafik",
        baslik: { tr: "Proje 5 – Image Stack", en: "Project 5 – Image Stack" },
        etiket: "image stack",
        renk: "pudra",
        kapak: { src: GA + "image-stack/sonrasi", w: 800, h: 600 },
        kisa: { tr: "Aynı açıdan çekilen çok sayıda fotoğrafı Image Stack ile birleştirerek tek, temiz bir kare elde etme.", en: "Combining many photos taken from the same angle with Image Stack into a single clean frame." },
        neYaptim: { tr: "Aynı açıdan çektiğim fotoğraf serisini katman olarak açıp Image Stack ile birleştirdim; perspektifi kırparak düzelttim.", en: "I loaded a series of photos taken from the same angle as layers, combined them with Image Stack and fixed the perspective with a crop." },
        araclar: ["Photoshop", "Image Stack", "Perspektif kırpma"],
        onceSonra: {
          once: img(GA + "image-stack/oncesi-kirpma", 1600, 851, "Perspektif kırpma öncesi fotoğraf", "Photo before the perspective crop"),
          sonra: img(GA + "image-stack/sonrasi-ekran", 1600, 848, "Image Stack ve kırpma sonrası görüntü", "Image after Image Stack and cropping")
        },
        gorseller: [
          img(GA + "image-stack/stack-sonucu", 1600, 848, "Image Stack ile birleştirilmiş katman", "Layer combined with Image Stack", "Süreç", "Process")
        ],
        baglanti: null,
      },
      {
        slug: "web-arayuzu",
        grup: "grafik",
        baslik: { tr: "Proje 6 – Web Arayüzü Hazırlama", en: "Project 6 – Designing a Web Interface" },
        etiket: "web ui",
        renk: "sampanya",
        kapak: { src: GA + "web-arayuzu/sonrasi", w: 510, h: 1600 },
        kisa: { tr: "Wome Deluxe ana sayfasının 960 grid üzerinde, Layer Comps ile üç düzende yeniden tasarımı.", en: "Redesigning the Wome Deluxe home page on a 960 grid, in three layouts with Layer Comps." },
        neYaptim: { tr: "Wome Deluxe ana sayfasını önce eskiz olarak planladım, sonra 960 grid sistemi üzerinde tasarladım; Layer Comps ile üç farklı düzen hazırladım.", en: "I planned the Wome Deluxe home page as a sketch first, designed it on the 960 grid system and prepared three different layouts with Layer Comps." },
        araclar: ["Photoshop", "960 Grid", "Layer Comps", "Katman grupları"],
        onceSonra: {
          once: img(GA + "web-arayuzu/eskiz", 1050, 1600, "Ana sayfanın eskizi (tel kafes)", "Wireframe sketch of the home page"),
          sonra: img(GA + "web-arayuzu/sonrasi", 510, 1600, "Tamamlanan ana sayfa tasarımı", "Finished home page design")
        },
        gorseller: [
          img(GA + "web-arayuzu/duzen-1", 510, 1600, "Düzen 1: özgün yerleşim", "Layout 1: original arrangement", "Düzen 1", "Layout 1"),
          img(GA + "web-arayuzu/duzen-2", 510, 1600, "Düzen 2: rezervasyon odaklı", "Layout 2: reservation-focused", "Düzen 2", "Layout 2"),
          img(GA + "web-arayuzu/duzen-3", 583, 1600, "Düzen 3: aktivite odaklı", "Layout 3: activity-focused", "Düzen 3", "Layout 3"),
          img(GA + "web-arayuzu/layer-comps", 335, 310, "Photoshop Layer Comps paneli: üç düzen", "Photoshop Layer Comps panel: three layouts", "Layer Comps", "Layer Comps"),
          img(GA + "web-arayuzu/katman-yapisi-1", 415, 581, "Katman yapısı: ana gruplar", "Layer structure: main groups", "Katman yapısı", "Layer structure"),
          img(GA + "web-arayuzu/katman-yapisi-2", 412, 577, "Katman yapısı: içerik kartları", "Layer structure: content cards", "Katman yapısı", "Layer structure"),
          img(GA + "web-arayuzu/katman-yapisi-3", 417, 607, "Katman yapısı: aktivite düzeni", "Layer structure: activity layout", "Katman yapısı", "Layer structure")
        ],
        baglanti: null,
      }
    ]
  };
})();
