"use client";

import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { InfMark } from "@/components/ui/InfMark";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { useKonamiCode } from "@/lib/use-konami-code";

/** ↑ ↑ ↓ ↓ ← → ← → B A, anywhere on the site. A little thank-you note, not a real cheat. */
export function CheatModal() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const restoreFocus = useRef<HTMLElement | null>(null);

  useKonamiCode(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  });

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreFocus.current?.focus();
    };
  }, [open]);

  useGSAP(
    () => {
      if (!open) return;
      panelRef.current?.focus();
      const mm = gsap.matchMedia();
      mm.add(MOTION.ok, () => {
        gsap.fromTo(
          panelRef.current,
          { autoAlpha: 0, y: 16, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" },
        );
      });
    },
    { scope: panelRef, dependencies: [open] },
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cheat-modal-title"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/80 px-(--gutter) py-10 backdrop-blur-sm"
    >
      {/* Closes on click, anywhere — including the card itself. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex w-full max-w-[560px] flex-col gap-6 rounded-lg border border-line bg-white p-[clamp(28px,4.4vw,44px)] text-left shadow-2 focus:outline-none"
      >
        <InfMark className="h-3.5 w-7 text-accent" />
        <h2 id="cheat-modal-title" className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.15] tracking-[-.015em]">
          You found the cheat code.
        </h2>
        <p className="text-lg leading-relaxed text-muted">
          I have nothing much to say, just a thank you to my girl, Sanu. Thank you for always believing in me and
          supporting me.
        </p>
        <Eyebrow tone="soft">Founder&apos;s msg</Eyebrow>
      </div>
    </div>
  );
}
