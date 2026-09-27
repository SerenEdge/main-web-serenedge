"use client";

import Link from "next/link";
import { useRef } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { SITE } from "@/lib/site";

// A rail runs from this dot's centre to the next dot's centre: item width + 32px gap - 2 × 14px dot clearance.
const rail = "absolute left-[calc(50%+14px)] top-1/2 -mt-px hidden h-0.5 w-[calc(100%+4px)] lg:block";

const slide = cn(
  "j-item flex flex-col items-center gap-4 text-center",
  SLIDE_CLASS,
  "max-lg:items-start max-lg:rounded-lg max-lg:border max-lg:border-line max-lg:bg-white max-lg:p-6 max-lg:text-left",
);

export function Journey() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { ok: MOTION.ok, wide: "(min-width: 901px)" },
        (ctx) => {
          const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
          if (!ok) return;
          gsap.from(".j-item", {
            autoAlpha: 0,
            y: 24,
            stagger: 0.12,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: ".journey", start: "top 80%", once: true },
          });
          if (wide) {
            gsap.from(".j-line", {
              scaleX: 0,
              ease: "none",
              stagger: 0.5,
              scrollTrigger: { trigger: ".journey", start: "top 75%", end: "top 35%", scrub: true },
            });
          }
          gsap.to(".j-pulse", { scale: 1.6, autoAlpha: 0, duration: 1.8, ease: "power2.out", repeat: -1 });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="record" className="px-(--gutter) py-(--section-y)">
      <div className="flex flex-col gap-16 max-lg:gap-10">
        <SplitHeading id="record" className="type-h2">
          <span className="text-accent max-lg:block">On the record.</span> How we got here.
        </SplitHeading>
        <CardSlider as="ol" label="Our journey" count={3} className="journey grid gap-8 lg:grid-cols-3">
          <li data-slide className={slide}>
            <div className="relative flex h-4 w-full justify-center max-lg:justify-start">
              <span className="size-[18px] rounded-full border-2 border-accent bg-accent" />
              <span className={rail}>
                <span className="j-line absolute inset-0 origin-left rounded-[2px] bg-accent" />
              </span>
            </div>
            <span className="eyebrow mt-2 text-muted">Feb 2026</span>
            <h3 className="font-display text-[clamp(24px,2.2vw,30px)] font-bold leading-[1.2]">SerenEdge founded</h3>
            <p className="max-w-[340px] text-base leading-relaxed text-muted text-pretty">
              Daham Dissanayake starts SerenEdge in Sri Lanka: one team for web, IoT, automation, systems and ML. Building in
              public from day one.
            </p>
          </li>
          <li data-slide className={slide}>
            <div className="relative flex h-4 w-full justify-center max-lg:justify-start">
              <span className="relative size-[18px] rounded-full border-4 border-accent bg-white">
                <span className="j-pulse absolute -inset-[8px] rounded-full bg-accent/16" />
              </span>
              <span className={rail}>
                <span className="j-line absolute inset-0 origin-left bg-[repeating-linear-gradient(90deg,var(--color-line-2)_0_8px,transparent_8px_14px)]" />
              </span>
            </div>
            <span className="eyebrow mt-2 text-accent">Now</span>
            <h3 className="font-display text-[clamp(24px,2.2vw,30px)] font-bold leading-[1.2]">Delivery platform live</h3>
            <p className="max-w-[340px] text-base leading-relaxed text-muted text-pretty">
              Every project runs on{" "}
              <a className="underline underline-offset-3 transition-colors hover:text-accent" href={SITE.platformUrl} rel="noopener">
                platform.serenedge.com
              </a>
              : planned tasks, live deadlines and a portal clients can open any time.
            </p>
          </li>
          <li data-slide className={slide}>
            <div className="relative flex h-4 w-full justify-center max-lg:justify-start">
              <span className={cn("size-[18px] rounded-full border-2 border-dashed border-accent bg-white")} />
            </div>
            <span className="eyebrow mt-2 text-muted">Next</span>
            <h3 className="font-display text-[clamp(24px,2.2vw,30px)] font-bold leading-[1.2]">
              Yours<span className="font-normal">?</span>
            </h3>
            <p className="max-w-[340px] text-base leading-relaxed text-muted text-pretty">
              Bring the problem other shops won&apos;t touch. The first call is free.
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 text-base font-medium transition-colors hover:text-accent"
            >
              Reach out and book a call
              <ArrowIcon className="size-4 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
            </Link>
          </li>
        </CardSlider>
      </div>
    </section>
  );
}
