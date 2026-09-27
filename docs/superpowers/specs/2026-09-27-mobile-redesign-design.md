# SerenEdge mobile redesign: design

Date: 2026-09-27
Status: Approved in brainstorming, pending written-spec review
Builds on: `docs/superpowers/specs/2026-09-27-nextjs-migration-design.md` (the shipped Next.js site)

## 1. Goal

On phones and tablets the site currently fits without breaking, but it feels cramped and long compared with desktop. Redesign every layout below 901px so a mobile visitor gets the same calm, spacious experience as a desktop visitor, **without changing the desktop layout at all**.

Success means:
- at 360, 390, 430 and 768px wide, every page has comfortable margins, readable 16px body text, no boxes nested inside boxes, and repeated card groups as swipeable sliders with an animated position counter;
- at 1440px, reduced-motion full-page screenshots of all four pages are pixel-identical to the pre-change baseline, except for the two approved bug fixes in §6;
- no horizontal page overflow at any width (only the sliders scroll sideways, inside themselves);
- lint, typecheck, the 43 existing tests and the build all pass.

### What the user specified vs. what was decided

| Specified by user | Decided in brainstorming |
|---|---|
| Redesign the whole mobile experience; it feels too compact | Scope is every width below 901px (phones and tablets) |
| Do not change anything on desktop | Enforced by only adding `max-lg:`-style variants and by pixel-diffing 1440px screenshots |
| Card groups slide horizontally | One shared `CardSlider` component using native CSS scroll-snap, no new dependency |
| A counter under the cards, animated, highlighting the current card | `01 / 04` counter plus dots; the active dot stretches into an accent pill |
| — | Which groups become sliders, and which layouts stay vertical (§4) |
| — | Two desktop-visible bug fixes are included (§6) |

## 2. Evidence (baseline)

Captured from `main` at `fc6ddd6` with Playwright (Chromium, reduced motion, device scale 1):

- Page heights at 390px: Home 7701px (about 9 screens), Services 6566px, About 3623px, Contact 2530px.
- No horizontal overflow at 390px or 1440px on any page.
- Side margin at 390px resolves to about 22px (`--gutter: clamp(20px, 5.6vw, 80px)`); section padding resolves to 72px.
- Padded cards inside padded containers narrow body text to about 280px (Services process cards, the Home dashboard stats, the CTA facts).
- Services rows keep a 44px number column on mobile, which narrows the content column further.
- Section headings at 34px wrap to 3-4 lines.
- Baseline screenshots are kept in the session scratchpad (`shots/*-1440.png`, `slices/*-390-*.png`) and must be regenerated from the pre-change commit if lost.

## 3. The desktop-freeze rule

Desktop is every width of 901px and above (the existing `lg` breakpoint).

1. **Do not edit any unprefixed class, `sm:`, `md:`, `lg:`, `xl:`, `pin:` or `fine:` class** where the edit would affect widths of 901px and above. Those variants are all min-width, so they apply on desktop too.
2. **Add mobile styling only through max-width variants**: `max-lg:` (below 901px) and, where phones and tablets need to differ, `max-sm:` (below 641px) or `max-md:` (below 761px). Tailwind v4 generates these from the custom breakpoints in `globals.css`.
3. New components may render different markup below 901px only when the desktop output stays byte-for-byte the same, e.g. the slider's counter strip is `lg:hidden`.
4. New CSS in `globals.css` must be scoped inside `@media (width < 56.3125rem)` or a `max-lg:` utility.
5. JavaScript that changes behaviour by width uses `gsap.matchMedia()` or `window.matchMedia("(max-width: 900.98px)")`, never a change to shared desktop logic.

The only exception is the two approved bug fixes in §6, which intentionally change desktop output.

The test for "desktop unchanged" is pixel output at 1440px, not DOM equality. Adding attributes that don't render (ARIA roles and labels) or wrapping elements that don't change layout is acceptable on desktop, provided the pixel diff stays clean.

This rule is the core of the work; reviewers should treat any violation as Important.

## 4. Design

### 4.1 Mobile-wide rules (below 901px)

| Item | Today (at 390px) | New |
|---|---|---|
| Side margin | ~22px | 24px below 641px; 40px from 641 to 900px |
| Section padding (`--section-y`) | 72px | 88px, tuned from screenshots within 80-96px |
| Space between a section heading and its intro / between the intro and the content | ~28px / varies | 24px / 40px |
| Body text | 15px | 16px, line-height 1.65 |
| Intro ("lead") text | ~17px | 18px, line-height 1.6 |
| Section headings | 34px, accent phrase run into the sentence | 34px; the accent phrase ("How we work.", "Toolbox.") sits on its own line, so the heading reads as title plus subtitle |
| Page titles | unchanged size | unchanged size, spacing tidied |
| Tap targets | some 32px (topic chips) | at least 44px for links and buttons; topic chips 40px |
| Nested padding | cards inside padded containers | cards in sliders get 24px padding; nested boxes are flattened where §4.3 says so |

Implementation notes:
- Margin and section spacing are CSS variables today (`--gutter`, `--section-y`). Override them inside `@media (width < 56.3125rem)` in `globals.css` rather than touching every component. Check that nothing at 901px and above reads the overridden values.
- The heading accent split uses a `max-lg:block` on the existing accent `<span>` where a component already wraps the accent phrase in its own span (`SectionIntro`, `CtaPanel`, `NameBreakdown`, `Journey`, `ClientPortal`). No copy changes.

### 4.2 `CardSlider` component

New file `src/components/ui/CardSlider.tsx`, client component.

**Props:** `children` (the cards), `label` (accessible name, e.g. "How we work steps"), `className` (desktop grid classes, passed through unchanged), `itemClassName` (optional, extra classes per card).

**Desktop (901px and above):** renders a single wrapper element with `className` exactly as the caller passes it, children inside, no counter strip. Desktop rendering must be pixel-identical to what the component replaced; non-rendering ARIA attributes are allowed.

**Below 901px:**
- **Track:** the wrapper becomes a horizontal flex track with `overflow-x: auto`, `scroll-snap-type: x mandatory`, a hidden scrollbar, 16px gap, and 24px side padding matching the page margin, so the first card lines up with page content and the last card can centre.
- **Cards:** each card is about 85% of the track width (`max-lg:w-[85%]`, `shrink-0`, `snap-start`, scroll-padding equal to the page margin), so each card lines up with the page margin and the next one peeks in on the right. Centre-snapping was rejected because with 24px margins the last card can't reach the centre. A capped width at tablet widths (max 420px) keeps cards readable there.
- **Scroll:** native touch scrolling only. Lenis smooths wheel input and does not intercept touch, so no conflict; add `data-lenis-prevent` on the track only if wheel or trackpad horizontal scrolling misbehaves in testing.
- **Counter strip** (`lg:hidden`) under the track:
  - a mono counter `01 / 04`;
  - a row of dot buttons, where the active dot animates from an 8px dot to a 24px accent pill (CSS width/background transition, 300ms, `ease-out-expo`) and inactive dots are `bg-line-2`.
- **Active card tracking:** an `IntersectionObserver` on the cards, rooted at the track, threshold 0.6; the most-visible card is active. Fall back to a `scroll` listener with rAF if needed.
- **Dot tap:** scrolls the track so that card lines up with the page margin (`track.scrollTo({ left: slide.offsetLeft - paddingLeft, behavior })`), with `behavior: "auto"` under reduced motion.
- **Accessibility:**
  - the track is `role="region"` with `aria-roledescription="carousel"` and `aria-label={label}`;
  - each card is `role="group"` with `aria-roledescription="slide"` and `aria-label="{n} of {total}"`;
  - dots are `<button>`s with `aria-label="Go to card {n}"` and `aria-current="true"` on the active one;
  - the counter is `aria-live="polite"`;
  - the track is keyboard focusable (`tabIndex={0}`), and ArrowLeft/ArrowRight move to the previous or next card.
- **Scroll reveals:** the existing per-card `Reveal`/GSAP entrance animations stay unchanged at every width, so desktop motion is untouched. Below 901px the cards off-screen to the right simply finish fading in before the visitor swipes to them.

**Hydration:** the component renders the same markup on server and client. Width-dependent behaviour is CSS (`max-lg:`) plus effects that only attach listeners, so no hydration mismatch and no remount (see the SmoothScroll lesson in the migration's final review).

### 4.3 Per page (below 901px)

**Home**
- **Hero:** remove the empty space between the CTA buttons and the next section. The hero's `min-h-[min(860px,100svh)]` becomes `max-lg:min-h-0` with top and bottom padding that keeps the content comfortably on the first screen. Everything else unchanged.
- **Why SerenEdge:** keep `SectionIntro`, then wrap the three `Step` articles in `CardSlider`. Hide the `WhyLink` connectors below 901px. Each slide keeps its vignette on top and the eyebrow, title and text below. The WhyFlow GSAP timeline (stagger, ring count-up, deadline bar fill) still runs; the connector scrub is already desktop-only.
- **For clients:**
  - the checklist stays a vertical list, with more spacing;
  - the dashboard URL bar stays on one line with `truncate`;
  - below 641px the three stat boxes become one bordered list, each row with the label and note on the left and the value on the right (three columns at 390px leave about 94px each, which wraps every label); tablets keep today's 3-column row;
  - the weekly update and change-request list are unchanged apart from spacing.
- **For developers:** the button becomes full width below 901px.
- **How we work:** wrap the four steps in `CardSlider`. Hide the rail lines below 901px. The numbered dot, tag, title and text stay. The rail-fill scrub is disabled below 901px, since there is no rail to fill.
- **CTA panel (shared by Home, About, Services):** buttons stack full width (already true below 641px). The four facts become a 2×2 grid below 901px instead of four stacked rows.
- **Footer:** link rows at least 44px tall below 901px. Layout otherwise unchanged.

**About**
- **Hero:** spacing only.
- **Name breakdown:** spacing between the words, brackets and notes loosened.
- **Journey:** wrap the three milestones in `CardSlider`. Slides are left-aligned below 901px, with the dot and rail at the top of each slide, and the "Now" pulse kept. The rail-draw scrub is disabled below 901px.

**Services**
- **Hero:** CTA full width below 641px.
- **Service list:** below 901px the number moves above the service name as a small accent label, and the name, description, tags and "What you get" toggle take the full width (no 44px column). Rows get more vertical padding. The touch "What you get" disclosure behaviour is unchanged.
- **Process:** wrap the four `ProcessCards` in `CardSlider`, keeping the last card dark.
- **Toolbox:** marquee unchanged, plus the §6 bug fix.

**Contact**
- **What happens next / Direct contact:** spacing only.
- **Form panel:** fieldset side padding drops to 20px below 641px so fields are wider. Topic chips are 40px tall and wrap onto rows. Inputs stay 48px. The submit bar stacks (already true below 641px).

### 4.4 Out of scope

- Any desktop change other than §6.
- Copy changes.
- New sections, new imagery, dark mode.
- A slider library, or new runtime dependencies. Playwright and pixel-diff tooling for verification live outside the repo (session scratchpad), not in `package.json`.

## 5. Motion below 901px

- `Reveal`, `SplitHeading`, hero intro and `PageTransition` keep working as today.
- GSAP ScrollTrigger scrubs that depend on desktop-only elements (WhyFlow connector scrub, HowSteps rail fill, Journey rail draw) do not run below 901px. They already sit inside `gsap.matchMedia()`; add a `(min-width: 901px)` condition where one is missing.
- Reduced motion: sliders still swipe; dot taps jump instantly; the pill still changes, but its transition is disabled via `motion-reduce:transition-none`.

## 6. Bug fixes (also visible on desktop, approved)

1. **"We build" spacing** (`src/components/home/WordRotator.tsx`). Measured in Chromium at 390 and 1440px:
   - the literal `{" "}` after "We build" is dropped as trailing whitespace at the end of the flex container's anonymous text item, so it contributes 0px;
   - the word box's inline width is set to the current word's width, but its grid column track sizes to the widest word, and `justify-items-center` centres the current word in that wider track, which puts about 10px (2 spaces) before "web platforms.".
   - **Fix:** make the track follow the box width (`grid-cols-[100%]` or `grid-template-columns: 100%`), align words to the start (`justify-items-start`), and give the box a leading margin of one word space (`ml-[0.28em]`, tuned against a measured space width). Remove the ineffective `{" "}`.
   - **Target:** the measured gap between the end of "We build" and the start of the current word equals one normal space (±1px) at 390 and 1440px, for every word.
2. **Toolbox marquee under reduced motion** (`src/components/services/ToolMarquee.tsx`). The first `<ul>` copy is `shrink-0`, so under reduced motion it stays max-content wide, never wraps, and all but about 2 logos are clipped by the overflow-hidden viewport.
   - **Fix:** under `motion-reduce:`, let the first copy take the full width and wrap (`motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center`), keeping the second copy hidden.
   - **Target:** all 21 tools visible in a wrapped grid at 390 and 1440px under reduced motion.

These two are the only allowed differences in the 1440px pixel diff.

## 7. Verification

**Screenshot tooling:** Playwright + Chromium in the session scratchpad, with scripts `shoot.mjs` (full-page) and `slice.mjs` (viewport-height slices). Run against `npm run build && npm run start` on a free port, with `reducedMotion: "reduce"` so every section is visible and deterministic.

**Desktop freeze:**
- full-page 1440px screenshots of all four pages, pre-change vs post-change, pixel-diffed (pixelmatch, threshold 0);
- the only non-zero diffs allowed are the "We build" line on Home and the Toolbox marquee block on Services;
- any other diff is a failure.

**Mobile:**
- sliced screenshots at 360, 390, 430 and 768px for all four pages, reviewed for the §4 rules;
- `document.documentElement.scrollWidth === innerWidth` at each width (no page-level horizontal overflow).

**Slider behaviour** (Playwright, 390px, motion enabled):
- scrolling a slider's track to card 3 updates the counter to `03 / 0N` and moves `aria-current` to dot 3;
- clicking dot 1 brings card 1 to the centre;
- ArrowRight on the focused track advances one card.

**Regression:** `npm run lint`, `npx tsc --noEmit`, `npm test` (43 passing), `npm run build`.

**Human pass still needed:** real-device touch feel (momentum, snap on iOS Safari), which Chromium emulation approximates but doesn't reproduce exactly.
