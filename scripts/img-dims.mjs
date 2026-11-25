// Adds missing width/height attributes to local <img> tags (prevents layout shift, CLS).
// Usage: node scripts/img-dims.mjs file1.html file2.html …
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

for (const file of process.argv.slice(2)) {
  let html = readFileSync(file, 'utf8');
  const tags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => !/\bwidth=/.test(t));
  for (const tag of tags) {
    const src = (tag.match(/\bsrc="([^"]+)"/) || [])[1];
    if (!src || /^https?:/.test(src)) continue;
    const path = join(dirname(file), src);
    if (!existsSync(path)) continue;
    const { width, height } = await sharp(path).metadata();
    html = html.replace(tag, tag.replace('<img ', `<img width="${width}" height="${height}" `));
  }
  writeFileSync(file, html);
  console.log(`${file}: ${tags.length} image(s) checked`);
}
