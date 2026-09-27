"use client";

import { useRef } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

export function SentState({ recap, onReset }: { recap: string; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      ref.current?.focus();
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap.from(ref.current!.children, { autoAlpha: 0, y: 20, stagger: 0.08, duration: 0.8, ease: "expo.out" });
          gsap.fromTo(".sent-tick path", { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.7, delay: 0.2, ease: "power2.out" });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      role="status"
      tabIndex={-1}
      className="flex min-h-[640px] flex-col justify-center gap-6 px-[clamp(24px,4.4vw,56px)] py-[clamp(32px,5vw,64px)] focus:outline-none"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-accent/12">
        <svg className="sent-tick size-[26px]" viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" />
        </svg>
      </span>
      <h2 className="font-display text-[clamp(34px,4vw,48px)] font-bold leading-[1.08] tracking-[-.015em]">Booking requested.</h2>
      <div className="rounded-md border border-line bg-surface px-6 py-5 font-mono text-sm leading-relaxed">{recap}</div>
      <p className="max-w-[520px] text-lg leading-relaxed text-muted">
        We&apos;ve emailed you a confirmation. Expect a reply within 24 hours to set up the call. Reviewed personally, never by
        a bot.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReset} className={buttonClasses("dark", "sm")}>
          Send another message
        </button>
        <Button href="/" variant="tint" size="sm">
          Back home
        </Button>
      </div>
    </div>
  );
}
