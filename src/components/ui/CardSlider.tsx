"use client";

import { useCallback, useEffect, useRef, useState, type ElementType, type HTMLAttributes, type RefAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { clampIndex, nearestSlide } from "./card-slider-math";

/** Put on every slide element, together with the `data-slide` attribute. Only applies below 901px. */
export const SLIDE_CLASS = "max-lg:w-[85%] max-lg:max-w-[420px] max-lg:shrink-0 max-lg:snap-start";

const MOBILE_QUERY = "(max-width: 900.98px)";
const TRACK_MOBILE =
  "max-lg:relative max-lg:flex max-lg:gap-4 max-lg:overflow-x-auto max-lg:snap-x max-lg:snap-mandatory max-lg:-mx-(--gutter) max-lg:px-(--gutter) max-lg:scroll-px-(--gutter) max-lg:no-scrollbar max-lg:focus-visible:outline-offset-[-4px]";

type Props = {
  /** Element for the track. Match what the section used before (e.g. "ol" for a list of steps). */
  as?: "div" | "ol" | "ul";
  /** Accessible name for the slider below 901px, e.g. "How we work steps". */
  label: string;
  /** Number of `data-slide` children. */
  count: number;
  /** The desktop layout classes, exactly as they were on the element this replaces. */
  className?: string;
  children: ReactNode;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * At 901px and above: renders the caller's grid unchanged (the counter strip is display:none).
 * Below 901px: the same element becomes a full-bleed scroll-snap slider with a counter strip.
 */
export function CardSlider({ as = "div", label, count, className, children }: Props) {
  // Typed props: a bare ElementType also spans the R3F JSX elements and collapses to never.
  const Tag = as as ElementType<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>;
  const trackRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const slides = useCallback(
    () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>(":scope > [data-slide]") ?? []),
    [],
  );

  const startOf = useCallback((el: HTMLElement) => {
    const track = trackRef.current!;
    return el.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft);
  }, []);

  const go = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const el = slides()[clampIndex(i, count)];
      if (!track || !el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({ left: startOf(el), behavior: reduce ? "auto" : "smooth" });
    },
    [count, slides, startOf],
  );

  // Follow the visible slide as the visitor swipes (one update per frame).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const starts = slides().map(startOf);
      setActive(nearestSlide(starts, track.scrollLeft, track.scrollWidth - track.clientWidth));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [slides, startOf]);

  // Carousel semantics apply only below 901px; at 901px and above this is a plain grid.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => {
      const on = mq.matches;
      const items = slides();
      if (on) {
        track.setAttribute("role", "region");
        track.setAttribute("aria-roledescription", "carousel");
        track.setAttribute("aria-label", label);
        track.tabIndex = 0;
      } else {
        track.removeAttribute("role");
        track.removeAttribute("aria-roledescription");
        track.removeAttribute("aria-label");
        track.removeAttribute("tabindex");
        track.scrollLeft = 0;
      }
      items.forEach((el, i) => {
        if (on) {
          el.setAttribute("role", "group");
          el.setAttribute("aria-roledescription", "slide");
          el.setAttribute("aria-label", `${i + 1} of ${items.length}`);
        } else {
          el.removeAttribute("role");
          el.removeAttribute("aria-roledescription");
          el.removeAttribute("aria-label");
        }
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [label, slides]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  };

  return (
    <div className="max-lg:flex max-lg:flex-col max-lg:gap-5">
      <Tag ref={trackRef} data-slider-track className={cn(className, TRACK_MOBILE)} onKeyDown={onKeyDown}>
        {children}
      </Tag>
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <span data-slider-counter aria-live="polite" className="font-mono text-xs tracking-[.06em] text-muted">
          <span className="text-ink">{pad(active + 1)}</span> / {pad(count)}
        </span>
        <div className="flex items-center">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              data-slider-dot
              aria-label={`Go to card ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(i)}
              className="flex h-11 min-w-11 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-[width,background-color] duration-300 ease-out-expo motion-reduce:transition-none",
                  i === active ? "w-6 bg-accent" : "w-2 bg-line-2",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
