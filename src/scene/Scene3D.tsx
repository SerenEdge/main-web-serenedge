"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { DotField, InfinityEdges, useDotData, useDotUniformSync } from "./DotField";
import { HeroClouds } from "./HeroClouds";
import { LogoPlane } from "./LogoPlane";
import { DIST, FOV, LOGO_MAX_W, LOGO_VW } from "./heroLayout";
import { frustumSize } from "./math";
import { motion } from "./store";


/** Hero fly-through: forward through the clouds and slightly up, plus a little mouse sway. */
function CameraRig() {
  useFrame(({ camera }) => {
    const h = motion.hero;
    // Starts at rest (no zoom-in) so the instant DOM logo and the 3D logo line up at handover.
    camera.position.z = DIST - h * 9;
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
    // After the ∞ forms it scrolls up with the page: px of scroll -> world units on the dot plane.
    const lift = (motion.lift * plane.height) / size.height;
    group.current.position.set(camera.position.x, camera.position.y + lift, camera.position.z - DIST);
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
      motion.intro = motion.logoIn = 1;
      return;
    }
    const tl = gsap
      .timeline()
      .to(motion, { logoIn: 1, duration: 0.4, ease: "none" }, 0)
      .to(motion, { intro: 1, duration: 1.6, ease: "power2.out" }, 0);
    return () => {
      tl.kill();
    };
  }, [gl, scene, camera, still]);
  return null;
}

function Hero({ still }: { still: boolean }) {
  const size = useThree((s) => s.size);
  const mobile = size.width < 768;
  const plane = frustumSize(FOV, size.width / size.height, DIST);
  const logoWidth = Math.min(LOGO_MAX_W, plane.width * LOGO_VW);
  return (
    <>
      <HeroClouds still={still} mobile={mobile} spread={Math.min(1, Math.max(0.45, plane.width / 13.3))} />
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
      flat // no tone mapping: ACES turns white clouds grey
      dpr={[1, dpr]}
      frameloop={hidden ? "never" : "always"}
      camera={{ fov: FOV, position: [0, 0, DIST], near: 0.1, far: 100 }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setCountScale(0.6);
        }}
      />
      <AdaptiveDpr pixelated />
      <CameraRig />
      <Suspense fallback={null}>
        <Hero still={still} />
      </Suspense>
      <DotLayer countScale={countScale} />
    </Canvas>
  );
}
