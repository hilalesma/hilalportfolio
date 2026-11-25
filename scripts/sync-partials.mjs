// Ortak parçaları sayfalara yazar. İki iş yapar:
//
// 1) Header / footer: partials/*.html içeriğini her sayfadaki işaretlerin arasına yazar:
//      <!-- partial:header --> … <!-- /partial:header -->   ve   <!-- partial:footer --> … <!-- /partial:footer -->
//    - {{root}} → kök sayfalarda "", blog/ ve demos/<ad>/ içinde "../" (göreli bağlantılar)
//    - {{icons}} → satır içi SVG ikon seti (partials/icons.svg)
//    - <body data-page="…"> ile eşleşen menü bağlantısı aria-current="page" alır
//    - Ana sayfada (index.html) menü bağlantıları ayrı dosyalar yerine sayfadaki bölümlere gider
//      (ör. hakkimda.html → #hakkimda), çünkü ana sayfa tüm bölümleri tek akışta gösterir.
//
// 2) Tek akış: index.html içindeki <!-- include:dosya.html --> … <!-- /include:dosya.html -->
//    bölgelerine o dosyanın <!-- export --> … <!-- /export --> arasındaki içeriği kopyalar.
//    Bir sayfada tek <h1> olması için kopyalanan içerikteki <h1> başlıkları <h2>'ye indirilir.
//
// Sayfalar düz ve geçerli HTML olarak kalır; JavaScript gerekmez.  Çalıştırma: npm run partials
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const header = readFileSync('partials/header.html', 'utf8');
const footer = readFileSync('partials/footer.html', 'utf8');
const icons = readFileSync('partials/icons.svg', 'utf8').trim();

// Ana sayfadaki bölüm kimlikleri (menü bağlantılarının gideceği yerler)
const HOME_SECTIONS = {
  'index.html': '#vadi',
  'hakkimda.html': '#hakkimda',
  'projeler.html': '#calismalar',
  'blog.html': '#blog',
  'galeri.html': '#kareler',
  'iletisim.html': '#iletisim',
};

const pages = [];
const collect = (dir) => {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory() && dir !== '.') collect(p);
    else if (f.isFile() && f.name.endsWith('.html') && f.name !== '404.html') pages.push(p);
  }
};
collect('.');
collect('blog');
collect('demos');

const indent = (text, pad) => text.trimEnd().split('\n').map((l) => (l ? pad + l : l)).join('\n');

/** Bir sayfanın <!-- export --> bölgesini döndürür (başındaki girinti kaldırılmış). */
function exported(file) {
  const html = readFileSync(file, 'utf8');
  const m = html.match(/<!-- export[^>]*-->\r?\n([\s\S]*?)\r?\n[ \t]*<!-- \/export -->/);
  if (!m) throw new Error(`${file}: <!-- export --> işareti bulunamadı`);
  const lines = m[1].split('\n');
  const minPad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(minPad)).join('\n')
    .replace(/<h1\b/g, '<h2').replace(/<\/h1>/g, '</h2>');
}

let changed = 0;
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const depth = relative('.', file).split(sep).length - 1;
  const root = '../'.repeat(depth);
  const page = (html.match(/<body[^>]*data-page="([^"]+)"/) || [])[1];
  const isHome = file === 'index.html';
  const fill = (tpl) => {
    let out = tpl.replace('{{icons}}', icons);
    if (isHome) {
      for (const [target, anchor] of Object.entries(HOME_SECTIONS)) out = out.replaceAll(`href="{{root}}${target}"`, `href="${anchor}"`);
    }
    out = out.replaceAll('{{root}}', root);
    if (page) out = out.replace(new RegExp(`data-nav-page="${page}"`, 'g'), `data-nav-page="${page}" aria-current="page"`);
    return out;
  };
  let next = html
    .replace(/([ \t]*)<!-- partial:header -->[\s\S]*?<!-- \/partial:header -->/, (_, pad) =>
      `${pad}<!-- partial:header -->\n${indent(fill(header), pad)}\n${pad}<!-- /partial:header -->`)
    .replace(/([ \t]*)<!-- partial:footer -->[\s\S]*?<!-- \/partial:footer -->/, (_, pad) =>
      `${pad}<!-- partial:footer -->\n${indent(fill(footer), pad)}\n${pad}<!-- /partial:footer -->`);
  if (isHome) {
    next = next.replace(/([ \t]*)<!-- include:([\w.-]+) -->[\s\S]*?<!-- \/include:\2 -->/g, (_, pad, src) =>
      `${pad}<!-- include:${src} -->\n${indent(exported(src), pad)}\n${pad}<!-- /include:${src} -->`);
  }
  if (next !== html) {
    writeFileSync(file, next);
    changed++;
  }
}
console.log(`partials synced into ${changed}/${pages.length} page(s)`);
