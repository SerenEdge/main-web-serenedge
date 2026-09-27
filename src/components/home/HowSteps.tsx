"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { PROCESS } from "@/lib/site";

export function HowSteps() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { ok: MOTION.ok, wide: "(min-width: 901px)" },
        (ctx) => {
          const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
          if (!ok) return;
          gsap.from(".how-step", {
            autoAlpha: 0,
            y: 28,
            stagger: 0.1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: ".how-steps", start: "top 80%", once: true },
          });
          if (!wide) return;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: ".how-steps", start: "top 85%", end: "top 35%", scrub: true },
          });
          gsap.utils.toArray<HTMLElement>(".how-step", ref.current).forEach((step) => {
            const dot = step.querySelector(".how-dot:not(.how-dot--solid)");
            const line = step.querySelector(".how-line");
            if (dot) tl.to(dot, { backgroundColor: "#5b8ac5", color: "#ffffff", duration: 0.2 });
            if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1 });
          });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} data-section aria-labelledby="how" className="band px-(--gutter) pb-[clamp(64px,7vw,104px)] pt-(--section-y)">
      <div className="flex flex-col gap-[clamp(40px,5vw,72px)]">
        <SectionIntro
          id="how"
          accent="How we work."
          title={'From "what if" to in production, in four steps.'}
          lead="Every engagement runs the same way. Predictable cadence, transparent progress, no agency-deck fluff."
        />
        <CardSlider as="ol" label="How we work steps" count={PROCESS.length} className="how-steps grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {PROCESS.map((s, n) => {
            const last = n === PROCESS.length - 1;
            return (
              <li
                key={s.num}
                data-slide
                className={cn(
                  "how-step flex flex-col gap-4",
                  SLIDE_CLASS,
                  "max-lg:rounded-lg max-lg:border max-lg:border-line max-lg:bg-white max-lg:p-6",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "how-dot flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[13px] font-medium",
                      last ? "how-dot--solid border-ink bg-ink text-white" : "border-accent bg-white",
                    )}
                  >
                    {s.num}
                  </span>
                  {!last && (
                    <span className="relative h-0.5 grow overflow-hidden rounded-[2px] bg-line-2 max-lg:hidden">
                      <span className="how-line absolute inset-0 origin-left bg-accent" />
                    </span>
                  )}
                </div>
                <span className="eyebrow mt-2 text-muted">{s.tag}</span>
                <h3 className="font-display text-[26px] font-bold leading-[1.23]">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted max-lg:text-base">{s.homeText}</p>
              </li>
            );
          })}
        </CardSlider>
        <Link
          href="/services"
          className="group inline-flex items-center gap-2 self-start text-base font-medium transition-colors hover:text-accent"
        >
          See how an engagement runs
          <ArrowIcon className="size-4 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
        </Link>
      </div>
    </section>
  );
}
