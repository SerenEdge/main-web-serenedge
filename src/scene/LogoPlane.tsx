"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { motion } from "./store";

export const LOGO_URL = "/img/logo-hero.png"; // 2000x1109, transparent
const ASPECT = 1109 / 2000;
export const LOGO_Y = 0.75;

/** The logo as a textured plane at z = 0, between the back and front cloud layers. */
export function LogoPlane({ width, still }: { width: number; still: boolean }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useTexture(LOGO_URL, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  });

  useFrame(({ clock }) => {
    const h = motion.hero;
    const i = motion.intro;
    mesh.current.position.y = LOGO_Y + (still ? 0 : Math.sin(clock.elapsedTime * 0.6) * 0.08);
    mesh.current.scale.setScalar((0.9 + 0.1 * i) * (1 + h * 0.3));
    mat.current.opacity = Math.max(0, i - h * 1.4);
    mesh.current.visible = mat.current.opacity > 0.001;
  });

  return (
    <mesh ref={mesh} position={[0, LOGO_Y, 0]} renderOrder={2}>
      <planeGeometry args={[width, width * ASPECT]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} opacity={0} />
    </mesh>
  );
}
