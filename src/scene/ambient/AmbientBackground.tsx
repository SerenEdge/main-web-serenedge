"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { brandColor } from "../DotField";
import { ambientCount, frustumSize, mulberry32 } from "../math";
import { ambientFrag, ambientVert } from "../shaders";

const FOV = 50;
const Z_NEAR = 10;
const Z_FAR = 40;
const SIZE = 90;
const OPACITY = 0.25;
const FPS_MS = 33; // the drift is slow; ~30fps is plenty

// Module-level: one ambient canvas at a time, and render-loop writes stay outside React.
const ambientUniforms = {
  uTime: { value: 0 },
  uSize: { value: SIZE },
  uPixelRatio: { value: 1 },
  uOpacity: { value: 0 },
  uColor: { value: new THREE.Color() },
};
// Passed as constructor args: R3F props would not keep `uniforms` as this shared object.
const AMBIENT_MATERIAL = {
  uniforms: ambientUniforms,
  vertexShader: ambientVert,
  fragmentShader: ambientFrag,
  transparent: true,
  depthWrite: false,
};

function AmbientDots({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const { size, viewport } = useThree();
  const count = ambientCount(size.width);
  const aspect = size.width / size.height;

  const geometry = useMemo(() => {
    const rand = mulberry32(11);
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const depth = Z_NEAR + rand() * (Z_FAR - Z_NEAR);
      // Spread 1.2x the visible frustum at each dot's own depth, so on-screen density is even.
      const f = frustumSize(FOV, aspect, depth);
      pos[i * 3] = (rand() - 0.5) * f.width * 1.2;
      pos[i * 3 + 1] = (rand() - 0.5) * f.height * 1.2;
      pos[i * 3 + 2] = -depth;
      rnd[i] = rand();
      speed[i] = 0.3 + rand() * 0.7;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRandom", new THREE.BufferAttribute(rnd, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    return g;
  }, [count, aspect]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    ambientUniforms.uColor.value.copy(brandColor());
  }, []);
  useEffect(() => {
    ambientUniforms.uPixelRatio.value = viewport.dpr;
  }, [viewport.dpr]);

  // The only animated transition on these pages: a 1.2s fade in on first mount.
  useEffect(() => {
    const u = ambientUniforms.uOpacity;
    if (still) {
      u.value = OPACITY;
      return;
    }
    u.value = 0;
    const tw = gsap.to(u, { value: OPACITY, duration: 1.2, ease: "power2.out" });
    return () => {
      tw.kill();
    };
  }, [still]);

  useFrame(({ clock }) => {
    if (still) return;
    const t = clock.elapsedTime;
    ambientUniforms.uTime.value = t;
    // Slow sway, not a continuous spin: a spin would carry the dots out of frame over time.
    group.current.rotation.y = Math.sin(t * 0.02) * 0.08;
    group.current.rotation.x = Math.sin(t * 0.05) * 0.05;
  });

  return (
    <group ref={group}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial args={[AMBIENT_MATERIAL]} />
      </points>
    </group>
  );
}

/** ~30fps driver for frameloop="demand"; stops while the tab is hidden. */
function Throttle({ still }: { still: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (still) {
      invalidate();
      return;
    }
    let id: number | undefined;
    const start = () => {
      if (id === undefined) id = window.setInterval(() => invalidate(), FPS_MS);
    };
    const stop = () => {
      window.clearInterval(id);
      id = undefined;
    };
    const onVis = () => (document.visibilityState === "hidden" ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [invalidate, still]);
  return null;
}

export default function AmbientBackground({ still }: { still: boolean }) {
  return (
    <Canvas
      aria-hidden="true"
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100lvh", zIndex: 0, pointerEvents: "none" }}
      dpr={[1, 1.5]}
      frameloop="demand"
      camera={{ fov: FOV, position: [0, 0, 0], near: 0.1, far: 100 }}
      gl={{ antialias: false, alpha: true }}
    >
      <AmbientDots still={still} />
      <Throttle still={still} />
    </Canvas>
  );
}
