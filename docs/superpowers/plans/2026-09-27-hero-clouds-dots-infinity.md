# Implementation Plan: Cloud Hero, Scroll-Driven Dot Field, Infinity Network Finale

This document is a build spec for a coding agent. The website is already built and working. This plan adds a 3D motion layer on top of it without rewriting existing components.

The target feel is inspired by the scroll-driven Three.js style of skyclinics.al. Everything here is an original implementation. Do not copy code, shaders, images or any other assets from that site.

---

## 0. What we are building (summary)

1. **Hero:** soft 3D clouds float and drift around the viewport. They react gently to the mouse. **No mountain.** The site logo sits between the clouds, with some clouds in front of it and some behind, plus a headline, a short subline and a CTA.
2. **Scroll:** scrolling down flies the camera up through the clouds. The clouds thin out and a dotted background fades in. It is tinted with **the site's own light blue**.
3. **Sections:** all existing sections scroll over the dot field. The dots respond *lightly*: slow drift, a soft glow behind the section in view, and a gentle repel around the cursor. Section content reveals with a restrained fade-up.
4. **Finale (just before the footer):** a pinned section. All dots gather into an **infinity sign (∞)**, then edges draw on between neighboring dots, forming a connected node network. The shape then flows slowly along itself. After that the footer scrolls in normally.
5. **About, Services, Contact pages:** a separate, calm background layer of distant, low-opacity brand-blue dots that float slowly in 3D depth. These pages get **no** hover animations, **no** scroll-triggered animations, **no** smooth-scroll or pinning. Only the background moves (see section 14).

---

## 1. Step zero: audit the existing project (agent must do this first)

Before writing code, the agent must inspect the repo and record the answers at the top of its working notes:

- **Framework:** Next.js (App Router or Pages), Vite + React, or something else. Also the React version, because it decides the React Three Fiber version (see section 2).
- **Styling system:** Tailwind, CSS modules, styled-components, etc.
- **Brand light blue:** find the existing color token (CSS variable, Tailwind theme color or design-tokens file). **Use that exact value.** Do not invent a new blue. Save it as `--brand-blue` if it is not already a variable.
- **Logo:** find the logo file. An SVG is preferred. If only a PNG exists, it must be at least 1024px wide.
- **Home page section list:** list every section component on the home page, in order, from the hero down to the footer.
- **Existing scroll or animation libraries:** check for any already installed (framer-motion, AOS, locomotive-scroll, etc.). Remove or disable anything that conflicts with Lenis or ScrollTrigger on the home page only.
- **Existing hero:** find the current hero component. It will be replaced, and its copy (headline, subline, CTA) reused.
- **Inner pages:** find the routes and page components for About, Services and Contact, and how they share a layout (Next.js route group or layout, React Router layout route, or a shared wrapper component).

If the framework is not React-based, follow the same architecture with vanilla Three.js. The shaders and math in this doc stay the same.

---

## 2. Packages

```bash
npm i three @react-three/fiber @react-three/drei gsap @gsap/react lenis
npm i -D @types/three   # if TypeScript
```

| Package | Purpose |
|---|---|
| `three` | WebGL engine |
| `@react-three/fiber` | React renderer for Three.js. Use **v9 with React 19**, **v8 with React 18** |
| `@react-three/drei` | Helpers: `Clouds`, `Cloud`, `Image`, `useTexture`, `AdaptiveDpr`, `PerformanceMonitor` |
| `gsap` | Timelines, plus the `ScrollTrigger` and `SplitText` plugins (all free, including commercially) |
| `@gsap/react` | `useGSAP` hook for correct cleanup in React |
| `lenis` | Smooth scrolling synced with ScrollTrigger |

Pin exact versions in `package.json` after installing.

---

## 3. Architecture

```
<body>
 ├─ <SmoothScroll>                  Lenis + GSAP ticker (home page only)
 │   ├─ <Scene3D/>                  ONE fixed full-screen <Canvas>, z-index 0, pointer-events none
 │   │    ├─ <HeroClouds/>          back layer + front layer of clouds
 │   │    ├─ <LogoPlane/>           logo as a textured plane between the cloud layers
 │   │    ├─ <DotField/>            THREE.Points, custom shader (field -> infinity)
 │   │    └─ <InfinityEdges/>       THREE.LineSegments, same shader logic, edges draw on
 │   └─ <main> (z-index 1)          existing DOM sections, transparent backgrounds
 │        ├─ <HeroOverlay/>         headline, subline, CTA (DOM, accessible)
 │        ├─ ...existing sections   wrapped with data-section + data-reveal
 │        ├─ <InfinityFinale/>      pinned spacer section that drives the finale
 │        └─ <Footer/>
```

Key rules:

- **Use exactly one WebGL canvas** for the whole home page. It is `position: fixed; inset: 0; z-index: 0; pointer-events: none`.
- The DOM is on top (`position: relative; z-index: 1`). Section backgrounds must be **transparent** so the dots show through. If a card needs a background, use a semi-transparent surface, for example `background: rgb(255 255 255 / 0.65); backdrop-filter: blur(8px)`.
- A **scroll store** (a plain mutable object, not React state) carries values from GSAP to the render loop. Nothing re-renders React on scroll.

```ts
// src/motion/scrollStore.ts
export const motion = {
  hero: 0,        // 0 -> 1 while leaving the hero
  reveal: 0,      // dot field opacity 0 -> 1
  scrollY: 0,     // smoothed scroll in px (from Lenis)
  velocity: 0,    // Lenis velocity, for subtle stretch
  focus: { x: 0, y: 0, strength: 0 }, // NDC center of active section + glow strength
  gather: 0,      // 0 = field, 1 = infinity
  draw: 0,        // edge draw-on progress 0 -> 1
  flow: 0,        // infinity flow offset (radians)
  mouse: { x: 0, y: 0 }, // NDC -1..1
};
```

### Next.js specifics

- Any file that uses R3F, GSAP or Lenis gets `"use client"`.
- Load `Scene3D` with `dynamic(() => import(...), { ssr: false })`.
- Mount `SmoothScroll` and `Scene3D` only on the home route.

---

## 4. Smooth scroll + ScrollTrigger setup

```tsx
// src/motion/SmoothScroll.tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { motion } from "./scrollStore";

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // native scroll, animations jump to end states (see section 10)

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on("scroll", (e: any) => {
      motion.scrollY = e.scroll;
      motion.velocity = e.velocity;
      ScrollTrigger.update();
    });
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return <>{children}</>;
}
```

---

## 5. Hero: floating clouds, logo between them, no mountain

### 5.1 Look

- **Sky:** a CSS gradient on the page behind the canvas (the canvas uses `alpha: true`). Top: `--brand-blue`. Bottom: near-white, or a very pale tint of the brand blue. **No mountain, terrain or ground mesh.**
- **Clouds:** white with a very slight blue tint in the shadows. They are soft and volumetric-looking and drift slowly.
- **Logo:** centered, slightly above the middle, at depth `z = 0`. It sits between a **back cloud layer** (`z` from -6 to -1) and a **sparse front cloud layer** (`z` from 1 to 4). Wisps pass in front of it without hiding it.
- **Text:** the headline, a one-line subline and one CTA are DOM elements (for accessibility and SEO), placed below the logo. Reuse the copy from the current hero.

### 5.2 Clouds with drei

```tsx
// src/scene/HeroClouds.tsx
import * as THREE from "three";
import { Clouds, Cloud } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { motion } from "@/motion/scrollStore";

export function HeroClouds() {
  const back = useRef<THREE.Group>(null!);
  const front = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    // gentle mouse parallax (front moves more than back)
    const mx = motion.mouse.x, my = motion.mouse.y;
    back.current.position.x += (mx * 0.3 - back.current.position.x) * 0.03;
    back.current.position.y += (my * 0.2 - back.current.position.y) * 0.03;
    front.current.position.x += (mx * 0.8 - front.current.position.x) * 0.04;
    front.current.position.y += (my * 0.5 - front.current.position.y) * 0.04;
    // slow continuous rotation so clouds "hover around"
    back.current.rotation.z += dt * 0.004;
    front.current.rotation.z -= dt * 0.006;
    // fade + scatter as we leave the hero
    const h = motion.hero;
    front.current.scale.setScalar(1 + h * 0.6);
    back.current.visible = front.current.visible = h < 0.999;
  });

  return (
    <Clouds material={THREE.MeshLambertMaterial} limit={300}>
      <group ref={back}>
        <Cloud seed={1} segments={30} bounds={[9, 2, 2]} volume={7} position={[0, -1, -4]} color="#eef5ff" speed={0.15} growth={3} opacity={0.9} />
        <Cloud seed={2} segments={20} bounds={[5, 2, 1]} volume={5} position={[-6, 2, -3]} color="#ffffff" speed={0.1} opacity={0.8} />
        <Cloud seed={3} segments={20} bounds={[5, 2, 1]} volume={5} position={[6, 1.5, -3]} color="#ffffff" speed={0.12} opacity={0.8} />
      </group>
      <group ref={front}>
        <Cloud seed={4} segments={12} bounds={[4, 1, 1]} volume={3} position={[-4, -2.2, 2]} color="#ffffff" speed={0.2} opacity={0.55} />
        <Cloud seed={5} segments={10} bounds={[3, 1, 1]} volume={3} position={[4.5, -1.8, 2.5]} color="#ffffff" speed={0.18} opacity={0.5} />
      </group>
    </Clouds>
  );
}
```

Lighting inside `Scene3D`: `<ambientLight intensity={1.2} />` plus a `<directionalLight position={[2, 5, 3]} intensity={1.5} color="#ffffff" />`, and optionally a weak second light tinted with the brand blue from below.

Tune `segments`, `volume` and `opacity` visually. The front layer must stay sparse so the logo reads clearly. The logo is the one memorable element of the hero, so keep everything around it quiet.

### 5.3 Logo plane

```tsx
// src/scene/LogoPlane.tsx
import { Image } from "@react-three/drei"; // or a plane + useTexture for SVG rasterized to PNG
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { motion } from "@/motion/scrollStore";

export function LogoPlane() {
  const ref = useRef<any>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current.position.y = 0.6 + Math.sin(t * 0.6) * 0.08; // soft hover
    ref.current.material.opacity = 1 - motion.hero * 1.4;
    ref.current.scale.setScalar(3 * (1 + motion.hero * 0.3));
  });
  return <Image ref={ref} url="/logo-hero.png" transparent position={[0, 0.6, 0]} scale={3} />;
}
```

If the logo is an SVG, export a crisp 2048px PNG with a transparent background for the texture. Keep the SVG for the DOM elsewhere.

### 5.4 Hero exit timeline (scroll)

The hero section in the DOM is `min-height: 100vh`. Pin it for an extra 100% of viewport height:

```ts
gsap.timeline({
  scrollTrigger: { trigger: "#hero", start: "top top", end: "+=100%", scrub: true, pin: true },
})
  .to(motion, { hero: 1, ease: "none" }, 0)
  .to(motion, { reveal: 1, ease: "none" }, 0.4)   // dots fade in during the second half
  .to("#hero-overlay", { opacity: 0, y: -40, ease: "none" }, 0);
```

In `useFrame`, the camera moves forward and slightly up with `motion.hero`: `camera.position.z = 8 - hero * 9; camera.position.y = hero * 1.5;`. This flies the camera through the clouds, and they pass on both sides.

### 5.5 Hero intro (on load, once)

After the textures load (`useProgress` from drei reaches 100), run a single orchestrated moment:
- the clouds fade from opacity 0 while the camera eases from `z = 12` to `z = 8` over 1.8s with `expo.out`;
- the logo fades and scales from 0.9 to 1;
- the headline is split into lines with `SplitText`, and each line reveals with `yPercent: 100 → 0` inside an overflow-hidden mask, with a `0.08` stagger and `power4.out`;
- the subline and CTA fade in last.

Do not add any other entrance animations to the hero.

---

## 6. Dot field (brand light blue)

### 6.1 Geometry

- **Count:** 5000 on desktop, 2000 on mobile (`window.innerWidth < 768`), 3500 on tablets.
- **`aField`** (vec3): a regular grid covering about 1.3 times the viewport in world units at `z = 0`. Add a tiny jitter (±0.02) so it doesn't look mechanical, and a small random `z` in ±0.3 for depth.
- **`aRandom`** (float): uniform in 0 to 1. Used for stagger, twinkle and drift phase.
- **`aT`** (float): the particle's parameter on the infinity curve. Evenly spaced from 0 to 2π, then shuffled so that neighbors on the grid are not neighbors on the curve. The shuffle makes the gather look like a swarm rather than a slide.
- **`aOff`** (vec3): a small offset from the curve, giving the ∞ a band thickness of about 0.12 world units, with `z` in ±0.15.

### 6.2 Infinity math (lemniscate of Bernoulli)

```
x(t) = A · cos t / (1 + sin² t)
y(t) = A · sin t · cos t / (1 + sin² t)
```

`A` (the `uScale` uniform) is set so the ∞ spans about 70% of viewport width on desktop and 90% on mobile. It is recomputed on resize from the camera frustum width at `z = 0`.

### 6.3 Shaders

```glsl
// dot.vert
uniform float uTime, uReveal, uGather, uFlow, uScale, uSize, uPixelRatio, uScrollY, uFieldH, uVelocity;
uniform vec2  uMouse;       // world xy at z=0
uniform vec3  uFocus;       // xy = world center of active section, z = strength 0..1
attribute vec3 aField;
attribute vec3 aOff;
attribute float aRandom, aT;
varying float vAlpha, vGlow;

vec3 lemniscate(float t) {
  float s = sin(t), c = cos(t), d = 1.0 + s * s;
  return vec3(uScale * c / d, uScale * s * c / d, 0.0);
}

void main() {
  // 1. field position with slow drift and scroll parallax (wraps vertically)
  vec3 f = aField;
  f.x += sin(uTime * 0.15 + aRandom * 6.2831) * 0.03;
  f.y += cos(uTime * 0.12 + aRandom * 12.0) * 0.03;
  f.y = mod(f.y + uScrollY * 0.0015 + uFieldH * 0.5, uFieldH) - uFieldH * 0.5;
  f.y += uVelocity * 0.0004 * aRandom; // tiny stretch when scrolling fast

  // 2. gentle cursor repel (only in field state)
  vec2 d = f.xy - uMouse;
  float rep = smoothstep(0.9, 0.0, length(d));
  f.xy += normalize(d + 1e-4) * rep * 0.12;

  // 3. infinity target, flowing along the curve
  vec3 inf = lemniscate(aT + uFlow) + aOff;

  // 4. staggered gather
  float g = smoothstep(0.0, 1.0, clamp(uGather * 1.5 - aRandom * 0.5, 0.0, 1.0));
  vec3 p = mix(f, inf, g);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float tw = 0.85 + 0.15 * sin(uTime * 1.3 + aRandom * 20.0);
  gl_PointSize = uSize * uPixelRatio * tw * mix(1.0, 1.35, g) * (1.0 / -mv.z);

  // glow behind the active section
  vGlow = uFocus.z * smoothstep(2.2, 0.0, length(f.xy - uFocus.xy)) * (1.0 - g);
  vAlpha = uReveal * mix(0.35, 0.95, g);
}
```

```glsl
// dot.frag
uniform vec3 uColor;      // brand light blue (linear)
uniform vec3 uGlowColor;  // slightly lighter or more saturated brand blue
varying float vAlpha, vGlow;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.2, r);
  vec3 col = mix(uColor, uGlowColor, vGlow);
  gl_FragColor = vec4(col, soft * (vAlpha + vGlow * 0.35));
}
```

Material settings: `transparent: true, depthWrite: false`. Blending is `NormalBlending` on a light background. On a dark background, switch to `AdditiveBlending`.

**Color:** `uColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--brand-blue').trim())`. If the page background is light, the dots may need to be one step deeper than the brand's lightest blue to stay visible. Adjust lightness in HSL only, and keep the same hue.

### 6.4 Render loop wiring

```ts
useFrame(({ clock, camera, viewport }) => {
  const u = material.uniforms;
  u.uTime.value = clock.elapsedTime;
  u.uReveal.value = motion.reveal;
  u.uScrollY.value = motion.scrollY;
  u.uVelocity.value += (motion.velocity - u.uVelocity.value) * 0.1;
  u.uGather.value = motion.gather;
  u.uFlow.value = motion.flow;
  u.uMouse.value.set(motion.mouse.x * viewport.width / 2, motion.mouse.y * viewport.height / 2);
  u.uFocus.value.lerp(new THREE.Vector3(
    motion.focus.x * viewport.width / 2, motion.focus.y * viewport.height / 2, motion.focus.strength), 0.06);
});
```

Update the mouse from a `pointermove` listener on `window` that writes NDC into `motion.mouse`.

---

## 7. Existing sections: light integration with the dots

Motion must stay subtle. The dots are the background, not the show. Apply the following to every existing home section except the hero and the finale.

1. **Mark up:** add `data-section` to each section wrapper and `data-reveal` to its direct content blocks (heading, text block, card group). Do not change component internals beyond making backgrounds transparent or semi-transparent.
2. **Content reveal (one pattern, used everywhere):**
   ```ts
   gsap.set("[data-reveal]", { opacity: 0, y: 24 });
   ScrollTrigger.batch("[data-reveal]", {
     start: "top 85%",
     once: true,
     onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }),
   });
   ```
3. **Dot glow behind the active section:** for each `[data-section]`, add a ScrollTrigger with `start: "top center", end: "bottom center"`. While it is active, write the section's center (converted to NDC from `getBoundingClientRect()`) into `motion.focus` and tween `motion.focus.strength` to `0.6`. On leave, tween it to `0`. The effect: dots behind the section in view brighten softly.
4. **Cursor repel:** already handled globally in the shader (section 6.3). No per-component work is needed.
5. **Do not** add parallax, tilt or hover animation to every card. Keep existing hover states as they are.

---

## 8. Finale: dots gather into ∞ and connect

### 8.1 DOM

Insert a new section directly **before the footer**:

```tsx
<section id="infinity-finale" className="relative h-screen">
  <div id="finale-copy" className="absolute inset-x-0 bottom-[12vh] text-center opacity-0">
    {/* one short line + optional CTA; reuse site voice, write copy with the site owner */}
  </div>
</section>
```

### 8.2 Edge geometry (`InfinityEdges`)

Build edges once at init, in JS:

1. Sort the particle indices by `aT`.
2. Connect each particle to the next 2 particles in that sorted order. This gives the continuous strands along the curve.
3. Add cross-links: for each particle, with a probability of 0.25, connect it to one random particle whose `aT` is within ±0.08 rad. This makes the band read as a network, not just parallel lines.
4. Cap the total edges at about 2.5 × the particle count. Use fewer on mobile.

Every line vertex stores the attributes of **its endpoint particle** (`aField`, `aOff`, `aRandom`, `aT`), so the lines follow the dots exactly. Each vertex also gets **`aOrder`**: the edge's normalized rank along the curve (its sorted `aT` divided by 2π). This drives the draw-on effect.

Edge vertex shader: reuse the dot vertex logic for position (extract it into a shared GLSL chunk), then:

```glsl
varying float vEdge;
// after computing p and g:
vEdge = g * smoothstep(aOrder - 0.05, aOrder, uDraw);
```

Edge fragment shader:

```glsl
uniform vec3 uColor; uniform float uEdgeOpacity;
varying float vEdge;
void main() { gl_FragColor = vec4(uColor, vEdge * uEdgeOpacity); } // uEdgeOpacity ~0.35
```

Lines render at 1px, which suits a delicate network look. Do not use fat lines.

### 8.3 Finale timeline

```ts
const tl = gsap.timeline({
  scrollTrigger: { trigger: "#infinity-finale", start: "top top", end: "+=220%", scrub: 1, pin: true },
});
tl.to(motion, { gather: 1, ease: "none", duration: 0.55 }, 0)
  .to(motion, { draw: 1, ease: "none", duration: 0.35 }, 0.5)
  .to(motion.focus, { strength: 0, duration: 0.1 }, 0)
  .to("#finale-copy", { opacity: 1, y: 0, duration: 0.15 }, 0.85);
```

After the gather, `motion.flow` advances by itself in `useFrame` (`motion.flow += dt * 0.12 * motion.draw`), so the ∞ keeps flowing slowly while the user reads. Scrolling back up reverses everything, because the timeline is scrubbed.

### 8.4 Hand-off to the footer

When the pin ends, the footer scrolls up over the canvas. Give the footer a solid background. Optionally, fade `motion.reveal` to 0.4 as the footer enters, so the ∞ dims behind it.

---

## 9. Scroll map (single source of truth)

| Scroll zone | Trigger | Values driven |
|---|---|---|
| Page load | textures loaded | intro timeline (camera, clouds, logo, headline) |
| Hero pinned, +100% | `#hero` | `hero` 0→1, `reveal` 0→1, overlay fades out |
| Each existing section | `[data-section]` | `focus.x/y/strength`, content batch reveal |
| Finale pinned, +220% | `#infinity-finale` | `gather` 0→1, `draw` 0→1, copy fades in, `flow` runs |
| Footer | normal scroll | optional `reveal` dim |

---

## 10. Performance and accessibility (required)

- **DPR:** `<Canvas dpr={[1, 1.75]} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}>` plus drei `<AdaptiveDpr pixelated />` and `<PerformanceMonitor>`. If performance drops, reduce the cloud `segments` and the dot count.
- **Frame loop:** pause rendering when the tab is hidden (`frameloop="demand"` with invalidation, or stop on `visibilitychange`).
- **Mobile:** use fewer dots, fewer clouds (back layer only) and fewer edges, and turn off cursor repel on touch devices.
- **Reduced motion:** if `prefers-reduced-motion: reduce`, do not use Lenis, pinning or the hero fly-through. Show the hero statically with clouds but no drift. Show the dot field at a fixed `reveal = 1`. Show the finale already formed (`gather = 1, draw = 1`) with no flow.
- **Precompile:** call `gl.compile(scene, camera)` after load to avoid a stutter on first scroll.
- **Resize:** recompute the field grid extents, `uScale` and `uPixelRatio`, then call `ScrollTrigger.refresh()`.
- **Accessibility:** the canvas is `aria-hidden="true"`. All real content stays in the DOM. Keyboard focus styles are unchanged. Text contrast on top of the dots must still pass WCAG AA.
- **Cleanup:** every ScrollTrigger is created inside `useGSAP` (or killed in effect cleanup) so client-side navigation does not leak triggers.

---

## 11. File structure

```
src/
  motion/
    scrollStore.ts
    SmoothScroll.tsx
    useHeroTimeline.ts
    useSectionFocus.ts
    useFinaleTimeline.ts
  scene/
    Scene3D.tsx          // Canvas, lights, camera rig, mounts the layers below
    CameraRig.tsx        // hero fly-through + mouse sway
    HeroClouds.tsx
    LogoPlane.tsx
    DotField.tsx         // builds attributes, owns the shared uniforms
    InfinityEdges.tsx    // builds edges from DotField's attribute buffers
    shaders/
      common.glsl        // lemniscate() + shared position logic
      dot.vert / dot.frag
      edge.vert / edge.frag
  components/home/
    HeroOverlay.tsx      // DOM headline, subline, CTA
    InfinityFinale.tsx
  ambient/
    AmbientBackground.tsx  // client-only Canvas for About/Services/Contact
    AmbientDots.tsx        // Points + slow drift, no scroll, no pointer input
    shaders/ambient.vert / ambient.frag
```

`DotField` and `InfinityEdges` must share **the same uniform objects** (pass them through context or a module), so one update drives both.

---

## 12. Build order with acceptance checks

1. **Audit** (section 1). *Done when:* notes list the framework, React version, brand blue hex, logo path and section order.
2. **Scaffold** the canvas, SmoothScroll and scrollStore on the home route only. *Done when:* the page scrolls smoothly and other routes are untouched.
3. **Hero clouds + logo + overlay**, with the intro. *Done when:* there is no mountain, clouds drift and respond to the mouse, the logo reads clearly between the cloud layers, and the headline reveals once.
4. **Hero exit**. *Done when:* scrolling flies the camera through the clouds and the dots fade in by the end of the pin.
5. **Dot field** in brand blue with drift, twinkle, scroll parallax and cursor repel. *Done when:* the dots stay subtle behind all sections and text stays readable.
6. **Section integration** (transparent backgrounds, `data-reveal`, focus glow). *Done when:* every section reveals with the same restrained motion and the dots glow softly behind the section in view.
7. **Finale:** gather into ∞, then edges draw on, then flow. *Done when:* scrubbing forward and backward is smooth, the ∞ fits on mobile, and the footer follows cleanly.
8. **Performance + reduced motion + resize** pass. *Done when:* a mid-range laptop holds about 60fps, a phone holds at least 45fps, and the reduced-motion mode shows static end states.
9. **Inner pages ambient background** (section 14). *Done when:* About, Services and Contact show distant drifting dots behind their content, nothing on those pages animates on scroll or hover, and navigating between them does not restart the background.

---

## 13. Tuning knobs (expose as constants at the top of each file)

| Knob | Default | Effect |
|---|---|---|
| `DOT_COUNT` | 5000 / 2000 mobile | density |
| `DOT_SIZE` | 22 | point size before perspective |
| `FIELD_ALPHA` | 0.35 | dot opacity in the background state |
| `REPEL_RADIUS` / `REPEL_FORCE` | 0.9 / 0.12 | cursor interaction |
| `FOCUS_STRENGTH` | 0.6 | glow behind the active section |
| `INF_WIDTH` | 0.7 of viewport (0.9 mobile) | size of the ∞ |
| `INF_BAND` | 0.12 | thickness of the ∞ band |
| `EDGE_NEIGHBORS` / `EDGE_CROSS_P` | 2 / 0.25 | network density |
| `EDGE_OPACITY` | 0.35 | line strength |
| `FLOW_SPEED` | 0.12 rad/s | ∞ flow after forming |

---

## 14. Inner pages: About, Services, Contact (ambient background only)

### 14.1 Scope rules (strict)

- On these three pages, **only a background layer is added**.
- **No** hover animations, no cursor interaction with the dots, no scroll-triggered reveals, no pinning, no Lenis smooth scroll, and nothing tied to scroll position. Content scrolls natively and is visible immediately.
- Existing components stay as they are. The only change is making section backgrounds transparent or semi-transparent so the dots show through. Form inputs on Contact keep solid backgrounds for readability.

### 14.2 Look

Distant, faint dots float in deep 3D space far behind the content, like dust drifting in light far behind a window. They move slowly on their own and never compete with the text.

- **Color:** the same `--brand-blue` token as the home page.
- **Opacity:** individual dots range from about 0.05 to 0.25. Distant dots are smaller and fainter.
- **Background:** the site's normal page background, not the home hero's sky gradient.
- **No clouds, no ∞, no connecting lines** on these pages.

### 14.3 Mounting

- Put one `<AmbientBackground/>` in a **shared layout** used only by About, Services and Contact:
  - Next.js App Router: a route group such as `app/(pages)/layout.tsx` wrapping `about`, `services` and `contact`.
  - Next.js Pages Router: an `InnerLayout` component used by those three pages.
  - React Router: a layout route with an `<Outlet/>`.
- Because it lives in the shared layout, the background **stays mounted** when moving between these pages, so it does not restart or flash.
- The canvas is `position: fixed; inset: 0; z-index: 0; pointer-events: none;` with `aria-hidden="true"`, and is loaded client-only (`dynamic(..., { ssr: false })` in Next.js).
- The home page `Scene3D` and this canvas must never be mounted together. Only one WebGL context should exist at a time.

### 14.4 Particles

- **Count:** 1400 on desktop, 900 on tablets, 500 on mobile.
- **Camera:** `fov 50` at `z = 0`, looking down negative z.
- **Positions:** random inside a box. `x` spans ±1.2 × the frustum width at the far depth, `y` spans ±1.2 × the frustum height, and `z` runs from **-10 to -40**. Nothing is closer than `z = -10`, so every dot reads as distant.
- **Attributes:** `aRandom` (0 to 1) and `aSpeed` (0.3 to 1).

```glsl
// ambient.vert
uniform float uTime, uSize, uPixelRatio, uOpacity;
attribute float aRandom, aSpeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime * 0.05 * aSpeed;
  p.x += sin(t + aRandom * 6.2831) * 0.8;
  p.y += cos(t * 0.8 + aRandom * 12.0) * 0.6;
  p.z += sin(t * 0.6 + aRandom * 3.0) * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  gl_PointSize = uSize * uPixelRatio * (1.0 / depth);
  float fog = smoothstep(42.0, 10.0, depth);            // farther = fainter
  float tw  = 0.75 + 0.25 * sin(uTime * 0.6 + aRandom * 30.0);
  vAlpha = uOpacity * fog * tw;
}
```

```glsl
// ambient.frag
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.15, r) * vAlpha);
}
```

Suggested values are `uSize = 90` and `uOpacity = 0.25`. Tune them until the dots feel present but ignorable.

**Depth motion:** in `useFrame`, rotate the whole points group very slowly: `group.rotation.y += dt * 0.01; group.rotation.x = Math.sin(t * 0.05) * 0.05;`. Because the dots sit at different depths, near and far dots shift at different rates, which gives natural parallax and a sense of distance without any scroll or mouse input.

**Entry:** on first mount, tween `uOpacity` from 0 to its target over 1.2s. This is the only animated transition on these pages.

### 14.5 Performance and accessibility

- `dpr={[1, 1.5]}`, `antialias: false`, `alpha: true`.
- The motion is slow, so cap rendering at about 30fps: use `frameloop="demand"` and call `invalidate()` from a 33ms interval. Stop rendering when the tab is hidden.
- **Reduced motion:** render a single static frame with `uTime` fixed, and skip the fade-in.
- Check that text contrast on all three pages still passes WCAG AA over the dots.

### 14.6 Done when

- All three pages show faint, distant, slowly drifting brand-blue dots behind their content.
- Nothing on these pages animates on hover or scroll.
- Navigating between About, Services and Contact keeps the background running without a restart.
- Going to or from the home page swaps cleanly between the two canvases, with no double WebGL context.

---

## 15. Prompt to give the coding agent

> Implement `hero-clouds-dots-infinity-plan.md` in this repo. Start with section 1 (audit) and report your findings before changing any code. Use the site's existing light blue token for all dot and edge colors. Apply sections 3 to 10 to the home page only, and section 14 to About, Services and Contact only. On those three pages add only the ambient background: no hover, scroll or reveal animations. Do not touch any other pages. Keep existing components intact apart from making their backgrounds transparent and adding `data-section` / `data-reveal` attributes. Follow the build order in section 12, and verify each step's "done when" check before moving on. Do not copy code, shaders or assets from skyclinics.al. Everything must be original.
