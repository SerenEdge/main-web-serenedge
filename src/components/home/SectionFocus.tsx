"use client";

import { gsap, MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { rectToNdc } from "@/scene/math";
import { FOCUS_STRENGTH, motion } from "@/scene/store";

/** Dots behind the [data-section] in view brighten softly. Renders nothing. */
export function SectionFocus() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION.ok, () => {
      const track = (el: Element) => {
        const p = rectToNdc(el.getBoundingClientRect(), window.innerWidth, window.innerHeight);
        motion.focus.x = p.x;
        motion.focus.y = p.y;
      };
      gsap.utils.toArray<HTMLElement>("[data-section]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) track(el);
            gsap.to(motion.focus, { strength: self.isActive ? FOCUS_STRENGTH : 0, duration: 0.8, overwrite: "auto" });
          },
          onUpdate: (self) => {
            if (self.isActive) track(el);
          },
        });
      });
      return () => {
        motion.focus.strength = 0;
      };
    });
  });
  return null;
}
