"use client";

import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";

function ScrollTriggerSync() {
  useLenis(ScrollTrigger.update);
  return null;
}

/**
 * One Lenis instance for the whole site, driven by GSAP's ticker so smooth
 * scroll and ScrollTrigger share a single RAF loop. Off under reduced motion.
 *
 * `children` renders INSIDE `<ReactLenis root>`, not as its sibling: the
 * component wraps its children in `LenisContext.Provider`, so anything
 * elsewhere in the tree calling `useLenis()` (Nav, ToolMarquee, PageTransition)
 * only sees the real instance if it is a descendant of this provider. `root`
 * only changes where Lenis attaches its scroll listener (window vs a wrapper
 * div); it does not change React's context rules.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [reduced]);

  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  if (reduced) return <>{children}</>;

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: true }}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
