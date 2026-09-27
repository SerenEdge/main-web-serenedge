"use client";

import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { motion } from "./store";

const TEXTURE = "/img/cloud-puff.webp";

/** Fades every cloud material in a <Clouds> group (drei multiplies material opacity into each puff). */
function setGroupOpacity(group: THREE.Group, opacity: number) {
  group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && "opacity" in m) m.opacity = opacity;
  });
}

/**
 * Far layer (z -11..-9) for depth, back layer (z -5..-3) behind the logo, a sparse front layer (z 2..3) in front of it.
 * Unlit material so the clouds stay clean white instead of shading grey.
 * Separate <Clouds> per layer so each sorts as a unit against the logo via renderOrder.
 */
export function HeroClouds({ still, mobile, spread }: { still: boolean; mobile: boolean; spread: number }) {
  const far = useRef<THREE.Group>(null!);
  const back = useRef<THREE.Group>(null!);
  const front = useRef<THREE.Group>(null!);
  const s = still ? 0 : 1;

  useFrame((_, dt) => {
    const mx = motion.mouse.x;
    const my = motion.mouse.y;
    const b = back.current;
    const f = front.current;
    // gentle mouse parallax (front moves more than back)
    b.position.x += (mx * 0.3 - b.position.x) * 0.03;
    b.position.y += (my * 0.2 - b.position.y) * 0.03;
    if (f) {
      f.position.x += (mx * 0.8 - f.position.x) * 0.04;
      f.position.y += (my * 0.5 - f.position.y) * 0.04;
    }
    // slow continuous rotation so clouds hover around
    if (!still) {
      b.rotation.z += dt * 0.004;
      if (f) f.rotation.z -= dt * 0.006;
    }
    // fade + scatter as we leave the hero
    const h = motion.hero;
    const visible = h < 0.999 && motion.intro > 0;
    const fade = motion.intro * (1 - THREE.MathUtils.smoothstep(h, 0.35, 0.95));
    setGroupOpacity(b, fade);
    b.visible = visible;
    setGroupOpacity(far.current, fade);
    far.current.visible = visible;
    far.current.position.x += (mx * 0.12 - far.current.position.x) * 0.02;
    if (f) {
      f.scale.setScalar(1 + h * 0.6);
      setGroupOpacity(f, fade);
      f.visible = visible;
    }
  });

  // Three depths: soft grey-blue clouds far back, clean white corner banks behind the logo,
  // and thin wisps drifting across in front of it. The centre stays readable.
  const x = (v: number) => v * spread;
  const vol = (v: number) => v * (mobile ? 0.6 : 1);
  return (
    <>
      <Clouds ref={far} texture={TEXTURE} material={THREE.MeshBasicMaterial} limit={80} renderOrder={0}>
        <Cloud seed={8} segments={mobile ? 8 : 14} bounds={[6, 1.2, 1]} volume={vol(5)} position={[x(-5), 1.8, -9]} color="#cfd8e4" speed={0.06 * s} opacity={0.7} />
        <Cloud seed={9} segments={mobile ? 8 : 14} bounds={[6, 1.2, 1]} volume={vol(5)} position={[x(6), 2.4, -10]} color="#d3dbe6" speed={0.05 * s} opacity={0.65} />
        <Cloud seed={10} segments={mobile ? 8 : 12} bounds={[12, 1.4, 1]} volume={vol(6)} position={[0, -1.6, -11]} color="#c9d3e0" speed={0.05 * s} opacity={0.6} />
      </Clouds>
      <Clouds ref={back} texture={TEXTURE} material={THREE.MeshBasicMaterial} limit={200} renderOrder={1}>
        <Cloud seed={1} segments={mobile ? 12 : 22} bounds={[5, 1.6, 1.5]} volume={vol(5)} position={[x(-7), -3.2, -3]} color="#ffffff" speed={0.12 * s} growth={2} opacity={0.95} />
        <Cloud seed={2} segments={mobile ? 12 : 22} bounds={[5, 1.6, 1.5]} volume={vol(5)} position={[x(7), -3, -3]} color="#ffffff" speed={0.1 * s} growth={2} opacity={0.95} />
        <Cloud seed={3} segments={mobile ? 10 : 18} bounds={[10, 1.2, 1]} volume={vol(5)} position={[0, -5.4, -5]} color="#ffffff" speed={0.08 * s} opacity={0.9} />
        <Cloud seed={6} segments={8} bounds={[3, 0.8, 1]} volume={vol(3)} position={[x(-8.5), 3.6, -5]} color="#ffffff" speed={0.1 * s} opacity={0.75} />
        <Cloud seed={7} segments={8} bounds={[3, 0.8, 1]} volume={vol(3)} position={[x(8.5), 3.3, -5]} color="#ffffff" speed={0.1 * s} opacity={0.75} />
      </Clouds>
      <Clouds ref={front} texture={TEXTURE} material={THREE.MeshBasicMaterial} limit={60} renderOrder={3}>
        {/* wisps across the logo: low opacity so it always reads through them */}
        <Cloud seed={11} segments={4} bounds={[1.4, 0.2, 0.3]} volume={vol(0.7)} position={[x(-1.9), -0.05, 2.4]} color="#ffffff" speed={0.25 * s} opacity={0.2} />
        <Cloud seed={12} segments={3} bounds={[1.1, 0.2, 0.3]} volume={vol(0.6)} position={[x(2.1), 1.55, 2]} color="#ffffff" speed={0.22 * s} opacity={0.16} />
        {!mobile && (
          <>
            <Cloud seed={4} segments={10} bounds={[3, 0.8, 1]} volume={2.5} position={[-4.6, -2.8, 2]} color="#ffffff" speed={0.2 * s} opacity={0.6} />
            <Cloud seed={5} segments={10} bounds={[3, 0.8, 1]} volume={2.5} position={[4.8, -2.7, 2.5]} color="#ffffff" speed={0.18 * s} opacity={0.55} />
          </>
        )}
      </Clouds>
    </>
  );
}
