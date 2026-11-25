// Joins numbered screenshots into one overview image: node scripts/contact-sheet.mjs <pattern-with-{i}> <count> <out> <tileW> <tileH>
// e.g. node scripts/contact-sheet.mjs docs/intro-check/intro-1440-{i}s.png 6 docs/intro-check/contact-sheet-1440.png 480 300
import sharp from 'sharp';

const [pattern, count, out, tw = '480', th = '300'] = process.argv.slice(2);
const n = Number(count);
const w = Number(tw);
const h = Number(th);
const cols = 3;
const rows = Math.ceil(n / cols);
const tiles = await Promise.all(
  Array.from({ length: n }, (_, i) => sharp(pattern.replace('{i}', String(i))).resize(w, h).png().toBuffer()),
);
await sharp({ create: { width: cols * w + (cols - 1) * 10, height: rows * h + (rows - 1) * 10, channels: 3, background: '#222222' } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * (w + 10), top: Math.floor(i / cols) * (h + 10) })))
  .png()
  .toFile(out);
console.log(out);
