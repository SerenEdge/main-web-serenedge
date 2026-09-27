"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
gsap.defaults({ ease: "power3.out", duration: 0.8 });

export const MOTION = {
  ok: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  pin: "(min-width: 901px) and (min-height: 820px) and (prefers-reduced-motion: no-preference)",
  fine: "(hover: hover) and (pointer: fine) and (min-width: 901px)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
