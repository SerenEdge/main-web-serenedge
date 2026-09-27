"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { sceneFor } from "./routes";
import { motion, resetMotion } from "./store";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });
const AmbientBackground = dynamic(() => import("./ambient/AmbientBackground"), { ssr: false });

const noopSubscribe = () => () => {};

/** Sky gradient behind the home canvas; fades out as the camera leaves the hero. */
function HomeSky() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tick = () => {
      el.style.opacity = String(1 - motion.hero);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh bg-[linear-gradient(180deg,var(--brand-blue)_0%,color-mix(in_oklab,var(--brand-blue)_28%,white)_42%,color-mix(in_oklab,var(--brand-blue)_8%,white)_72%,#fff_100%)]"
    />
  );
}

/**
 * Lives in the root layout (outside template.tsx), so it survives navigation:
 * About ⇄ Services ⇄ Contact keep one running ambient canvas, and the home
 * scene and the ambient canvas are never mounted together (one WebGL context).
 */
export function SceneBackground() {
  const mode = sceneFor(usePathname());
  const reduced = useReducedMotion();
  // useReducedMotion reports true until hydration settles; wait so the scene mounts once with the real value.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    document.documentElement.dataset.scene = mode;
    if (mode === "home") resetMotion();
    return () => {
      delete document.documentElement.dataset.scene;
    };
  }, [mode]);

  if (mode === "home")
    return (
      <>
        <HomeSky />
        {ready && <Scene3D key="home" still={reduced} />}
      </>
    );
  if (mode === "ambient") return ready ? <AmbientBackground key="ambient" still={reduced} /> : null;
  return null;
}
