// Converts the raw files in assets/originals into the names CLAUDE.md expects.
// Only lossless-intent operations: format conversion and cropping. No retouching.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const o = (f) => `assets/originals/${f}`;
const args = process.argv.slice(2);

if (args[0] === 'meta') {
  for (const f of ['hilal-esma-portrait.webp', 'intro-laptop-scene.webp', '03-projects-folders.webp', '04-blog-glass.webp']) {
    const m = await sharp(o(f)).metadata();
    console.log(f, m.width, m.height);
  }
  process.exit(0);
}

mkdirSync('assets/photos', { recursive: true });
mkdirSync('assets/intro', { recursive: true });
mkdirSync('assets/references', { recursive: true });

await sharp(o('hilal-esma-portrait.webp')).jpeg({ quality: 95, mozjpeg: true }).toFile('assets/photos/hilal-esma-portrait.jpg');

// Intro: the source is a phone screenshot of a photo viewer. Crop away the viewer UI
// ("AI modified" badge, lens button, rounded screenshot corners) at the bottom edge only.
const intro = sharp(o('intro-laptop-scene.webp'));
const im = await intro.metadata();
// Default crop measured on the 1008×1178 source: removes the 14px viewer frame and the bottom UI strip.
const crop = JSON.parse(process.env.INTRO_CROP ?? 'null') ??
  (im.width === 1008 && im.height === 1178
    ? { left: 14, top: 0, width: 980, height: 1020 }
    : { left: 0, top: 0, width: im.width, height: im.height });
await sharp(o('intro-laptop-scene.webp')).extract(crop).jpeg({ quality: 95, mozjpeg: true }).toFile('assets/intro/intro-laptop-scene.jpg');

// Open Graph image (1200×630) cropped from the intro scene, centred on the laptop screen
mkdirSync('public', { recursive: true });
await sharp('assets/intro/intro-laptop-scene.jpg')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og.jpg');

// Paper grain tile (static noise; replaces a CPU-heavy feTurbulence filter)
mkdirSync('public/textures', { recursive: true });
{
  const s = 180;
  const px = Buffer.alloc(s * s * 4);
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < s * s; i++) {
    const v = rnd();
    px[i * 4] = 115;
    px[i * 4 + 1] = 92;
    px[i * 4 + 2] = 77;
    px[i * 4 + 3] = Math.round(Math.pow(v, 2.2) * 70);
  }
  await sharp(px, { raw: { width: s, height: s, channels: 4 } }).png({ compressionLevel: 9 }).toFile('public/textures/paper-grain.png');
}

await sharp(o('03-projects-folders.webp')).png().toFile('assets/references/03-projects-folders.png');
await sharp(o('04-blog-glass.webp')).png().toFile('assets/references/04-blog-glass.png');
console.log('done', crop);
