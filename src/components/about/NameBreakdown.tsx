"use client";

import { useRef } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

const word = "font-display text-[min(18.6vw,268px)] font-bold leading-[.9] tracking-[-.04em] pb-[.24em]";
const bracket =
  "nm-bracket mx-[clamp(6px,.8vw,12px)] h-3 rounded-b-[6px] border-x-[3px] border-b-[3px] sm:h-[18px] sm:rounded-b-lg sm:border-x-4 sm:border-b-4";
const meta =
  "nm-meta col-span-full flex max-w-[520px] flex-col gap-2.5 px-[clamp(6px,.8vw,12px)] sm:col-span-1 sm:mx-auto sm:items-center sm:pt-[22px] sm:text-center";

export function NameBreakdown() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: ".nm", start: "top 85%", end: "top 35%", scrub: 0.6 },
            })
            .from(".nm-seren", { xPercent: -30, autoAlpha: 0 }, 0)
            .from(".nm-edge", { xPercent: 30, autoAlpha: 0 }, 0)
            .from(".nm-bracket", { scaleX: 0, stagger: 0.1 }, 0.6)
            .from(".nm-meta", { autoAlpha: 0, y: 20, stagger: 0.1 }, 0.9);
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="name" className="band px-(--gutter) py-(--section-y)">
      <div className="flex flex-col gap-16">
        <SplitHeading id="name" className="type-h2">
          <span className="text-accent">The name.</span> It says it plainly.
        </SplitHeading>
        <div className="nm grid grid-cols-[auto_auto] justify-center">
          <span aria-hidden="true" className={cn("nm-seren", word)}>
            Seren
          </span>
          <span aria-hidden="true" className={cn("nm-edge text-accent", word)}>
            Edge
          </span>
          <span aria-hidden="true" className={cn(bracket, "border-ink")} />
          <span aria-hidden="true" className={cn(bracket, "border-accent")} />
          <div className={cn(meta, "pt-5")}>
            <span className="eyebrow text-muted">01 · the root</span>
            <p className="text-[clamp(17px,1.4vw,20px)] leading-[1.55] text-muted">
              <b className="sr-only">Seren: </b>for Sri Lanka, where we&apos;re rooted.
            </p>
          </div>
          <div className={cn(meta, "mt-4 border-t border-line pt-4 sm:mt-0 sm:border-t-0")}>
            <span className="eyebrow text-accent">02 · the reach</span>
            <p className="text-[clamp(17px,1.4vw,20px)] leading-[1.55] text-muted">
              <b className="sr-only">Edge: </b>for the way we work: connecting through every node, reaching every layer of
              the stack.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
