export const FOCUS_STRENGTH = 0.6; // glow behind the active section

// Mutable values carried from GSAP / Lenis / pointer events to the render loop.
// Plain object on purpose: nothing here should re-render React.
export const motion = {
  intro: 0, // 0 -> 1 on load: clouds fade in
  logoIn: 0, // 0 -> 1: crossfade from the instant DOM logo to the 3D logo once the scene is ready
  hero: 0, // 0 -> 1 while leaving the hero
  reveal: 0, // dot field opacity 0 -> 1
  scrollY: 0, // smoothed scroll in px (from Lenis)
  velocity: 0, // Lenis velocity, for subtle stretch
  focus: { x: 0, y: 0, strength: 0 }, // NDC center of active section + glow strength
  gather: 0, // 0 = field, 1 = infinity
  draw: 0, // edge draw-on progress 0 -> 1
  flow: 0, // infinity flow offset (radians)
  flowing: true, // false under reduced motion
  lift: 0, // px scrolled past the formed ∞; it moves up with the page by this much
  mouse: { x: 0, y: 0 }, // NDC -1..1
  touch: false, // no cursor repel on touch devices
};

/** Back to the pre-scroll state, for when the home page (re)mounts. */
export function resetMotion() {
  Object.assign(motion, { intro: 0, logoIn: 0, hero: 0, reveal: 0, gather: 0, draw: 0, flow: 0, velocity: 0, lift: 0 });
  motion.focus.strength = 0;
}
