"use client";

import { Cloud, Clouds } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { motion } from "./store";

const TEXTURE = "/img/cloud-puff.png";

/** Fades every cloud material in a <Clouds> group (drei multiplies material opacity into each puff). */
function setGroupOpacity(group: THREE.Group, opacity: number) {
  group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && "opacity" in m) m.opacity = opacity;
  });
}

/**
 * Back layer (z -6..-1) sits behind the logo, a sparse front layer (z 1..4) in front of it.
 * Two separate <Clouds> so each layer sorts as a unit against the logo via renderOrder.
 */
export function HeroClouds({ still, mobile }: { still: boolean; mobile: boolean }) {
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
    if (f) {
      f.scale.setScalar(1 + h * 0.6);
      setGroupOpacity(f, fade);
      f.visible = visible;
    }
  });

  return (
    <>
      <Clouds ref={back} texture={TEXTURE} material={THREE.MeshLambertMaterial} limit={200} renderOrder={1}>
        <Cloud seed={1} segments={mobile ? 18 : 30} bounds={[9, 2, 2]} volume={7} position={[0, -1.4, -4]} color="#eef5ff" speed={0.15 * s} growth={3} opacity={0.9} />
        <Cloud seed={2} segments={mobile ? 12 : 20} bounds={[5, 2, 1]} volume={5} position={[-6, 2, -3]} color="#ffffff" speed={0.1 * s} opacity={0.8} />
        <Cloud seed={3} segments={mobile ? 12 : 20} bounds={[5, 2, 1]} volume={5} position={[6, 1.5, -3]} color="#ffffff" speed={0.12 * s} opacity={0.8} />
      </Clouds>
      {!mobile && (
        <Clouds ref={front} texture={TEXTURE} material={THREE.MeshLambertMaterial} limit={60} renderOrder={3}>
          <Cloud seed={4} segments={12} bounds={[4, 1, 1]} volume={3} position={[-4.5, -2.4, 2]} color="#ffffff" speed={0.2 * s} opacity={0.55} />
          <Cloud seed={5} segments={10} bounds={[3, 1, 1]} volume={3} position={[4.8, -2, 2.5]} color="#ffffff" speed={0.18 * s} opacity={0.5} />
        </Clouds>
      )}
    </>
  );
}
