"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { LOGO_ASPECT, LOGO_URL, LOGO_Y, logoExitFade } from "./heroLayout";
import { motion } from "./store";



/** The logo as a textured plane at z = 0, between the back and front cloud layers. */
export function LogoPlane({ width, still }: { width: number; still: boolean }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useTexture(LOGO_URL, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  });

  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    const h = motion.hero;
    // Bob starts from 0 so the handover from the DOM logo lines up exactly.
    t0.current ??= clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    // Recedes and lifts while the camera flies forward, so it grows only gently and rises with the page.
    mesh.current.position.y = LOGO_Y + h * 2.5 + (still ? 0 : Math.sin(t * 0.6) * 0.08);
    mesh.current.position.z = -h * 6;
    // Holds through the first half of the exit, then fades as the next section arrives.
    mat.current.opacity = motion.logoIn * logoExitFade(h);
    mesh.current.visible = mat.current.opacity > 0.001;
  });

  return (
    <mesh ref={mesh} position={[0, LOGO_Y, 0]} renderOrder={2}>
      <planeGeometry args={[width, width * LOGO_ASPECT]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} opacity={0} />
    </mesh>
  );
}
