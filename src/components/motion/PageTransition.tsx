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

  useGSAP(() => {
    const el = panel.current;
    if (!el) return;
    const path = window.location.pathname;
    const isNavigation = lastPath !== null && lastPath !== path;
    lastPath = path;
    if (!isNavigation) return;

    // Next scrolls the window to top on navigation; keep Lenis's internal position in sync.
    lenis?.scrollTo(0, { immediate: true, force: true });

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
