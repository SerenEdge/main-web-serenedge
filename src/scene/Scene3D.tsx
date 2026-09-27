"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { DotField, InfinityEdges, useDotData, useDotUniformSync } from "./DotField";
import { HeroClouds } from "./HeroClouds";
import { LogoPlane } from "./LogoPlane";
import { frustumSize } from "./math";
import { motion } from "./store";

const FOV = 50;
const DIST = 8; // camera to dot plane, and the rest distance camera -> logo
const CAM_START = 12;

/** Hero fly-through: forward through the clouds and slightly up, plus a little mouse sway. */
function CameraRig() {
  useFrame(({ camera }) => {
    const h = motion.hero;
    camera.position.z = CAM_START - (CAM_START - DIST) * motion.intro - h * 9;
    camera.position.y = h * 1.5;
    camera.position.x += (motion.mouse.x * 0.15 - camera.position.x) * 0.05;
  });
  return null;
}

/** Dots + ∞ edges on a plane that rides DIST in front of the camera, so they stay framed after the fly-through. */
function DotLayer({ countScale }: { countScale: number }) {
  const group = useRef<THREE.Group>(null!);
  const size = useThree((s) => s.size);
  const mobile = size.width < 768;
  const plane = useMemo(() => frustumSize(FOV, size.width / size.height, DIST), [size.width, size.height]);
  const data = useDotData(plane, countScale);
  useDotUniformSync(plane, mobile, data.fieldHeight);

  useFrame(({ camera }) => {
    group.current.position.set(camera.position.x, camera.position.y, camera.position.z - DIST);
    group.current.visible = motion.reveal > 0.001;
  });

  return (
    <group ref={group}>
      <DotField data={data} />
      <InfinityEdges data={data} mobile={mobile} />
    </group>
  );
}

/** Runs once the textures have loaded (it sits inside the Suspense boundary). */
function Intro({ still }: { still: boolean }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.compile(scene, camera); // avoid a shader-compile hitch on first scroll
    if (still) {
      motion.intro = 1;
      return;
    }
    const tw = gsap.to(motion, { intro: 1, duration: 1.8, ease: "expo.out" });
    return () => {
      tw.kill();
    };
  }, [gl, scene, camera, still]);
  return null;
}

function Hero({ still }: { still: boolean }) {
  const size = useThree((s) => s.size);
  const mobile = size.width < 768;
  const plane = frustumSize(FOV, size.width / size.height, DIST);
  const logoWidth = Math.min(3.4, plane.width * 0.62);
  return (
    <>
      <HeroClouds still={still} mobile={mobile} />
      <LogoPlane width={logoWidth} still={still} />
      <Intro still={still} />
    </>
  );
}

export default function Scene3D({ still }: { still: boolean }) {
  const [dpr, setDpr] = useState(1.75);
  const [countScale, setCountScale] = useState(1);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    const onMove = (e: PointerEvent) => {
      motion.touch = e.pointerType === "touch";
      motion.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      motion.mouse.y = 1 - (e.clientY / window.innerHeight) * 2;
    };
    motion.touch = window.matchMedia("(hover: none)").matches;
    document.addEventListener("visibilitychange", onVis);
    if (!still) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
    };
  }, [still]);

  return (
    <Canvas
      aria-hidden="true"
      // lvh, not inset: 0, so a mobile URL bar showing/hiding doesn't resize (and rebuild) the scene.
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100lvh", zIndex: 0, pointerEvents: "none" }}
      dpr={[1, dpr]}
      frameloop={hidden ? "never" : "always"}
      camera={{ fov: FOV, position: [0, 0, CAM_START], near: 0.1, far: 100 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setCountScale(0.6);
        }}
      />
      <AdaptiveDpr pixelated />
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 5, 3]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[0, -4, 2]} intensity={0.35} color="#5b8ac5" />
      <CameraRig />
      <Suspense fallback={null}>
        <Hero still={still} />
      </Suspense>
      <DotLayer countScale={countScale} />
    </Canvas>
  );
}
