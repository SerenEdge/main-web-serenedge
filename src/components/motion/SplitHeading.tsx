"use client";

import { useRef, type ElementType, type HTMLAttributes, type RefAttributes, type ReactNode } from "react";
import { gsap, MOTION, SplitText, useGSAP } from "@/lib/gsap";

type Props = {
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
  children: ReactNode;
  /** Play right away (page heroes) instead of when scrolled into view. */
  onLoad?: boolean;
};

export function SplitHeading({ as = "h2", id, className, children, onLoad = false }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  // Typed props: a bare ElementType also spans the R3F JSX elements and collapses to never.
  const Tag = as as ElementType<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          const el = ref.current;
          if (!el) return;
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 1.1,
                ease: "expo.out",
                stagger: 0.08,
                ...(onLoad
                  ? { delay: 0.15 }
                  : { scrollTrigger: { trigger: el, start: "top 85%", once: true } }),
              }),
          });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
