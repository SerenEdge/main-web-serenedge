"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { preload } from "react-dom";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { LOGO_ASPECT, LOGO_URL, logoCss, logoExitFade } from "./heroLayout";
import { sceneFor } from "./routes";
import { motion, resetMotion } from "./store";

const loadScene3D = () => import("./Scene3D");
// On the home page, start downloading the 3D chunk as soon as this module runs, so it
// overlaps hydration instead of waiting for it (dynamic() would only start after mount).
if (typeof window !== "undefined" && window.location.pathname === "/") void loadScene3D();
const Scene3D = dynamic(loadScene3D, { ssr: false });
const AmbientBackground = dynamic(() => import("./ambient/AmbientBackground"), { ssr: false });

const noopSubscribe = () => () => {};

const CLOUD_URL = "/img/cloud-puff.webp";
const LOGO_BOX = logoCss();

/**
 * Sky gradient behind the home canvas, plus the logo as a plain preloaded image so it shows
 * on first paint. The 3D logo takes over with a short crossfade once the scene has loaded.
 */
function HomeSky() {
  // Start the cloud texture download with the HTML, not after the 3D chunk arrives.
  preload(CLOUD_URL, { as: "image", type: "image/webp", fetchPriority: "high", crossOrigin: "anonymous" });
  const sky = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tick = () => {
      if (sky.current) sky.current.style.opacity = String(1 - motion.hero);
      if (logo.current) logo.current.style.opacity = String((1 - motion.logoIn) * logoExitFade(motion.hero));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <>
      <div
        ref={sky}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh bg-[linear-gradient(180deg,color-mix(in_oklab,var(--brand-blue)_42%,white)_0%,color-mix(in_oklab,var(--brand-blue)_16%,white)_40%,color-mix(in_oklab,var(--brand-blue)_5%,white)_70%,#fff_100%)]"
      />
      <div ref={logo} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh">
        <Image
          src={LOGO_URL}
          alt=""
          width={1200}
          height={Math.round(1200 * LOGO_ASPECT)}
          unoptimized // same URL as the 3D texture, so the scene reuses the cached file
          preload
          fetchPriority="high"
          crossOrigin="anonymous" // three.js loads textures in CORS mode; match it so the download is shared
          className="absolute left-1/2 h-auto -translate-x-1/2 -translate-y-1/2"
          style={{ top: LOGO_BOX.top, width: LOGO_BOX.width }}
        />
      </div>
    </>
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
