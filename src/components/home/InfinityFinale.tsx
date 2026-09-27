"use client";

import { useRef } from "react";
import { InfMark } from "@/components/ui/InfMark";
import { gsap, MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { motion } from "@/scene/store";

/** Pinned spacer that drives the finale: the dots gather into ∞, then connect into a network. */
export function InfinityFinale() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION.ok, () => {
        motion.flowing = true;
        gsap
          .timeline({
            scrollTrigger: { trigger: ref.current, start: "top top", end: "+=220%", scrub: 1, pin: true },
          })
          .to(motion, { gather: 1, ease: "none", duration: 0.55 }, 0)
          .to(motion, { draw: 1, ease: "none", duration: 0.35 }, 0.5)
          .to(motion.focus, { strength: 0, duration: 0.1 }, 0)
          .fromTo("#finale-copy", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.85);

        // Dim the ∞ behind the footer as it scrolls in.
        gsap.fromTo(
          motion,
          { reveal: 1 },
          {
            reveal: 0.4,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: document.querySelector("footer"), start: "top bottom", end: "top 40%", scrub: true },
          },
        );
      });

      mm.add(MOTION.reduce, () => {
        // Already formed, no flow: swap states when the finale comes into view.
        motion.flowing = false;
        const formed = (on: boolean) => {
          motion.gather = motion.draw = on ? 1 : 0;
        };
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top 80%",
          onEnter: () => formed(true),
          onLeaveBack: () => formed(false),
        });
      });
    },
    { scope: ref },
  );

  return (
    <section id="infinity-finale" ref={ref} aria-labelledby="finale" className="relative h-svh">
      <div id="finale-copy" className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center gap-3 px-(--gutter) text-center">
        <InfMark className="h-3.5 w-7 text-accent" />
        <h2 id="finale" className="type-h2 text-ink">
          Every node, connected.
        </h2>
      </div>
    </section>
  );
}
