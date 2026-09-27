# SerenEdge Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give phone and tablet visitors (below 901px) a calm, spacious layout with swipeable card groups, without changing a single desktop pixel apart from two approved bug fixes.

**Architecture:** Every mobile change is a `max-lg:` / `max-md:` / `max-sm:` Tailwind variant (max-width media queries), so styles at 901px and above are untouched. A new `CardSlider` component renders the caller's existing desktop grid unchanged and turns it into a native scroll-snap slider with an animated counter strip below 901px. Desktop safety is proven by pixel-diffing 1440px screenshots against a saved baseline after every task.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (custom breakpoints sm 641 / md 761 / lg 901 / xl 1101), GSAP + ScrollTrigger, Lenis, Vitest. Verification: Playwright + Chromium and pixelmatch, installed in the session scratchpad (not in the repo).

**Spec:** `docs/superpowers/specs/2026-09-27-mobile-redesign-design.md`

## Global Constraints

- **Desktop freeze:** do not edit any unprefixed, `sm:`, `md:`, `lg:`, `xl:`, `pin:` or `fine:` class in a way that changes output at 901px and above. Add mobile styling only via `max-lg:` (below 901px), `max-md:` (below 761px) or `max-sm:` (below 641px). The only exception is Task 8's two bug fixes.
- **Desktop proof:** after Tasks 1-7, the 1440px pixel diff must report exactly `0 px differ` on all four pages. After Task 8, only the Home hero rotator line and the Services toolbox marquee may differ.
- No new runtime dependencies. No copy changes.
- Body text below 901px is 16px (`max-lg:text-base` where the base is `text-[15px]` or `text-[15.5px]`).
- Slides get `SLIDE_CLASS` plus the `data-slide` attribute; the `CardSlider` `count` prop equals the number of `data-slide` children.
- GSAP width conditions use `"(min-width: 901px)"` inside `gsap.matchMedia()` together with `MOTION.ok`.
- Commit messages carry **no** attribution trailer of any kind (`.claude/CLAUDE.md`). Plain subject line only.
- Shell is Git Bash on Windows. Run commands as separate, simple lines. `cd X && ...` chains and `$(...)` substitutions may be refused by the sandbox.

## Verification harness (used by every task)

Scratchpad directory (absolute path, used below as `SP`):
`C:/Users/DAHAMD~1/AppData/Local/Temp/claude/D--Github-main-web-serenedge/c0e2d678-0a29-4434-b226-e87e2fa74692/scratchpad`

It already contains Playwright, Chromium, pixelmatch/pngjs and these scripts:

| Script | What it does |
|---|---|
| `shoot.mjs` | Full-page screenshots into `$OUT/<page>-<width>.png` for widths in `$SIZES`, reduced motion; prints page-level horizontal overflow per page |
| `diff.mjs` | Compares `shots/<page>-1440.png` with `baseline/<page>-1440.png`; prints `N px differ` and the bounding box per page; writes `diffs/*-diff.png` |
| `slice.mjs` | Viewport-height slices of each page at width `$W` into `slices/` (`$PAGES` to limit pages) |
| `slider-test.mjs` | Behavioural test of every `CardSlider` at 390px, at 768px, and at 390px with reduced motion, including desktop crossover |
| `bugfix-check.mjs` | Task 8 target: "We build" gap equals one space for every word; all 21 marquee tools visible under reduced motion (currently FAILS, by design) |

`baseline/` holds the pre-change 1440px screenshots. **Never overwrite `baseline/`.**

**Standard verification block** (run from the repo root `D:/Github/main-web-serenedge`):

1. Build and restart the production server on port 3077:
   ```bash
   npm run build
   netstat -ano | grep ":3077" | grep LISTENING
   ```
   If that prints a PID, run `taskkill //F //PID <that PID>`. Then start the server in the background (Bash tool `run_in_background: true`):
   ```bash
   PORT=3077 npm run start
   ```
   Poll until `curl -s -o /dev/null -w "%{http_code}" http://localhost:3077/` prints `200`.
2. Desktop freeze:
   ```bash
   node "SP/shoot.mjs"
   ```
   Run it with `OUT=shots SIZES=1440x900` and the working directory set to SP. Because `cd` chains may be refused, use: `bash -c 'cd "SP" && OUT=shots SIZES=1440x900 node shoot.mjs && node diff.mjs'`, with SP expanded to the absolute path. Expected: `0 px differ` for home, about, services and contact (Tasks 1-7).
3. Mobile screenshots for the pages the task touched:
   `bash -c 'cd "SP" && rm -f slices/* && W=390 PAGES=/ node slice.mjs && W=768 PAGES=/ node slice.mjs'` (adjust `PAGES`). Open and review each slice with the Read tool against the task's "Looks like" list.
4. The task's own extra check (slider test, unit tests or bug-fix check).
5. `npm run lint` (0 errors; the 2 existing warnings in `contact-schema.test.ts` are known), `npx tsc --noEmit`, `npm test`.
6. Stop the server (`netstat` → `taskkill` as above) before reporting.

## Review Focus

1. **Crossing 901px mid-swipe** (rotating a tablet, resizing a window): the desktop grid must show every card, with no leftover scroll offset or carousel ARIA. Pinned by `slider-test.mjs`'s desktop-crossover pass, run in Tasks 3, 5 and 6.
2. **Keyboard users tabbing into an off-screen card's link** must see that card scroll into view, with the counter following. Pinned by `slider-test.mjs`'s "focused a link in the last slide" step.
3. **Reduced-motion visitors** must still be able to swipe and use the dots (instant jumps, no hidden cards). Pinned by `slider-test.mjs`'s reduced-motion pass.
4. **Narrowest phones (360px):** no page-level horizontal overflow and no slide wider than the screen. Pinned by `shoot.mjs` overflow output at `SIZES=360x780`, plus the `widest` check in `slider-test.mjs`.
5. **Tablet width (768px):** slides are capped at 420px, several are visible, and the counter must still track the aligned slide. Pinned by `slider-test.mjs`'s 768px pass.

---

## File map

| File | Change | Task |
|---|---|---|
| `src/app/globals.css` | mobile `--gutter` / `--section-y` overrides; `no-scrollbar` utility | 1, 2 |
| `src/components/ui/SectionIntro.tsx`, `ui/PageHero.tsx` | heading accent on its own line, spacing | 1 |
| `src/components/layout/CtaPanel.tsx`, `layout/Footer.tsx` | facts grid, full-width buttons, tap targets | 1 |
| `src/components/ui/card-slider-math.ts` (+ test) | pure index maths | 2 |
| `src/components/ui/CardSlider.tsx` | slider component | 2 |
| `src/components/home/WhyFlow.tsx`, `home/HowSteps.tsx` | sliders | 3 |
| `src/components/home/Hero.tsx`, `home/ClientPortal.tsx`, `home/DevJoin.tsx` | mobile layout | 4 |
| `src/components/about/AboutHero.tsx`, `about/NameBreakdown.tsx`, `about/Journey.tsx` | spacing, slider | 5 |
| `src/app/services/page.tsx`, `services/ServiceList.tsx`, `services/ProcessCards.tsx` | list layout, slider | 6 |
| `src/components/contact/ContactForm.tsx`, `contact/DirectContact.tsx`, `src/app/contact/page.tsx` | form comfort | 7 |
| `src/components/home/WordRotator.tsx`, `services/ToolMarquee.tsx` | bug fixes | 8 |

---

### Task 1: Mobile foundation (spacing variables, section intro, CTA panel, footer)

**Files:**
- Modify: `src/app/globals.css`, `src/components/ui/SectionIntro.tsx`, `src/components/ui/PageHero.tsx`, `src/components/layout/CtaPanel.tsx`, `src/components/layout/Footer.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: mobile `--gutter` (24px below 641px, 40px from 641 to 900px) and `--section-y` (88px below 901px), which later tasks rely on (`CardSlider` bleeds its track by exactly `--gutter`)

- [ ] **Step 1: Add the mobile variable overrides** in `src/app/globals.css`, directly after the existing `:root { ... }` block:

```css
/* Phones and tablets (below the 901px desktop breakpoint). Desktop never reads these. */
@media (width < 56.3125rem) {
  :root {
    --gutter: 24px;
    --section-y: 88px;
  }
}
@media (width >= 40.0625rem) and (width < 56.3125rem) {
  :root {
    --gutter: 40px;
  }
}
```

- [ ] **Step 2: `SectionIntro`**: put the accent phrase on its own line and tighten the heading-to-intro gap below 901px. Replace the component body's JSX with:

```tsx
    <div className={cn("grid items-end gap-[clamp(28px,4.4vw,64px)] max-lg:gap-6 lg:grid-cols-2", className)}>
      <SplitHeading id={id} className="type-h2">
        <span className="text-accent max-lg:block">{accent}</span> {title}
      </SplitHeading>
      {lead && (
        <Reveal className="max-w-[520px] lg:justify-self-end">
          <p className="text-lg leading-7 text-muted max-lg:leading-[1.6]">{lead}</p>
        </Reveal>
      )}
    </div>
```

- [ ] **Step 3: `PageHero`**: change the lead paragraph to `<p className="type-lead max-lg:text-lg">{lead}</p>`. Nothing else changes.

- [ ] **Step 4: `CtaPanel`**: give the facts a `wide` flag and apply the mobile layout:
  - Replace the `FACTS` declaration with:
    ```tsx
    const FACTS: { label: string; value: string; href?: string; wide?: true }[] = [
      { label: "Email", value: SITE.email, href: `mailto:${SITE.email}`, wide: true },
      { label: "Phone", value: SITE.phone.display, href: `tel:${SITE.phone.tel}` },
      { label: "Based", value: SITE.location },
      { label: "Availability", value: SITE.availability, wide: true },
    ];
    ```
  - Panel `div` (the one with `ref={ref}`): append `max-sm:px-5` to its className.
  - `h2`: `<span className="text-accent max-lg:block">{accent}</span> {title}`.
  - Both `Button`s: change `className="max-sm:w-full"` to `className="max-lg:w-full"`.
  - `dl`: `className="grid gap-x-8 gap-y-7 max-lg:grid-cols-2 max-lg:gap-x-5 max-lg:gap-y-6 sm:grid-cols-2"`.
  - Each fact `div`: `className={cn("cta-fact flex min-w-0 flex-col gap-1.5 border-t border-white/14 pt-[18px]", f.wide && "max-sm:col-span-2")}`, and add `import { cn } from "@/lib/cn";`.
  - `dd`: `className="text-[17px] text-white [overflow-wrap:anywhere] max-sm:text-base"`.

- [ ] **Step 5: `Footer`**: 44px tap targets below 901px.
  - In `FooterCol`, `ul` → `className="flex flex-col gap-2 max-lg:gap-0"`.
  - Both link elements (the `Link` and the `a`) → `className="text-[14.5px] text-ink transition-colors hover:text-accent max-lg:inline-flex max-lg:min-h-11 max-lg:items-center max-lg:text-base"`.
  - The outer grid `div` → append `max-lg:gap-y-8` to its className.

- [ ] **Step 6: Verify.** Run the standard verification block.
  - Desktop diff must be `0 px differ` on all four pages. If not, open `SP/diffs/*-diff.png`, find which change leaked into desktop, and fix it with a max-width variant.
  - Slices at 390 and 768 for all four pages (`PAGES=/,/about,/services,/contact`).
  - **Looks like:**
    - side margins visibly wider (24px at 390, 40px at 768);
    - section headings show the accent phrase on its own line;
    - the dark CTA panel shows Email on its own row, Phone and Based side by side, then Availability, with both buttons full width;
    - footer links are spaced as comfortable tap rows.
  - Also run `bash -c 'cd "SP" && OUT=shots SIZES=360x780 node shoot.mjs'`: every page must print `horizontal overflow px: 0`.

- [ ] **Step 7: Commit.**
```bash
git add src/app/globals.css src/components/ui/SectionIntro.tsx src/components/ui/PageHero.tsx src/components/layout/CtaPanel.tsx src/components/layout/Footer.tsx
git commit -m "feat(mobile): roomier spacing, split section headings, CTA facts grid, footer tap targets"
```

---

### Task 2: `CardSlider` component

**Files:**
- Create: `src/components/ui/card-slider-math.ts`, `src/components/ui/card-slider-math.test.ts`, `src/components/ui/CardSlider.tsx`
- Modify: `src/app/globals.css` (add the `no-scrollbar` utility)

**Interfaces:**
- Consumes: `--gutter` from Task 1
- Produces:
  - `nearestSlide(starts: readonly number[], scrollLeft: number, maxScroll: number): number`
  - `clampIndex(i: number, count: number): number`
  - `SLIDE_CLASS: string`
  - `<CardSlider as?="div"|"ol"|"ul" label: string count: number className?: string>{slides}</CardSlider>`
  - DOM hooks used by `slider-test.mjs`: wrapper `div` > track (`data-slider-track`) with slides (`data-slide`), followed by the strip containing `data-slider-counter` and `data-slider-dot` buttons.

- [ ] **Step 1: Write the failing test** `src/components/ui/card-slider-math.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clampIndex, nearestSlide } from "./card-slider-math";

const starts = [0, 300, 600, 900]; // 4 slides, 300px apart

describe("nearestSlide", () => {
  it("is 0 at the start", () => {
    expect(nearestSlide(starts, 0, 800)).toBe(0);
  });
  it("picks the closest snap position", () => {
    expect(nearestSlide(starts, 140, 800)).toBe(0);
    expect(nearestSlide(starts, 160, 800)).toBe(1);
    expect(nearestSlide(starts, 610, 800)).toBe(2);
  });
  it("is the last slide at the end of the track even if it can't reach its own start", () => {
    expect(nearestSlide(starts, 800, 800)).toBe(3);
    expect(nearestSlide(starts, 799, 800)).toBe(3);
  });
  it("is 0 when the track does not overflow (desktop grid)", () => {
    expect(nearestSlide(starts, 0, 0)).toBe(0);
  });
  it("is 0 with no slides", () => {
    expect(nearestSlide([], 50, 100)).toBe(0);
  });
});

describe("clampIndex", () => {
  it("keeps the index inside the slide range", () => {
    expect(clampIndex(-1, 4)).toBe(0);
    expect(clampIndex(2, 4)).toBe(2);
    expect(clampIndex(9, 4)).toBe(3);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.** `npm test -- src/components/ui/card-slider-math.test.ts` → FAIL, `Failed to resolve import "./card-slider-math"`.

- [ ] **Step 3: Implement** `src/components/ui/card-slider-math.ts`:

```ts
/**
 * Index of the slide whose snap position is closest to the track's current scroll.
 * `starts[i]` is the scrollLeft that lines slide i up with the track's leading padding.
 * At (or within 2px of) the end of the track the last slide is active, because trailing
 * slides can't always scroll all the way to their own start.
 */
export function nearestSlide(starts: readonly number[], scrollLeft: number, maxScroll: number): number {
  if (starts.length === 0 || maxScroll <= 0) return 0;
  if (scrollLeft >= maxScroll - 2) return starts.length - 1;
  let best = 0;
  for (let i = 1; i < starts.length; i++) {
    if (Math.abs(starts[i] - scrollLeft) < Math.abs(starts[best] - scrollLeft)) best = i;
  }
  return best;
}

export function clampIndex(i: number, count: number): number {
  return Math.max(0, Math.min(count - 1, i));
}
```

- [ ] **Step 4: Run the test and confirm it passes.** Same command → PASS (6 tests).

- [ ] **Step 5: Add the scrollbar utility** to `src/app/globals.css`, after `@utility check-icon { ... }`:

```css
/* Hides a scroll container's scrollbar but keeps it scrollable. */
@utility no-scrollbar {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 6: Create** `src/components/ui/CardSlider.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState, type ElementType, type KeyboardEvent, type ReactNode } from "react";
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
  const Tag = as as ElementType;
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
              className="flex h-11 items-center px-1.5"
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
```

- [ ] **Step 7: Verify.** `npm test` (all pass, now 49 tests), `npx tsc --noEmit` clean, `npm run lint` 0 errors, and `npm run build` succeeds. No page uses the component yet, so no screenshots are needed. Behaviour is verified in Tasks 3, 5 and 6.

- [ ] **Step 8: Commit.**
```bash
git add src/components/ui/card-slider-math.ts src/components/ui/card-slider-math.test.ts src/components/ui/CardSlider.tsx src/app/globals.css
git commit -m "feat(mobile): CardSlider with swipe, counter strip and keyboard support"
```

---

### Task 3: Home sliders (Why SerenEdge, How we work)

**Files:**
- Modify: `src/components/home/WhyFlow.tsx`, `src/components/home/HowSteps.tsx`

**Interfaces:**
- Consumes: `CardSlider`, `SLIDE_CLASS` from `@/components/ui/CardSlider`
- Produces: two sliders on `/` (`label`s "Why SerenEdge" and "How we work steps")

- [ ] **Step 1: `WhyFlow.tsx`**
  - Add `import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";`.
  - In `Step`, change the `article` to `<article data-slide className={cn("why-step flex min-w-0 flex-col gap-3", SLIDE_CLASS)}>` and the paragraph to `<p className="text-[15px] leading-relaxed text-muted max-lg:text-base">{children}</p>`.
  - In `WhyLink`, append `max-lg:hidden` to the outer `span`'s className.
  - The section's inner `div className="flex flex-col gap-12"` → `className="flex flex-col gap-12 max-lg:gap-10"`.
  - Replace the grid element:
    ```tsx
    <div className="why-flow grid grid-cols-1 items-start lg:grid-cols-[...] xl:grid-cols-[...]">
      ...
    </div>
    ```
    with:
    ```tsx
    <CardSlider
      label="Why SerenEdge"
      count={3}
      className="why-flow grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)_56px_minmax(0,1fr)]"
    >
      ...same three Steps and two WhyLinks, unchanged...
    </CardSlider>
    ```
    The className must be byte-identical to the old grid `div`'s.
  - The GSAP code is unchanged. The connector scrub already runs only under `wide`.

- [ ] **Step 2: `HowSteps.tsx`**
  - Add `import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";`.
  - Replace `<ol className="how-steps grid gap-8 sm:grid-cols-2 xl:grid-cols-4">` … `</ol>` with `<CardSlider as="ol" label="How we work steps" count={PROCESS.length} className="how-steps grid gap-8 sm:grid-cols-2 xl:grid-cols-4">` … `</CardSlider>`.
  - Each `li`:
    ```tsx
    <li
      key={s.num}
      data-slide
      className={cn(
        "how-step flex flex-col gap-4",
        SLIDE_CLASS,
        "max-lg:rounded-lg max-lg:border max-lg:border-line max-lg:bg-white max-lg:p-6",
      )}
    >
    ```
  - The rail `span` (`relative h-0.5 grow ...`) → append `max-lg:hidden`.
  - Paragraph → `className="text-[15px] leading-relaxed text-muted max-lg:text-base"`.
  - Replace the `useGSAP` body so the rail fill only runs at 901px and above:
    ```tsx
      const mm = gsap.matchMedia();
      mm.add(
        { ok: MOTION.ok, wide: "(min-width: 901px)" },
        (ctx) => {
          const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
          if (!ok) return;
          gsap.from(".how-step", {
            autoAlpha: 0,
            y: 28,
            stagger: 0.1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: ".how-steps", start: "top 80%", once: true },
          });
          if (!wide) return;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: ".how-steps", start: "top 85%", end: "top 35%", scrub: true },
          });
          gsap.utils.toArray<HTMLElement>(".how-step", ref.current).forEach((step) => {
            const dot = step.querySelector(".how-dot:not(.how-dot--solid)");
            const line = step.querySelector(".how-line");
            if (dot) tl.to(dot, { backgroundColor: "#5b8ac5", color: "#ffffff", duration: 0.2 });
            if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1 });
          });
        },
        ref,
      );
    ```

- [ ] **Step 3: Verify.** Run the standard verification block.
  - Desktop diff `0 px differ` on all four pages.
  - Slices for `PAGES=/` at 390 and 768. **Looks like:**
    - "Why SerenEdge" shows one card (mockup plus text) with the next card peeking in on the right, and a `01 / 03` counter with a pill dot underneath; the dashed connectors are gone;
    - "How we work" shows white bordered step cards in a slider with `01 / 04`; no stretched rail lines.
  - Slider test: `bash -c 'cd "SP" && PAGES=/ node slider-test.mjs'` → `ALL SLIDER CHECKS PASSED`, 2 sliders on `/`, including the desktop crossover pass.

- [ ] **Step 4: Commit.**
```bash
git add src/components/home/WhyFlow.tsx src/components/home/HowSteps.tsx
git commit -m "feat(mobile): swipeable Why SerenEdge and How we work cards on Home"
```

---

### Task 4: Home hero, client portal and developer block

**Files:**
- Modify: `src/components/home/Hero.tsx`, `src/components/home/ClientPortal.tsx`, `src/components/home/DevJoin.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: nothing other tasks use

- [ ] **Step 1: `Hero.tsx`**: append `max-lg:min-h-0` to the `section`'s className. This removes the empty space under the CTAs on phones; the top padding still clears the nav.

- [ ] **Step 2: `ClientPortal.tsx`**
  - `h2` → `<span className="text-accent max-lg:block">See your project,</span> any time.`
  - Checklist `li` first class string: append `max-lg:py-4`.
  - The budget paragraph → `className="text-[15px] leading-relaxed text-muted max-lg:text-base"`.
  - URL `em` → `className="ml-3 font-mono text-xs not-italic text-muted max-lg:min-w-0 max-lg:truncate"`.
  - Stats grid `div` → `className="grid gap-3 max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-md max-sm:border max-sm:border-line max-sm:bg-surface sm:grid-cols-3"`.
  - Each stat `div` → `className={cn("flex min-w-0 flex-col gap-1 rounded-md border border-line bg-surface p-3.5 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-0.5 max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 max-sm:bg-transparent max-sm:px-4 max-sm:py-3 max-sm:last:border-b-0", lit(k))}`.
  - Stat value `b` → `className="font-display text-xl leading-[1.2] max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1 max-sm:text-right max-sm:text-lg"`.
  - The label (`Eyebrow`) and note (`small`) keep their classes. With the grid above they stack in column 1 while the value sits on the right.

- [ ] **Step 3: `DevJoin.tsx`**
  - `Button` → `className="shrink-0 max-md:w-full"`.
  - Paragraph → `className="max-w-[620px] text-[15px] leading-relaxed text-muted max-lg:text-base"`.

- [ ] **Step 4: Verify.** Run the standard verification block.
  - Desktop diff `0 px differ` on all four pages.
  - Slices for `PAGES=/` at 360, 390 and 768. **Looks like:**
    - the hero ends right after the two buttons, and the "Why SerenEdge" heading follows without a big blank band;
    - the sample dashboard's address bar is one line ending in "…";
    - at 360 and 390 the three stats are one bordered box of three rows (label and note left, value right); at 768 they are the familiar row of three boxes;
    - the "Join as a developer" button is full width at 390.
  - `bash -c 'cd "SP" && OUT=shots SIZES=360x780 node shoot.mjs'` → Home `horizontal overflow px: 0`.

- [ ] **Step 5: Commit.**
```bash
git add src/components/home/Hero.tsx src/components/home/ClientPortal.tsx src/components/home/DevJoin.tsx
git commit -m "feat(mobile): tighter hero, list-style dashboard stats, full-width developer CTA"
```

---

### Task 5: About page (spacing, name breakdown, journey slider)

**Files:**
- Modify: `src/components/about/AboutHero.tsx`, `src/components/about/NameBreakdown.tsx`, `src/components/about/Journey.tsx`

**Interfaces:**
- Consumes: `CardSlider`, `SLIDE_CLASS`
- Produces: one slider on `/about` (label "Our journey")

- [ ] **Step 1: `AboutHero.tsx`**: append `max-lg:gap-8` to the `section`'s className.

- [ ] **Step 2: `NameBreakdown.tsx`**
  - `SplitHeading` content → `<span className="text-accent max-lg:block">The name.</span> It says it plainly.`
  - The section's inner `div className="flex flex-col gap-16"` → `className="flex flex-col gap-16 max-lg:gap-12"`.
  - First meta: `className={cn(meta, "pt-5 max-sm:pt-8")}`.
  - Second meta: `className={cn(meta, "mt-4 border-t border-line pt-4 sm:mt-0 sm:border-t-0 max-sm:mt-6 max-sm:pt-6")}`.

- [ ] **Step 3: `Journey.tsx`**
  - Add `import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";`.
  - Add, after the `rail` constant:
    ```tsx
    const slide = cn(
      "j-item flex flex-col items-center gap-4 text-center",
      SLIDE_CLASS,
      "max-lg:items-start max-lg:rounded-lg max-lg:border max-lg:border-line max-lg:bg-white max-lg:p-6 max-lg:text-left",
    );
    ```
  - Heading → `<span className="text-accent max-lg:block">On the record.</span> How we got here.`
  - The section's inner `div className="flex flex-col gap-16"` → `className="flex flex-col gap-16 max-lg:gap-10"`.
  - Replace `<ol className="journey grid gap-8 lg:grid-cols-3">` … `</ol>` with `<CardSlider as="ol" label="Our journey" count={3} className="journey grid gap-8 lg:grid-cols-3">` … `</CardSlider>`.
  - Each of the three `li` → `<li data-slide className={slide}>`.
  - Each dot-row `div className="relative flex h-4 w-full justify-center"` → `className="relative flex h-4 w-full justify-center max-lg:justify-start"`.
  - Replace the `useGSAP` body so the rail draw only runs at 901px and above:
    ```tsx
      const mm = gsap.matchMedia();
      mm.add(
        { ok: MOTION.ok, wide: "(min-width: 901px)" },
        (ctx) => {
          const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
          if (!ok) return;
          gsap.from(".j-item", {
            autoAlpha: 0,
            y: 24,
            stagger: 0.12,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: ".journey", start: "top 80%", once: true },
          });
          if (wide) {
            gsap.from(".j-line", {
              scaleX: 0,
              ease: "none",
              stagger: 0.5,
              scrollTrigger: { trigger: ".journey", start: "top 75%", end: "top 35%", scrub: true },
            });
          }
          gsap.to(".j-pulse", { scale: 1.6, autoAlpha: 0, duration: 1.8, ease: "power2.out", repeat: -1 });
        },
        ref,
      );
    ```

- [ ] **Step 4: Verify.** Run the standard verification block.
  - Desktop diff `0 px differ` on all four pages.
  - Slices for `PAGES=/about` at 390 and 768. **Looks like:**
    - the Seren/Edge notes have clear breathing room;
    - "On the record" shows left-aligned white milestone cards in a slider with `01 / 03`, with the "Now" card's pulsing dot visible.
  - `bash -c 'cd "SP" && PAGES=/,/about node slider-test.mjs'` → `ALL SLIDER CHECKS PASSED` (3 sliders).

- [ ] **Step 5: Commit.**
```bash
git add src/components/about/AboutHero.tsx src/components/about/NameBreakdown.tsx src/components/about/Journey.tsx
git commit -m "feat(mobile): About spacing and swipeable journey timeline"
```

---

### Task 6: Services page (full-width service rows, process slider)

**Files:**
- Modify: `src/app/services/page.tsx`, `src/components/services/ServiceList.tsx`, `src/components/services/ProcessCards.tsx`

**Interfaces:**
- Consumes: `CardSlider`, `SLIDE_CLASS`, `Reveal` (`selector` prop)
- Produces: one slider on `/services` (label "Engagement steps")

- [ ] **Step 1: `services/page.tsx`**: the hero `Button` → `<Button href="/contact" arrow className="max-sm:w-full">`.

- [ ] **Step 2: `ServiceList.tsx`**: drop the number column below 901px.
  - Service row `li`: append `max-lg:grid-cols-1 max-lg:gap-y-3 max-lg:py-7` to its className string.
  - Description `p`: append `max-lg:col-start-1 max-lg:text-base`.
  - Tags `ul`: append `max-lg:col-start-1`.
  - "What you get" `button`: append `max-lg:col-start-1`.
  - Disclosure `div` (`id={`more-${s.num}`}`): add `max-lg:col-start-1` to its base class string.
  - "Something weird" `li`: append `max-lg:grid-cols-1 max-lg:gap-y-3 max-lg:py-7`; its `p`: append `max-lg:col-start-1 max-lg:text-base`; its `Link`: append `max-lg:col-start-1`.

- [ ] **Step 3: `ProcessCards.tsx`**
  - Add `import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";`.
  - The section's inner `div className="flex flex-col gap-16"` → `className="flex flex-col gap-16 max-lg:gap-10"`.
  - Replace:
    ```tsx
    <Reveal as="ol" stagger={0.12} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      ...
    </Reveal>
    ```
    with:
    ```tsx
    <Reveal selector="[data-slide]" stagger={0.12}>
      <CardSlider as="ol" label="Engagement steps" count={PROCESS.length} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        ...
      </CardSlider>
    </Reveal>
    ```
    `Reveal` still animates the same four `li`s with the same stagger, so desktop motion is unchanged.
  - Each `li`: add `data-slide`, and use `className={cn("flex flex-col gap-4 rounded-lg border p-8 shadow-1", SLIDE_CLASS, "max-lg:p-6", dark ? "border-ink bg-ink text-white" : "border-line bg-white")}`.
  - Card paragraph → `className={cn("grow text-[15px] leading-relaxed max-lg:text-base", dark ? "text-on-dark" : "text-muted")}`.

- [ ] **Step 4: Verify.** Run the standard verification block.
  - Desktop diff `0 px differ` on all four pages.
  - Slices for `PAGES=/services` at 390 and 768. **Looks like:**
    - each service row has its number as a small blue label above the name, with the description and tags using the full width;
    - the process cards are a slider with `01 / 04`, the last card dark.
  - `bash -c 'cd "SP" && node slider-test.mjs'` → `ALL SLIDER CHECKS PASSED` (4 sliders across `/`, `/about`, `/services`).
  - Tap-check the "What you get" toggle: in the 390px slices, the first row's toggle is visible.

- [ ] **Step 5: Commit.**
```bash
git add src/app/services/page.tsx src/components/services/ServiceList.tsx src/components/services/ProcessCards.tsx
git commit -m "feat(mobile): full-width service rows and swipeable process cards"
```

---

### Task 7: Contact page comfort

**Files:**
- Modify: `src/components/contact/ContactForm.tsx`, `src/components/contact/DirectContact.tsx`, `src/app/contact/page.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: nothing other tasks use

- [ ] **Step 1: `ContactForm.tsx`**
  - `fieldCls`: append ` max-lg:text-base` at the end of the string. 16px inputs also stop iOS Safari zooming in on focus.
  - Topic chips container → `className="flex flex-wrap gap-1.5 max-lg:gap-2"`.
  - Chip base class string → `"h-8 shrink-0 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-95 max-lg:h-10 max-lg:px-4 max-lg:text-sm"`.

- [ ] **Step 2: `DirectContact.tsx`**
  - Root `div` → `className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-7 max-sm:p-5"`.
  - Location `span` → `className="flex items-center gap-3 text-[15px] text-muted max-lg:text-base"`.

- [ ] **Step 3: `contact/page.tsx`**: the layout grid `div` → append `max-lg:gap-12`.

- [ ] **Step 4: Verify.** Run the standard verification block.
  - Desktop diff `0 px differ` on all four pages.
  - Slices for `PAGES=/contact` at 360, 390 and 768. **Looks like:**
    - topic chips are comfortable 40px pills wrapping onto neat rows;
    - input text is 16px;
    - the direct-contact card has less inner padding at phone width;
    - there's clear space between the direct-contact card and the form.
  - `npm test` still passes (the contact action tests are unaffected).

- [ ] **Step 5: Commit.**
```bash
git add src/components/contact/ContactForm.tsx src/components/contact/DirectContact.tsx src/app/contact/page.tsx
git commit -m "feat(mobile): comfortable contact form chips, 16px inputs and spacing"
```

---

### Task 8: Bug fixes ("We build" spacing, reduced-motion marquee)

**Files:**
- Modify: `src/components/home/WordRotator.tsx`, `src/components/services/ToolMarquee.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: nothing other tasks use

**Root causes (measured in Chromium):**
- **Rotator:** the `{" "}` after "We build" is dropped as trailing whitespace in the flex container's anonymous text item, so it contributes 0px. The word box's grid column sizes to the widest word while its inline width is the current word's width, and `justify-items-center` centres each word in that wider column. Measured gaps: 10, 36, 20, 0 and 27px at 390px, against a normal space of 5.03px.
- **Marquee:** under reduced motion the first `<ul>` stays `shrink-0` and max-content wide, so it never wraps, and the overflow-hidden viewport clips all but 2 tools (390px) or 8 tools (1440px).

- [ ] **Step 1: Confirm the check fails.** Build, start the server (standard block step 1), then run `bash -c 'cd "SP" && node bugfix-check.mjs'`. Expected: FAIL, 12 failures (5 gaps plus 1 marquee at each of 390 and 1440px).

- [ ] **Step 2: `WordRotator.tsx`**
  - Remove `{" "}` after "We build" (the text line becomes just `We build`).
  - Box `span` className → `"ml-[0.23em] inline-grid grid-cols-[100%] justify-items-start text-ink"`. 0.23em matches Geist's measured space width: 5.03px at 22px and 7.31px at 32px.

- [ ] **Step 3: `ToolMarquee.tsx`**: each copy's `ul` className → `cn("flex shrink-0 motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center", copy === 1 && "motion-reduce:hidden")`.

- [ ] **Step 4: Verify.**
  - Rebuild and restart (standard block step 1).
  - `bash -c 'cd "SP" && node bugfix-check.mjs'` → `BUG FIX CHECKS PASSED`: every gap within ±1px of the space, and 21/21 tools visible at 390 and 1440.
  - Desktop diff: `bash -c 'cd "SP" && OUT=shots SIZES=1440x900 node shoot.mjs && node diff.mjs'`. Expected:
    - about and contact: `0 px differ`;
    - home: differs only inside the hero rotator line (the box's y-range must sit within the hero, above the "Why SerenEdge" heading);
    - services: may change size (the marquee grows into a wrapped grid, making the page taller). Open `SP/shots/services-1440.png` and confirm everything above the Toolbox section is unchanged by comparing it with `SP/baseline/services-1440.png` visually.
  - Record all diff numbers and boxes in the report.
  - Slices `PAGES=/,/services` at 390: "We build web platforms." reads with one normal space; with reduced motion the toolbox shows all tools wrapped and centred.
  - Lint, tsc, test.

- [ ] **Step 5: Commit.**
```bash
git add src/components/home/WordRotator.tsx src/components/services/ToolMarquee.tsx
git commit -m "fix: single space before the rotating word; show every tool in the reduced-motion marquee"
```
