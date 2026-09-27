"use client";

import { useRef, type ElementType, type HTMLAttributes, type RefAttributes, type ReactNode } from "react";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

type Props = {
  as?: "div" | "ul" | "ol" | "section" | "article";
  className?: string;
  children: ReactNode;
  stagger?: number;
  y?: number;
  delay?: number;
  /** Animate these descendants instead of the direct children. */
  selector?: string;
  id?: string;
};

export function Reveal({ as = "div", className, children, stagger = 0.08, y = 24, delay = 0, selector, id }: Props) {
  const ref = useRef<HTMLElement>(null);
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
          const targets = selector ? el.querySelectorAll(selector) : el.children;
          gsap.from(targets, {
            autoAlpha: 0,
            y,
            duration: 0.9,
            ease: "expo.out",
            stagger,
            delay,
            // Hand control back to CSS (hover transforms, opacity transitions).
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}
