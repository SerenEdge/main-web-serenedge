"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { motion } from "@/scene/store";

/**
 * DOM layer of the 3D hero. The logo itself is drawn in the canvas between the
 * cloud layers, so the heading carries the brand name for screen readers.
 */
export function HeroOverlay() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MOTION.ok, () => {
        // Intro, once: headline lines rise out of their masks, then subline + CTA.
        const tl = gsap.timeline({ delay: 0.35 });
        SplitText.create(".hero-title-lines", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            tl.from(self.lines, { yPercent: 100, duration: 1.1, ease: "power4.out", stagger: 0.08 }, 0);
          },
        });
        tl.from(".hero-fade", { autoAlpha: 0, y: 16, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.5);

        // Exit: pin for one more viewport while the camera flies up through the clouds.
        gsap
          .timeline({
            scrollTrigger: { trigger: ref.current, start: "top top", end: "+=100%", scrub: true, pin: true },
          })
          .to(motion, { hero: 1, ease: "none", duration: 1 }, 0)
          .to(motion, { reveal: 1, ease: "none", duration: 0.6 }, 0.4)
          .to("#hero-overlay", { autoAlpha: 0, y: -40, ease: "none", duration: 0.6 }, 0);
      });

      mm.add(MOTION.reduce, () => {
        // Static end states: dots always on, clouds simply gone once the hero is scrolled past.
        motion.reveal = 1;
        ScrollTrigger.create({
          trigger: ref.current,
          start: "bottom top",
          onEnter: () => void (motion.hero = 1),
          onLeaveBack: () => void (motion.hero = 0),
        });
      });
    },
    { scope: ref },
  );

  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex h-svh min-h-[560px] flex-col items-center justify-end px-(--gutter) pb-[clamp(48px,9vh,112px)] text-center"
    >
      <div id="hero-overlay" className="flex max-w-[760px] flex-col items-center gap-5">
        <h1 className="type-hero text-ink">
          <span className="sr-only">SerenEdge, </span>
          <span className="hero-title-lines block">for each node.</span>
        </h1>
        <p className="hero-fade max-w-[560px] text-lg leading-7 text-muted">
          A deeply technical IT studio. Give us any IT problem. One team takes it from the first call to the last deploy.
        </p>
        <div className="hero-fade mt-2 w-full sm:w-auto">
          <Button href="/contact" arrow className="max-sm:w-full">
            Book a discovery call
          </Button>
        </div>
      </div>
    </section>
  );
}
