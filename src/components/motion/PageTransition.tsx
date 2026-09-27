"use client";

import { useLenis } from "lenis/react";
import { useRef } from "react";
import { gsap, MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";

// Last path the curtain ran for. null = first load (no curtain).
// Comparing paths also keeps React StrictMode's double effect from playing it.
let lastPath: string | null = null;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  // Persists across this instance's Strict-Mode double-invoke (one render, two
  // effect invocations) even though the GSAP context itself gets reverted between them.
  const decidedRef = useRef<boolean | null>(null);

  useGSAP(() => {
    const el = panel.current;
    if (!el) return;

    if (decidedRef.current === null) {
      const path = window.location.pathname;
      decidedRef.current = lastPath !== null && lastPath !== path;
      lastPath = path;
    }
    const isNavigation = decidedRef.current;

    // Next scrolls the window to top on navigation; keep Lenis's internal position in sync.
    lenis?.scrollTo(0, { immediate: true, force: true });
    if (!isNavigation) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION.ok, () => {
      gsap.set(el, { display: "block", yPercent: 0 });
      gsap.to(el, {
        yPercent: -100,
        duration: 0.6,
        ease: "expo.inOut",
        onComplete: () => {
          gsap.set(el, { display: "none" });
          ScrollTrigger.refresh();
        },
      });
    });
  }, []);

  return (
    <>
      <div ref={panel} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] hidden bg-ink" />
      {children}
    </>
  );
}
