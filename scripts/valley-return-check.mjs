// Vadiye geri dönüş için kanıt → docs/valley-return-check/
// 1) İlk ziyaret: intro → kaydırarak Hakkımda'ya çıkış → sahne kapanmaz (park).
// 2) En üste kaydırıp yukarı kaydırmaya devam edince vadiye yeniden girilir, kamera geri gider;
//    aşağı kaydırınca yeniden ilerleyip Hakkımda'ya çıkar.
// 3) Sonraki ziyaret (oturumda görüldü): yükleyici yok, canlı vadi; en üstten açılınca doğrudan keşif.
// 4) Bölüme doğrudan bağlantı (#iletisim): sayfa kilitlenmez, vadi parkta.
// 1440×900 masaüstü (tekerlek) ve 390×844 dokunmatik (parmak sürükleme).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/valley-return-check';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = {};
const info = (page) => page.evaluate(() => ({ phase: HE.valley && HE.valley.phase(), t: +(HE.valley ? HE.valley.state.t : 0).toFixed(3), scrollY: Math.round(scrollY),
  looping: HE.valley && HE.valley.looping(), canvas: !!document.querySelector('.valley__canvas') }));
const wheel = async (page, dy, n, gap = 60) => { for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await page.waitForTimeout(gap); } };
// çıkış başlayana kadar ileri kaydır, sonra 1,4 sn daha kesintisiz kaydır (touchpad / tekerlek ataleti gibi)
const wheelToExit = async (page) => {
  for (let i = 0; i < 80; i++) {
    await page.mouse.wheel(0, 160); await page.waitForTimeout(40);
    if (await page.evaluate(() => HE.valley.phase() !== 'explore')) break;
  }
  // atalet: sayfanın içinden 16 ms arayla 1,6 sn tekerlek olayı (yazılımla çizimde Playwright'ın
  // tekerleği çok yavaş kalır; gerçek touchpad ataleti bu hızdadır)
  await page.evaluate(async () => {
    const t0 = performance.now();
    while (performance.now() - t0 < 1600) {
      document.querySelector('main').dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true, clientX: 720, clientY: 450 }));
      await new Promise((r) => setTimeout(r, 16));
    }
  });
};
const aboutTop = (page) => page.evaluate(() => Math.round(document.querySelector('#hakkimda').getBoundingClientRect().top));

// --- masaüstü ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const r = {};
  await page.goto(`${base}/index.html?intro=1`);
  await page.waitForFunction(() => HE.valley && HE.valley.phase() === 'explore', null, { timeout: 60000 });
  r.afterIntro = await info(page);
  await page.mouse.move(720, 450);
  await wheelToExit(page);                              // ileri kaydır → Hakkımda (+ atalet)
  await page.waitForFunction(() => HE.valley.phase() === 'docked', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  r.docked = { ...(await info(page)), aboutTop: await aboutTop(page) };
  // en üste kaydır (normal sayfa kaydırması)
  await page.evaluate(() => HE.scrollTo(0, { immediate: true, offset: 0 }));
  await page.waitForTimeout(800);
  r.atTopBeforeEnter = await info(page);
  await page.screenshot({ path: `${out}/1440-1-ustte-park.png` });
  await wheel(page, -120, 3);                           // en üstte yukarı kaydırmaya devam → vadiye gir
  await page.waitForTimeout(400);
  r.reentered = await info(page);
  await wheel(page, -160, 20, 50);                      // geri git
  await page.waitForTimeout(1200);
  r.rewound = await info(page);
  await page.screenshot({ path: `${out}/1440-2-geri-gidis.png` });
  await wheelToExit(page);                              // yeniden ileri → Hakkımda (+ atalet)
  await page.waitForFunction(() => HE.valley.phase() === 'docked', null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  r.exitAgain = { ...(await info(page)), aboutTop: await aboutTop(page) };
  await page.screenshot({ path: `${out}/1440-3-yeniden-hakkimda.png` });

  // sonraki ziyaret (aynı oturum): yükleyici yok, canlı vadi, doğrudan keşif
  await page.goto(`${base}/index.html`);
  await page.waitForFunction(() => HE.valley && HE.valley.phase() !== 'loading', null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  r.revisit = await page.evaluate(() => ({ introPlay: HE.introPlay, loaderVisible: getComputedStyle(document.querySelector('.valley-loader')).display !== 'none', phase: HE.valley.phase(), canvas: !!document.querySelector('.valley__canvas') }));
  await page.screenshot({ path: `${out}/1440-4-sonraki-ziyaret.png` });

  // doğrudan bölüm bağlantısı: kilit yok, vadi parkta (önce boş sayfa: yalnız # değişirse sayfa yeniden yüklenmez)
  await page.goto('about:blank');
  await page.goto(`${base}/index.html#iletisim`);
  await page.waitForFunction(() => HE.valley && HE.valley.phase() !== 'loading', null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  r.deepLink = await info(page);
  r.errors = errors;
  report.desktop = r;
  await ctx.close();
}

// --- mobil (dokunma) ---
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const r = {};
  await page.goto(`${base}/index.html#hakkimda`);
  await page.waitForFunction(() => HE.valley && HE.valley.phase() === 'docked', null, { timeout: 60000 });
  await page.evaluate(() => HE.scrollTo(0, { immediate: true, offset: 0 }));
  await page.waitForTimeout(700);
  const swipe = async (fromY, toY) => {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: fromY }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: fromY + (toY - fromY) * i / 8 }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe(300, 600);                                // parmak aşağı: en üstte → vadiye gir
  await page.waitForTimeout(300);
  r.reentered = await info(page);
  for (let i = 0; i < 4; i++) { await swipe(250, 650); await page.waitForTimeout(80); }   // geri git
  await page.waitForTimeout(1000);
  r.rewound = await info(page);
  await page.screenshot({ path: `${out}/390-geri-gidis.png` });
  r.errors = errors;
  report.mobile = r;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
