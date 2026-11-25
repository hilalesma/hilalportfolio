// Vize raporu için ekran görüntüleri → docs/rapor-shots/
// Masaüstü (1440×900): her sayfanın önemli bölümleri; mobil (390×844): her sayfanın açılışı.
// Ana sayfanın vadisi canlı (yazılımla WebGL); diğer bölümler hareket azaltma ile (içerik son hâlinde).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/rapor-shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const list = [];

async function shot(page, name, caption, sel, offset = -80) {
  if (sel) {
    await page.evaluate(([s, o]) => { const el = document.querySelector(s); if (el) HE.scrollTo(el, { immediate: true, offset: o }); }, [sel, offset]);
    await page.waitForTimeout(900);
  }
  await page.screenshot({ path: `${out}/${name}.png` });
  list.push({ file: `${name}.png`, caption });
}

// 1) Ana sayfa: canlı vadi (oturumda görüldü → yükleyici yok)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  await page.goto(`${base}/index.html`);
  await page.waitForFunction(() => window.HE && HE.valley && HE.valley.phase() !== 'loading', null, { timeout: 90000 }).catch(() => {});
  await page.mouse.move(700, 420);
  await page.waitForTimeout(2500);
  await shot(page, '01-ana-sayfa-vadi', 'Ana sayfa: gece çiçek vadisi girişi (Three.js), ad ve kısa tanıtım');
  await ctx.close();
}

// 2) Bütün sayfalar, hareket azaltma ile
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
const page = await ctx.newPage();
const go = async (p) => { await page.goto(`${base}/${p}`); await page.waitForTimeout(1200); };

await go('index.html#hakkimda');
await shot(page, '02-ana-sayfa-hakkimda', 'Ana sayfa: Hakkımda yazısının bir bölümü', '#hakkimda', 0);
await shot(page, '03-ana-sayfa-projeler', 'Ana sayfa: projelerin kısa tanıtımları (klasör destesi)', '#calismalar');
await shot(page, '04-ana-sayfa-galeri', 'Ana sayfa: galeri fotoğraflarından örnekler ("Hayatımdan kareler")', '#kareler');
await shot(page, '05-ana-sayfa-atolye', 'Ana sayfa: Mini Takı Atölyesi ve ruh haline göre plak çalar', '.extras', -60);
await shot(page, '06-ana-sayfa-blog-iletisim', 'Ana sayfa: blog önizlemesi', '#blog');

await go('hakkimda.html');
await shot(page, '07-hakkimda-ust', 'Hakkımda: vesikalık fotoğraf ve özgeçmiş özeti');
await shot(page, '08-hakkimda-deneyim', 'Hakkımda: eğitim ve iş deneyimi (sıralı liste)', '#deneyim-title', -120);
await shot(page, '09-hakkimda-yetenekler', 'Hakkımda: yüzdeli yetenek çubukları (<meter>, sıralı liste)', '#yetenekler');
await shot(page, '10-hakkimda-ilgi-kod', 'Hakkımda: kod köşesi — blockquote, pre ve code etiketleri', '#kod-title', -260);
await shot(page, '11-hakkimda-ders-programi', 'Hakkımda: ders programı tablosu', '#ders-title', -100);

await go('projeler.html');
await shot(page, '12-projeler-raf', 'Projeler: Grafik Animasyon I ve WordPress projeleri, "dosya klasörü" rafı');
await page.evaluate(() => HE.projects && HE.projects.open && HE.projects.open('karakalem-renklendirme'));
await page.waitForTimeout(1200);
await shot(page, '13-projeler-detay', 'Projeler: açılan klasör — görseller, önce/sonra kaydırıcısı ve kısa açıklama');

await go('blog.html');
await shot(page, '14-blog-liste', 'Blog: başlık, giriş, kategori filtresi ve 3 yazı kartı');
await shot(page, '15-blog-yazi', 'Blog: yazı 1 — adım adım açıklama ve ekran görüntüleri', '#layer-comps-960-grid', -20);
await shot(page, '16-blog-rozet', 'Blog: yazı 3 — karşılaştırma tablosu ve cam rozetler (okuma süresi, tarih, araçlar)', '#iki-wordpress-sitesi .compare', -200);

await go('galeri.html');
await shot(page, '17-galeri', 'Galeri: kategorili fotoğraflar ve kısa açıklamaları');

await go('iletisim.html');
await shot(page, '18-iletisim', 'İletişim: adres, telefon ve iletişim formu');

// İngilizce örnek
await page.evaluate(() => document.querySelector('[data-set-lang="en"]').click());
await page.waitForTimeout(600);
await shot(page, '19-iletisim-en', 'İletişim (EN): dil değiştirici ile İngilizce görünüm');
await page.evaluate(() => document.querySelector('[data-set-lang="tr"]').click());
await ctx.close();

// 3) Mobil (390 px) açılışlar
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await m.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
const mp = await m.newPage();
for (const [p, label] of [['index.html#hakkimda', 'Ana sayfa'], ['hakkimda.html', 'Hakkımda'], ['projeler.html', 'Projeler'], ['blog.html', 'Blog'], ['galeri.html', 'Galeri'], ['iletisim.html', 'İletişim']]) {
  await mp.goto(`${base}/${p}`);
  await mp.waitForTimeout(1200);
  const name = 'm-' + p.split('.')[0];
  await mp.screenshot({ path: `${out}/${name}.png` });
  list.push({ file: `${name}.png`, caption: `${label} — telefon (390 px)`, mobile: true });
}
await m.close();
await browser.close();
writeFileSync(`${out}/liste.json`, JSON.stringify(list, null, 1));
console.log(list.length, 'görüntü');
