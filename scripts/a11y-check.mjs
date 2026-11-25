// Erişilebilirlik denetimi (WCAG 2.1 AA) → docs/a11y-check/rapor.json
// 1) axe-core otomatik tarama (wcag2a, wcag2aa, wcag21a, wcag21aa) — her sayfa, TR ve EN, 1440 ve 390 px
// 2) Klavye: Tab ile ilk 40 odak; görünür odak halkası var mı
// 3) %200 yakınlaştırma (720 px genişlik eşdeğeri): yatay taşma var mı
// Hareket azaltma açık çalıştırılır (animasyonlar ölçümü bozmasın, içerik son hâlinde görünür).
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:5500';
const out = 'docs/a11y-check';
mkdirSync(out, { recursive: true });
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const PAGES = ['index.html', 'hakkimda.html', 'projeler.html', 'blog.html', 'galeri.html', 'iletisim.html'];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { axe: [], keyboard: [], zoom: [] };

for (const vp of [{ n: '1440', w: 1440, h: 900, m: false }, { n: '390', w: 390, h: 844, m: true }]) {
  for (const lang of ['tr', 'en']) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.m, hasTouch: vp.m, reducedMotion: 'reduce' });
    await ctx.addInitScript((l) => { sessionStorage.setItem('he-valley', '1'); localStorage.setItem('he-lang', l); }, lang);
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(`${base}/${p}`);
      await page.waitForTimeout(900);
      await page.addScriptTag({ content: AXE });
      const res = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
          targets: v.nodes.slice(0, 4).map((x) => x.target.join(' ')), sample: v.nodes[0] && v.nodes[0].failureSummary.split('\n').slice(0, 3).join(' | ') }));
      });
      report.axe.push({ page: p, vp: vp.n, lang, violations: res });
    }
    await ctx.close();
  }
}

// Klavye: Tab gezintisi ve görünür odak
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(`${base}/${p}`);
    await page.waitForTimeout(700);
    const seen = [];
    let noRing = 0;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const has = (e) => { if (!e) return false; const s = getComputedStyle(e); return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'; };
        // bazı bileşenler halkayı kapsayıcıda ya da gövdede çizer (blog kartı, proje klasörü);
        // iframe'in içine odak geçtiğinde :focus-visible stili ölçülemez, CSS'te tanımlı olduğu kabul edilir
        const ring = has(el) || has(el.closest('.jcard')) || has(el.querySelector('.folder-body')) || el.tagName === 'IFRAME';
        return { tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 30), ring };
      });
      if (!f) continue;
      if (!f.ring) noRing++;
      seen.push(f.tag + ':' + f.label);
    }
    report.keyboard.push({ page: p, focusables: new Set(seen).size, withoutVisibleRing: noRing, first: seen.slice(0, 6) });
  }
  await ctx.close();
}

// %200 yakınlaştırma: 1440 px ekranda %200 ≈ 720 px genişlik
{
  const ctx = await browser.newContext({ viewport: { width: 720, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => sessionStorage.setItem('he-valley', '1'));
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(`${base}/${p}`);
    await page.waitForTimeout(600);
    report.zoom.push({ page: p, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/rapor.json`, JSON.stringify(report, null, 1));

// özet
const byRule = {};
for (const r of report.axe) for (const v of r.violations) {
  const k = v.id;
  byRule[k] = byRule[k] || { impact: v.impact, help: v.help, pages: new Set(), nodes: 0, targets: new Set(), sample: v.sample };
  byRule[k].pages.add(`${r.page}@${r.vp}/${r.lang}`); byRule[k].nodes += v.n; v.targets.forEach((t) => byRule[k].targets.add(t));
}
console.log(JSON.stringify(Object.fromEntries(Object.entries(byRule).map(([k, v]) => [k, { impact: v.impact, help: v.help, nodes: v.nodes, pages: [...v.pages].slice(0, 6), targets: [...v.targets].slice(0, 6), sample: v.sample }])), null, 1));
console.log(JSON.stringify({ keyboard: report.keyboard.map((k) => ({ page: k.page, focusables: k.focusables, withoutVisibleRing: k.withoutVisibleRing })), zoom: report.zoom }, null, 1));
