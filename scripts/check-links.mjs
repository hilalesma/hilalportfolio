// Checks every local href/src/srcset in the site's HTML pages (root, blog/, demos/):
// the target file must exist, and "#id" anchors must exist on the target page
// (folder anchors on projeler.html are button ids, so they count too).  Run: npm run links
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';

const pages = [];
const walk = (dir, deep) => {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory() && deep && !['node_modules', '_arsiv', 'docs', '.claude', 'partials'].includes(f.name)) walk(p, true);
    else if (f.isFile() && f.name.endsWith('.html')) pages.push(p);
  }
};
walk('.', false);
if (existsSync('blog')) walk('blog', true);     // blog yazıları artık blog.html içinde; klasör yeniden eklenirse denetlenir
if (existsSync('demos')) walk('demos', true);   // demolar şu an arşivde; yeniden eklenirse denetlenir

const idsCache = new Map();
const ids = (file) => {
  if (!idsCache.has(file)) {
    const set = new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    // projeler.html#<slug>: klasörler data/projeler.js'ten üretilir; slug'lar geçerli hedeftir
    if (/projeler\.html$/.test(file) && existsSync('data/projeler.js')) {
      for (const m of readFileSync('data/projeler.js', 'utf8').matchAll(/slug:\s*"([^"]+)"/g)) set.add(m[1]);
    }
    idsCache.set(file, set);
  }
  return idsCache.get(file);
};

let checked = 0;
const problems = [];
for (const page of pages) {
  // yorumları ve <pre> kod örneklerini atla (gerçek bağlantı değiller)
  const html = readFileSync(page, 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/<pre[\s\S]*?<\/pre>/g, '');
  const urls = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const s of html.matchAll(/\ssrcset="([^"]+)"/g)) urls.push(...s[1].split(',').map((x) => x.trim().split(/\s+/)[0]));
  for (const url of urls) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url) || url.startsWith('//')) continue;
    checked++;
    const [path, hash] = url.split('#');
    let target = page;
    if (path) {
      target = path.startsWith('/') ? normalize('.' + path) : normalize(join(dirname(page), decodeURI(path)));
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
      if (!existsSync(target)) { problems.push(`BROKEN  ${url}  (in ${page})`); continue; }
    }
    if (hash && target.endsWith('.html') && !ids(target).has(hash)) problems.push(`NO #${hash}  (${url} in ${page})`);
  }
}
console.log(problems.join('\n') || '');
console.log(`${pages.length} pages, ${checked} local links checked, ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
