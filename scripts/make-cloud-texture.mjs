// Generates public/img/cloud-puff.png: a soft white puff with a noisy edge,
// used as the sprite for the hero's drei <Clouds>. Run: node scripts/make-cloud-texture.mjs
import sharp from "sharp";

const SIZE = 256;

// Seeded value noise, a few octaves.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const G = 64;
const grid = Array.from({ length: G * G }, rand);
const smooth = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = smooth(x - x0), fy = smooth(y - y0);
  const v = (i, j) => grid[(((j % G) + G) % G) * G + (((i % G) + G) % G)];
  const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * fx;
  const b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * fx;
  return a + (b - a) * fy;
}
function fbm(x, y) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 5; o++) {
    s += amp * noise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return s;
}

const px = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE - 0.5, v = y / SIZE - 0.5;
    const r = Math.hypot(u, v) * 2; // 0 center, 1 edge
    const n = fbm(x / 24, y / 24);
    const edge = Math.min(1, Math.max(0, (1 - r * (0.75 + 0.55 * n)) * 1.6));
    const a = Math.pow(edge, 1.6);
    const shade = 235 + 20 * n; // faint internal variation
    const i = (y * SIZE + x) * 4;
    px[i] = px[i + 1] = px[i + 2] = Math.min(255, Math.round(shade));
    px[i + 3] = Math.round(a * 255);
  }
}

await sharp(px, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .png()
  .toFile(new URL("../public/img/cloud-puff.png", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
console.log("wrote public/img/cloud-puff.png");
