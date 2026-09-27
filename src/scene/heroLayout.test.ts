import { describe, expect, it } from "vitest";
import { DIST, FOV, LOGO_Y, logoCss, logoExitFade } from "./heroLayout";

describe("logoCss", () => {
  it("places the DOM logo where the 3D logo renders on a 100lvh canvas", () => {
    const planeH = 2 * DIST * Math.tan((FOV * Math.PI) / 360);
    const css = logoCss();
    const pct = (n: number) => Number(n.toFixed(3));
    expect(css.top).toBe(`${pct(50 - (LOGO_Y / planeH) * 100)}lvh`);
    expect(css.width).toBe(`min(${pct((3.4 / planeH) * 100)}lvh, 62%)`);
  });
});

describe("logoExitFade", () => {
  it("holds the logo through the first half of the hero exit, then fades it out", () => {
    expect(logoExitFade(0)).toBe(1);
    expect(logoExitFade(0.5)).toBe(1);
    expect(logoExitFade(0.75)).toBeGreaterThan(0);
    expect(logoExitFade(0.75)).toBeLessThan(1);
    expect(logoExitFade(1)).toBe(0);
  });
});
