"use client";

import { useEffect, useRef } from "react";
import { konamiStep } from "./konami";

const EDITABLE = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Calls `onComplete` when the Konami code is typed anywhere on the page (not while a form field has focus). */
export function useKonamiCode(onComplete: () => void) {
  const progress = useRef(0);
  const callback = useRef(onComplete);
  useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return;
      const step = konamiStep(progress.current, e.key);
      progress.current = step.progress;
      if (step.complete) callback.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
