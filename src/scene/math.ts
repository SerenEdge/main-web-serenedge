// Pure geometry for the home dot field / ∞ finale and the inner-page ambient dots.
// No three.js here so it stays unit-testable.

const TAU = Math.PI * 2;

export const FIELD_SPREAD = 1.3; // field covers this multiple of the visible plane
export const INF_WIDTH = { desktop: 0.7, mobile: 0.9 };
export const INF_BAND = 0.12;
export const INF_BAND_Z = 0.15;
export const FIELD_JITTER = 0.02;
export const FIELD_Z = 0.3;

export type Rand = () => number;

/** Small seeded PRNG so the field looks the same on every load. */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lemniscate of Bernoulli. Mirrors lemniscate() in the shader chunk. */
export function lemniscate(t: number, a: number): [number, number] {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const d = 1 + s * s;
  return [(a * c) / d, (a * s * c) / d];
}

export function dotCount(width: number): number {
  if (width < 768) return 2000;
  if (width < 1024) return 3500;
  return 5000;
}

export function ambientCount(width: number): number {
  if (width < 768) return 500;
  if (width < 1024) return 900;
  return 1400;
}

/** Visible plane size at `distance` in front of a perspective camera (vertical fov in degrees). */
export function frustumSize(fovDeg: number, aspect: number, distance: number) {
  const height = 2 * distance * Math.tan((fovDeg * Math.PI) / 360);
  return { width: height * aspect, height };
}

/** Lemniscate `A` so the ∞ spans INF_WIDTH of the visible width. */
export function infinityScale(planeWidth: number, mobile: boolean): number {
  return (planeWidth * (mobile ? INF_WIDTH.mobile : INF_WIDTH.desktop)) / 2;
}

export function rectToNdc(
  rect: { left: number; top: number; width: number; height: number },
  vw: number,
  vh: number,
): { x: number; y: number } {
  return {
    x: ((rect.left + rect.width / 2) / vw) * 2 - 1,
    y: 1 - ((rect.top + rect.height / 2) / vh) * 2,
  };
}

export type DotAttributes = {
  field: Float32Array; // vec3, grid position at z≈0
  off: Float32Array; // vec3, offset from the ∞ curve
  random: Float32Array;
  t: Float32Array; // parameter on the ∞ curve
  fieldHeight: number; // vertical wrap period for scroll parallax
};

export function buildDotAttributes(count: number, plane: { width: number; height: number }, rand: Rand): DotAttributes {
  const w = plane.width * FIELD_SPREAD;
  const h = plane.height * FIELD_SPREAD;
  const cols = Math.max(1, Math.round(Math.sqrt((count * w) / h)));
  const rows = Math.ceil(count / cols);
  const sx = w / cols;
  const sy = h / rows;

  const field = new Float32Array(count * 3);
  const off = new Float32Array(count * 3);
  const random = new Float32Array(count);
  const t = new Float32Array(count);
  const j = (amount: number) => (rand() * 2 - 1) * amount;

  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    field[i * 3] = -w / 2 + sx * (cx + 0.5) + j(FIELD_JITTER);
    field[i * 3 + 1] = -h / 2 + sy * (cy + 0.5) + j(FIELD_JITTER);
    field[i * 3 + 2] = j(FIELD_Z);
    off[i * 3] = j(INF_BAND / 2);
    off[i * 3 + 1] = j(INF_BAND / 2);
    off[i * 3 + 2] = j(INF_BAND_Z);
    random[i] = rand();
    t[i] = (i / count) * TAU;
  }
  // Shuffle so grid neighbours aren't curve neighbours: the gather reads as a swarm.
  for (let i = count - 1; i > 0; i--) {
    const k = Math.floor(rand() * (i + 1));
    const tmp = t[i];
    t[i] = t[k];
    t[k] = tmp;
  }
  return { field, off, random, t, fieldHeight: h };
}

export type EdgeOptions = { neighbors: number; crossP: number; window: number; maxEdges: number };

/** Index pairs into the dot buffers plus each edge's 0..1 rank along the curve (drives draw-on). */
export function buildEdges(t: Float32Array, rand: Rand, opts: EdgeOptions) {
  const n = t.length;
  const sorted = Array.from(t.keys()).sort((a, b) => t[a] - t[b]);
  const pairs: number[] = [];
  const order: number[] = [];
  const add = (a: number, b: number) => {
    if (order.length >= opts.maxEdges) return;
    pairs.push(a, b);
    order.push(t[a] / TAU);
  };

  for (let i = 0; i < n; i++) {
    for (let k = 1; k <= opts.neighbors; k++) add(sorted[i], sorted[(i + k) % n]);
  }
  for (let i = 0; i < n; i++) {
    if (rand() >= opts.crossP) continue;
    // Candidates within ±window on the curve (wrapping), excluding the strand neighbours.
    const cand: number[] = [];
    for (const dir of [1, -1]) {
      for (let k = opts.neighbors + 1; k < n; k++) {
        const other = sorted[(((i + dir * k) % n) + n) % n];
        let d = Math.abs(t[other] - t[sorted[i]]);
        d = Math.min(d, TAU - d);
        if (d > opts.window) break;
        cand.push(other);
      }
    }
    if (cand.length) add(sorted[i], cand[Math.floor(rand() * cand.length)]);
  }
  return { pairs: Uint32Array.from(pairs), order: Float32Array.from(order) };
}
