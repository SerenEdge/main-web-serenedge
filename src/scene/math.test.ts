import { describe, expect, it } from "vitest";
import {
  ambientCount,
  buildDotAttributes,
  buildEdges,
  dotCount,
  frustumSize,
  infinityScale,
  lemniscate,
  mulberry32,
  rectToNdc,
} from "./math";

const TAU = Math.PI * 2;

describe("lemniscate", () => {
  it("passes through the origin at the crossing and reaches ±A at the lobe tips", () => {
    const [x0, y0] = lemniscate(0, 3);
    expect(x0).toBeCloseTo(3);
    expect(y0).toBeCloseTo(0);
    const [xm, ym] = lemniscate(Math.PI / 2, 3);
    expect(xm).toBeCloseTo(0);
    expect(ym).toBeCloseTo(0);
    const [xp] = lemniscate(Math.PI, 3);
    expect(xp).toBeCloseTo(-3);
  });

  it("stays within x ∈ [-A, A] and is wider than tall", () => {
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < 400; i++) {
      const [x, y] = lemniscate((i / 400) * TAU, 2);
      maxX = Math.max(maxX, Math.abs(x));
      maxY = Math.max(maxY, Math.abs(y));
    }
    expect(maxX).toBeLessThanOrEqual(2 + 1e-9);
    expect(maxY).toBeLessThan(maxX / 2);
  });
});

describe("counts", () => {
  it("scales the home dot count by viewport width", () => {
    expect(dotCount(375)).toBe(2000);
    expect(dotCount(900)).toBe(3500);
    expect(dotCount(1440)).toBe(5000);
  });

  it("scales the ambient dot count by viewport width", () => {
    expect(ambientCount(375)).toBe(500);
    expect(ambientCount(900)).toBe(900);
    expect(ambientCount(1440)).toBe(1400);
  });
});

describe("frustumSize", () => {
  it("returns the visible plane size at a distance for a vertical fov", () => {
    const { width, height } = frustumSize(90, 2, 1);
    expect(height).toBeCloseTo(2);
    expect(width).toBeCloseTo(4);
  });
});

describe("infinityScale", () => {
  it("spans 70% of the width on desktop and 90% on mobile", () => {
    expect(infinityScale(10, false) * 2).toBeCloseTo(7);
    expect(infinityScale(10, true) * 2).toBeCloseTo(9);
  });
});

describe("rectToNdc", () => {
  it("maps a rect's center to normalized device coordinates (y up)", () => {
    expect(rectToNdc({ left: 0, top: 0, width: 100, height: 100 }, 100, 100)).toEqual({ x: 0, y: 0 });
    const p = rectToNdc({ left: 0, top: 0, width: 50, height: 50 }, 100, 100);
    expect(p.x).toBeCloseTo(-0.5);
    expect(p.y).toBeCloseTo(0.5);
  });
});

describe("buildDotAttributes", () => {
  const plane = { width: 10, height: 6 };
  const a = buildDotAttributes(1000, plane, mulberry32(1));

  it("sizes every attribute buffer to the dot count", () => {
    expect(a.field.length).toBe(3000);
    expect(a.off.length).toBe(3000);
    expect(a.random.length).toBe(1000);
    expect(a.t.length).toBe(1000);
  });

  it("lays the field out over about 1.3x the plane", () => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < 1000; i++) {
      minX = Math.min(minX, a.field[i * 3]);
      maxX = Math.max(maxX, a.field[i * 3]);
      minY = Math.min(minY, a.field[i * 3 + 1]);
      maxY = Math.max(maxY, a.field[i * 3 + 1]);
      expect(Math.abs(a.field[i * 3 + 2])).toBeLessThanOrEqual(0.3);
    }
    expect(maxX - minX).toBeGreaterThan(12);
    expect(maxX - minX).toBeLessThan(13.2);
    expect(maxY - minY).toBeGreaterThan(7.2);
    expect(maxY - minY).toBeLessThan(8);
    expect(a.fieldHeight).toBeCloseTo(7.8);
  });

  it("spreads curve parameters evenly over 0..2π but shuffled", () => {
    const sorted = Array.from(a.t).sort((x, y) => x - y);
    expect(sorted[0]).toBeCloseTo(0);
    expect(sorted[999]).toBeCloseTo((TAU * 999) / 1000);
    let inOrder = 0;
    for (let i = 1; i < 1000; i++) if (a.t[i] > a.t[i - 1]) inOrder++;
    expect(inOrder).toBeLessThan(700);
  });

  it("keeps curve offsets inside the band", () => {
    for (let i = 0; i < 1000; i++) {
      expect(Math.abs(a.off[i * 3])).toBeLessThanOrEqual(0.06);
      expect(Math.abs(a.off[i * 3 + 1])).toBeLessThanOrEqual(0.06);
      expect(Math.abs(a.off[i * 3 + 2])).toBeLessThanOrEqual(0.15);
    }
  });

  it("is deterministic for the same seed", () => {
    const b = buildDotAttributes(1000, plane, mulberry32(1));
    expect(Array.from(b.t)).toEqual(Array.from(a.t));
  });
});

describe("buildEdges", () => {
  const n = 500;
  const t = buildDotAttributes(n, { width: 10, height: 6 }, mulberry32(7)).t;
  const e = buildEdges(t, mulberry32(3), { neighbors: 2, crossP: 0.25, window: 0.08, maxEdges: Math.round(n * 2.5) });

  it("connects every dot to its next two neighbours along the curve", () => {
    const sorted = Array.from(t.keys()).sort((i, j) => t[i] - t[j]);
    const keys = new Set<string>();
    for (let k = 0; k < e.pairs.length; k += 2) keys.add(`${e.pairs[k]}-${e.pairs[k + 1]}`);
    for (let i = 0; i < n; i++) {
      expect(keys.has(`${sorted[i]}-${sorted[(i + 1) % n]}`)).toBe(true);
      expect(keys.has(`${sorted[i]}-${sorted[(i + 2) % n]}`)).toBe(true);
    }
  });

  it("adds cross-links only between dots close on the curve", () => {
    const edges = e.pairs.length / 2;
    expect(edges).toBeGreaterThan(n * 2);
    for (let k = 0; k < e.pairs.length; k += 2) {
      let d = Math.abs(t[e.pairs[k]] - t[e.pairs[k + 1]]);
      d = Math.min(d, TAU - d);
      expect(d).toBeLessThanOrEqual(0.08 + 1e-9);
      expect(e.pairs[k]).not.toBe(e.pairs[k + 1]);
    }
  });

  it("caps the edge count", () => {
    const capped = buildEdges(t, mulberry32(3), { neighbors: 2, crossP: 1, window: 0.08, maxEdges: 600 });
    expect(capped.pairs.length / 2).toBe(600);
    expect(capped.order.length).toBe(600);
  });

  it("orders each edge by its position along the curve, normalized to 0..1", () => {
    for (const o of e.order) {
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThan(1);
    }
  });
});
