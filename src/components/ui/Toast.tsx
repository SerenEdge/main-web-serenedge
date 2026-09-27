"use client";

import { useEffect, useRef } from "react";
import { InfMark } from "@/components/ui/InfMark";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

type Props = { open: boolean; onClose: () => void; duration?: number; children: React.ReactNode };

/** A small transient notice, bottom-center, styled after the nav pill. Auto-dismisses. */
export function Toast({ open, onClose, duration = 4500, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(t);
  }, [open, duration]);

  useGSAP(
    () => {
      if (!open) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION.ok, () => {
        gsap.from(ref.current, { autoAlpha: 0, y: 16, duration: 0.5, ease: "expo.out" });
      });
    },
    { scope: ref, dependencies: [open] },
  );

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(24px,env(safe-area-inset-bottom))] z-[90] flex justify-center px-4"
    >
      <p className="pointer-events-auto flex max-w-[420px] items-center gap-2.5 rounded-lg border border-line bg-white/95 px-5 py-3.5 text-sm leading-snug text-ink shadow-2 backdrop-blur-[14px]">
        <InfMark className="h-[9px] w-[18px] shrink-0 text-accent" />
        {children}
      </p>
    </div>
  );
}
