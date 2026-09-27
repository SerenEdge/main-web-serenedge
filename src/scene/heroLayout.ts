// Hero framing shared by the 3D scene and the instant DOM logo. No three.js here:
// the DOM side is in the main bundle, the scene is lazy-loaded.

export const FOV = 50;
export const DIST = 8; // camera to dot plane, and camera to logo at rest
export const LOGO_Y = 0.75; // world units above centre
export const LOGO_MAX_W = 3.4; // world units
export const LOGO_VW = 0.62; // never wider than this share of the viewport
export const LOGO_URL = "/img/logo-hero.webp"; // 1200x665, transparent
export const LOGO_ASPECT = 665 / 1200;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Logo opacity during the hero exit: holds for the first half, then fades as the next section arrives. */
export const logoExitFade = (hero: number) => 1 - smoothstep(0.55, 0.95, hero);

/** CSS box matching the 3D logo on the 100lvh fixed canvas (camera at rest, no mouse sway). */
export function logoCss() {
  const planeH = 2 * DIST * Math.tan((FOV * Math.PI) / 360);
  const pct = (n: number) => Number(n.toFixed(3));
  return {
    top: `${pct(50 - (LOGO_Y / planeH) * 100)}lvh`,
    width: `min(${pct((LOGO_MAX_W / planeH) * 100)}lvh, ${LOGO_VW * 100}%)`,
  };
}
