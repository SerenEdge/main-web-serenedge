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
 * `children` must stay in the same position in the tree whether or not
 * `reduced` is true: `useReducedMotion()` reports `true` for the SSR/hydration
 * snapshot and flips to the real value right after hydration, and React
 * remounts everything below a node whose element type changes at that
 * position. `ReactLenis` (with `root`) and `ScrollTriggerSync` are rendered as
 * conditional SIBLINGS of `children` rather than a conditional wrapper around
 * it, so `children` never changes position and never remounts. This relies on
 * `ReactLenis`'s `root: true` mode publishing the Lenis instance to a
 * module-level store (`rootLenisContextStore` in `lenis/react`), not only to
 * React context, so `useLenis()` elsewhere in the tree (Nav, ToolMarquee,
 * PageTransition) still finds the real instance even though it's no longer a
 * descendant of `ReactLenis` here. Re-verify against `lenis/react` on upgrade.
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

  // See the doc comment above: these are siblings of `children`, not a wrapper
  // around it, so the hydration-time `reduced` flip can't change `children`'s
  // position in the tree and force React to remount the whole app below it.
  return (
    <>
      {!reduced && (
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: true }} />
      )}
      {!reduced && <ScrollTriggerSync />}
      {children}
    </>
  );
}
