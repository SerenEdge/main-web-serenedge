"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

const WORDS = ["web platforms.", "IoT fleets.", "automations.", "custom systems.", "ML models."];

export function WordRotator({ className }: { className?: string }) {
  const box = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = box.current;
      if (!el) return;
      const words = gsap.utils.toArray<HTMLElement>(".rot-word", el);
      let i = 0;
      const widthOf = (w: HTMLElement) => Math.ceil(w.getBoundingClientRect().width) + 2;
      const fit = () => gsap.set(el, { width: widthOf(words[i]) });

      gsap.set(words, { autoAlpha: 0 });
      gsap.set(words[0], { autoAlpha: 1 });
      fit();
      document.fonts?.ready.then(fit);
      window.addEventListener("resize", fit);

      const mm = gsap.matchMedia();
      mm.add(MOTION.ok, () => {
        const id = window.setInterval(() => {
          const prev = words[i];
          i = (i + 1) % words.length;
          const next = words[i];
          gsap.to(prev, { autoAlpha: 0, yPercent: -45, filter: "blur(8px)", duration: 0.7, ease: "expo.out" });
          gsap.fromTo(
            next,
            { autoAlpha: 0, yPercent: 45, filter: "blur(8px)" },
            { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out" },
          );
          gsap.to(el, { width: widthOf(next), duration: 0.7, ease: "expo.out" });
        }, 2600);
        return () => window.clearInterval(id);
      });

      return () => window.removeEventListener("resize", fit);
    },
    { scope: box },
  );

  return (
    <p
      className={cn(
        "mt-2 flex flex-wrap items-baseline justify-center gap-[.28em] text-[clamp(22px,2.7vw,32px)] font-medium leading-tight tracking-[-.015em] text-muted",
        className,
      )}
    >
      We build
      <span
        ref={box}
        className="inline-grid justify-items-center text-ink"
        aria-label="web platforms, IoT fleets, automations, custom systems and ML models"
      >
        {WORDS.map((w, n) => (
          <span key={w} aria-hidden="true" className={cn("rot-word col-start-1 row-start-1 whitespace-nowrap", n > 0 && "opacity-0")}>
            {w}
          </span>
        ))}
      </span>
    </p>
  );
}
