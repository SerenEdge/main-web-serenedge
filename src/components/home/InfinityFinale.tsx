"use client";

import { useRef } from "react";
import { InfMark } from "@/components/ui/InfMark";
import { gsap, MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { motion } from "@/scene/store";

/**
 * Drives the finale without pinning: the dots start gathering into ∞ once "How we work" is
 * well on screen and the network is complete by the time this section is centred, just
 * above the closing banner.
 */
export function InfinityFinale() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Once formed (section centred), the ∞ scrolls up with the page above the closing banner.
      ScrollTrigger.create({
        trigger: ref.current,
        start: "center center",
        end: "max",
        onUpdate: (self) => void (motion.lift = Math.max(0, self.scroll() - self.start)),
        onLeaveBack: () => void (motion.lift = 0),
      });

      const mm = gsap.matchMedia();

      mm.add(MOTION.ok, () => {
        motion.flowing = true;
        const how = document.getElementById("how")?.closest("section") ?? ref.current;
        gsap
          .timeline({
            scrollTrigger: { trigger: how, start: "top 30%", endTrigger: ref.current, end: "center center", scrub: 1 },
          })
          .to(motion, { gather: 1, ease: "none", duration: 0.55 }, 0)
          .to(motion, { draw: 1, ease: "none", duration: 0.35 }, 0.5)
          .to(motion.focus, { strength: 0, duration: 0.1 }, 0)
          .fromTo("#finale-copy", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.85);
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
