"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { WordRotator } from "./WordRotator";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap
            .timeline({ defaults: { ease: "expo.out", duration: 1.1 }, delay: 0.1 })
            .from(".hero-kicker", { autoAlpha: 0, y: 12, duration: 0.8 })
            .from(".hero-line > span", { yPercent: 110, stagger: 0.1 }, "-=0.5")
            .from(".hero-fade", { autoAlpha: 0, y: 20, stagger: 0.08, duration: 0.9 }, "-=0.7");

          gsap.to(".hero-inner", {
            yPercent: -12,
            autoAlpha: 0.2,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
          });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className="flex min-h-[min(860px,100svh)] flex-col items-center justify-center px-(--gutter) pb-[72px] pt-[clamp(120px,14vw,150px)] text-center max-lg:min-h-0"
    >
      <div className="hero-inner flex max-w-[1060px] flex-col items-center gap-7">
        <p className="hero-kicker text-base font-medium leading-6 text-muted">
          An IT studio based in Sri Lanka
        </p>
        <h1 className="text-[clamp(52px,9.4vw,120px)] font-bold leading-[.93] tracking-[-.04em]">
          <span className="hero-line block overflow-hidden pb-[.06em]">
            <span className="block">SerenEdge</span>
          </span>
          <span className="hero-line block overflow-hidden pb-[.06em] text-accent">
            <span className="block">for each node.</span>
          </span>
        </h1>
        <WordRotator className="hero-fade" />
        <p className="hero-fade max-w-[600px] text-lg leading-7 text-muted">
          A deeply technical IT studio. Give us any IT problem. One team takes it from the first call to the last deploy.
        </p>
        <div className="hero-fade mt-2 flex w-full flex-wrap justify-center gap-3 sm:w-auto">
          <Button href="/contact" arrow className="max-sm:w-full">
            Book a discovery call
          </Button>
          <Button href="/services" variant="tint" className="max-sm:w-full">
            Explore services
          </Button>
        </div>
      </div>
    </section>
  );
}
