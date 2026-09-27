"use client";

import Image from "next/image";
import { useLenis } from "lenis/react";
import { useRef } from "react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { TOOLS } from "@/lib/site";

export function ToolMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const speed = useRef({ target: 1, current: 1, hover: false });

  // Scroll velocity nudges the marquee faster; it eases back to 1× on its own.
  useLenis(({ velocity }) => {
    speed.current.target = 1 + Math.min(Math.abs(velocity) / 6, 5);
  });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          // Two identical copies: -50% lands exactly on the start of the second one.
          const loop = gsap.to(".mq-track", { xPercent: -50, duration: 70, ease: "none", repeat: -1 });
          const tick = () => {
            const s = speed.current;
            s.target += (1 - s.target) * 0.04;
            const goal = s.hover ? 0 : s.target;
            s.current += (goal - s.current) * 0.1;
            loop.timeScale(Math.max(0.0001, s.current));
          };
          gsap.ticker.add(tick);
          return () => gsap.ticker.remove(tick);
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section aria-labelledby="tools" className="px-(--gutter) pb-(--section-y) pt-[clamp(56px,7vw,96px)]">
      <SectionIntro
        id="tools"
        accent="Toolbox."
        title="What we reach for."
        lead="From web stacks to AI integration and hardware, picked for the job, not the trend."
        className="mb-[clamp(32px,4vw,48px)]"
      />
      <div
        ref={ref}
        role="group"
        aria-label={`Tools we use: ${TOOLS.map((t) => t.name).join(", ")}`}
        onPointerEnter={() => (speed.current.hover = true)}
        onPointerLeave={() => (speed.current.hover = false)}
        className="overflow-hidden motion-safe:[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      >
        <div className="mq-track flex w-max motion-reduce:w-auto">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden="true" className={cn("flex shrink-0 motion-reduce:flex-wrap", copy === 1 && "motion-reduce:hidden")}>
              {TOOLS.map((t) => (
                <li key={t.name} className="mr-6 flex h-[52px] items-center gap-3 whitespace-nowrap px-5 text-sm font-medium md:h-[60px] md:text-[15px]">
                  <Image src={`/logos/${t.logo}.svg`} alt="" width={26} height={26} className="size-6 object-contain md:size-[26px]" />
                  <span>{t.name}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
