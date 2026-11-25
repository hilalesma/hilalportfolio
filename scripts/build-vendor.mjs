// Builds vendor/three.min.js: a classic-script (IIFE) bundle of only the Three.js parts this site uses,
// exposed as window.THREE. Classic scripts also run when pages are opened directly from disk (file://),
// where ES modules are blocked. Run: node scripts/build-vendor.mjs
import { build } from 'esbuild';
import { copyFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('vendor', { recursive: true });
writeFileSync(
  'scripts/.three-entry.js',
  `export {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Vector2, Vector3, Vector4, Object3D, Group, Mesh, InstancedMesh,
  PlaneGeometry, SphereGeometry, ShapeGeometry, Shape, LatheGeometry, IcosahedronGeometry, OctahedronGeometry,
  BufferGeometry, BufferAttribute, InstancedBufferAttribute, Points, PointsMaterial, ShaderMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, MeshBasicMaterial, TextureLoader, CanvasTexture, AmbientLight, DirectionalLight, PointLight,
  HemisphereLight, PMREMGenerator, AdditiveBlending, NormalBlending, DoubleSide, FrontSide, BackSide, SRGBColorSpace,
  ACESFilmicToneMapping, NoToneMapping, Timer, MathUtils, Euler, Quaternion, Fog, LinearFilter, ClampToEdgeWrapping,
  Matrix4, Clock, CatmullRomCurve3, FogExp2, PlaneGeometry as Plane2, Float32BufferAttribute, DataTexture, RepeatWrapping, Raycaster, NearestFilter, LinearMipmapLinearFilter
} from 'three';
export { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// Son işlem (post-processing): intro vadisi için bloom, özel shader geçişi ve çıktı
export { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
export { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
export { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
export { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
`,
);
await build({
  entryPoints: ['scripts/.three-entry.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'THREE',
  target: 'es2020',
  outfile: 'vendor/three.min.js',
  legalComments: 'eof',
});
copyFileSync('node_modules/gsap/dist/gsap.min.js', 'vendor/gsap.min.js');
copyFileSync('node_modules/gsap/dist/ScrollTrigger.min.js', 'vendor/ScrollTrigger.min.js');
copyFileSync('node_modules/lenis/dist/lenis.min.js', 'vendor/lenis.min.js'); // Lenis (MIT): akıcı kaydırma, window.Lenis
console.log('vendor/ ready');
