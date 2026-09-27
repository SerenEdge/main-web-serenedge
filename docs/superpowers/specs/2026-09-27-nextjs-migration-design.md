# SerenEdge website: Next.js migration design

Date: 2026-09-27
Status: Approved in brainstorming, pending written-spec review

## 1. Goal

Turn the static SerenEdge mock (4 HTML pages, one CSS file, one JS file) into a Next.js web app that:

- keeps the current visual design (tokens, typography, layout, copy),
- adds smooth, immersive scroll motion with GSAP and buttery scrolling with Lenis,
- routes Home, About, Services and Contact properly,
- sends real emails from the contact form through Resend: a branded confirmation to the submitter and a notification with a quick-reply button to daham@serenedge.com,
- removes WhatsApp from every contact surface (phone is a direct call only).

Success means that all four routes match the mock visually on desktop and mobile, motion runs at 60fps with no scroll jank, reduced-motion users get a static site, and a form submission (once `RESEND_API_KEY` is set) delivers two emails whose logo renders in Gmail, Outlook and Apple Mail, including dark mode.

### What the user specified vs. what was assumed

| Specified by user | Assumed / decided in brainstorming |
|---|---|
| Next.js app in repo root; mock moved to `design-mock/` first | Deploy target is Vercel |
| Pages: Home, About, Services, Contact; **one** contact page, no `/book` route | Current copy and design are kept; this is a port plus motion, not a redesign |
| GSAP scroll animation, Lenis smooth scroll | All current `main.js` behaviours are rebuilt, not dropped |
| Resend, token in env | `serenedge.com` will be verified in Resend |
| Emails sent from sales@serenedge.com | |
| Confirmation to submitter; notification to daham@serenedge.com with quick-reply | |
| Company colours and logo in both emails; CID inline logo | |
| Remove WhatsApp | |
| Tailwind v4 rewrite (not a CSS port) | |
| Optional phone + company fields | |
| Subtle page transition between routes | |

## 2. Phase 0: move the mock

Before scaffolding, and as its own commit:

1. `git add` the currently untracked mock files, then `git mv` them into `design-mock/`:
   `index.html`, `about.html`, `services.html`, `book.html`, `css/`, `js/`, `img/`, `fonts/`.
2. Commit: `chore: move static mock into design-mock/`.
3. The mock stays untouched afterwards. It is the visual reference and still opens directly in a browser (all its paths are relative, so it keeps working inside the folder).

Then scaffold in the repo root with `npx create-next-app@latest .` (TypeScript, ESLint, App Router, Tailwind CSS, `src/` directory, import alias `@/*`, npm). Fonts and images are **copied** (not moved) from `design-mock/` into the app so the mock keeps rendering.

`README.md` is rewritten to describe the app, its env vars and scripts, and the `design-mock/` folder.

## 3. Architecture

- **Framework:** Next.js latest (App Router), React Server Components by default, TypeScript strict.
- **Styling:** Tailwind CSS v4 with the mock's tokens declared in `@theme`.
- **Motion:** `gsap` + `@gsap/react` (`useGSAP`), plugins `ScrollTrigger` and `SplitText`; `lenis` for smooth scroll.
- **Email:** `resend` + `@react-email/components`; validation with `zod`.
- **Pattern:** pages and static sections are Server Components. Animation lives in small `"use client"` components that wrap a section and scope their GSAP work to their own ref. The form posts through a Server Action.

### 3.1 File layout

```
design-mock/                 untouched static mock (reference)
docs/superpowers/            specs and plans
public/
  img/                       Founder-daham.webp, OG-page.png, logo.png, Base Logo - Light/Dark.png, hero bg
  logos/                     tool SVGs for the marquee
src/
  app/
    layout.tsx               <html>, next/font/local fonts, default metadata, <SmoothScroll>, <Nav>, <Footer>
    template.tsx             route-change page transition wrapper
    page.tsx                 Home
    about/page.tsx
    services/page.tsx
    contact/page.tsx         Let's talk
    contact/actions.ts       "use server" sendContact()
    globals.css              tailwind import, @theme tokens, @utility helpers, base layer
    icon.ico                 from img/icons/Base Logo - Dark.ico
    opengraph-image.png      from img/OG-page.png
    sitemap.ts, robots.ts
  components/
    layout/  Nav.tsx (client), Footer.tsx, CtaPanel.tsx
    ui/      Button.tsx, Eyebrow.tsx, InfMark.tsx, ArrowIcon.tsx, Tag.tsx
    motion/  SmoothScroll.tsx, Reveal.tsx, SplitHeading.tsx, PageTransition.tsx
    home/    Hero.tsx, WordRotator.tsx, WhyFlow.tsx, ClientPortal.tsx, DevJoin.tsx, HowSteps.tsx
    about/   AboutHero.tsx, NameBreakdown.tsx, Journey.tsx
    services/ServicesHero.tsx, ServiceList.tsx, ProcessCards.tsx, ToolMarquee.tsx
    contact/ ContactForm.tsx (client), DirectContact.tsx, NextSteps.tsx, SentState.tsx
  emails/
    components/EmailShell.tsx
    ClientConfirmation.tsx
    TeamNotification.tsx
    assets/logo-email.png
  lib/
    site.ts                  contact details, nav links, services, process steps, tools, topics
    contact-schema.ts        zod schema shared by client and server
    gsap.ts                  registers plugins once, exports gsap/ScrollTrigger/SplitText
    email.ts                 Resend client factory + send helpers
.env.example
```

Each unit has one purpose. Components receive data from `lib/site.ts` rather than hard-coding lists, so one edit to the services list updates the services page, the contact topic chips and the footer.

### 3.2 Routes

| Route | Source mock | Notes |
|---|---|---|
| `/` | `index.html` | |
| `/about` | `about.html` | |
| `/services` | `services.html` | Rows link to `/contact?topic=<slug>` |
| `/contact` | `book.html` | Nav label "Let's talk". The only contact page. |

There is no `/book` route or redirect. Every link that pointed at `book.html` points at `/contact`. Nav: About · Services · Let's talk (CTA button). Active link gets `aria-current="page"`.

Per-page `metadata` (title, description, canonical, Open Graph) is carried over from each mock page's `<head>`, with canonicals `https://serenedge.com/`, `/about`, `/services`, `/contact`. `metadataBase` is `https://serenedge.com`.

### 3.3 Content changes

- **WhatsApp removed** from footer contact list, CTA fact blocks ("Phone / WhatsApp" becomes "Phone") and the contact page direct card ("· Phone / WhatsApp" becomes "· Call us"). No `wa.me` links anywhere.
- Contact page success copy no longer mentions "your email app should have opened"; it confirms that a confirmation email is on its way.
- All other copy is unchanged from the mock.

## 4. Styling (Tailwind v4)

`globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-ink: #0b0d12;
  --color-ink-2: #262b35;
  --color-muted: #5b6470;
  --color-soft: #8f98a6;
  --color-on-dark: #c4cad3;
  --color-line: #dfe3e9;
  --color-line-2: #c9d3e0;
  --color-surface: #f6f7f9;
  --color-surface-2: #edf0f4;
  --color-accent: #5b8ac5;
  --color-danger: #b42318;
  --color-ok: #1a7f4b;

  --font-sans: var(--font-geist), system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-display: var(--font-candid), var(--font-geist), system-ui, sans-serif;

  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px; --radius-xl: 24px;
  --shadow-1: 0 1px 2px rgba(11,13,18,.06);
  --shadow-2: 0 8px 24px rgba(11,13,18,.10);
  --ease-out-expo: cubic-bezier(.16,1,.3,1);
}
```

- Layout variables `--gutter: clamp(20px,5.6vw,80px)` and `--section-y: clamp(72px,9vw,128px)` live on `:root` and are used as `px-(--gutter)` / `py-(--section-y)`.
- Fluid type from the mock (`clamp(...)` sizes for hero, h2, h3) is kept via arbitrary values wrapped in small reusable components (`<Eyebrow>`, heading classes defined with `@utility` such as `h2-display`, `hero-display`).
- The infinity brand mark becomes `@utility inf-mask` (SVG data-URI mask) used by `<InfMark>`, eyebrow ornaments, list bullets and the footer mark.
- One-off visuals that are awkward as utilities (conic-gradient progress ring, dotted vignette background, marquee edge mask) go in a small `@layer components` block.
- Fonts: `next/font/local` for `geist-latin.woff2` + `geist-latin-ext.woff2` (variable weight), `geist-mono-latin.woff2`, and `candid.otf`, exposed as CSS variables.
- Breakpoints follow the mock: 640, 760, 900, 1100px (custom `@theme` breakpoints where Tailwind defaults differ).
- The mock's `prefers-reduced-motion` rules are kept (CSS transitions disabled); GSAP handles the rest (section 5).

## 5. Motion system

### 5.1 Infrastructure

- `lib/gsap.ts` registers `ScrollTrigger`, `SplitText` and `useGSAP` once, client-side only.
- `SmoothScroll.tsx` (client, mounted in root layout) creates **one** Lenis instance: `lerp: 0.1`, `smoothWheel: true`, native touch scrolling.
  - Sync: `lenis.on('scroll', ScrollTrigger.update)`; `gsap.ticker.add(t => lenis.raf(t * 1000))`; `gsap.ticker.lagSmoothing(0)`. There is a single RAF loop for the whole site.
  - The instance is exposed through React context (`useLenis()`) for `scrollTo`, velocity reads and stop/start (the mobile menu stops scroll while open).
  - In-page anchors and the "Skip to content" link use `lenis.scrollTo`.
  - `html { scroll-behavior: smooth }` from the mock is removed (it conflicts with Lenis).
- Every animated component uses `useGSAP(fn, { scope: ref })`, so tweens, ScrollTriggers and SplitText instances revert on unmount. Nothing leaks between routes.
- `ScrollTrigger.refresh()` runs after `document.fonts.ready` and after the page transition finishes.
- **Reduced motion:** all animation is created inside `gsap.matchMedia()`. Under `(prefers-reduced-motion: reduce)` Lenis is not started, and elements are set to their final state with no tweens. Pinning is disabled.
- **No-JS / SSR safety:** server HTML renders content fully visible. Initial hidden states are applied by GSAP on mount (`gsap.set` inside `useGSAP`, which runs before paint via layout effect), so there is no flash and no invisible content if JS fails.
- **Motion tokens:** eases `expo.out` and `power3.out`; durations 0.6–1.1s; stagger 0.06–0.1s. Only `transform`, `opacity` and `filter` (the rotator's blur) are animated.

### 5.2 Shared primitives

- `<Reveal>`: fades children up 24px, staggered, when they enter (`start: "top 85%"`, plays once).
- `<SplitHeading as="h2">`: SplitText into masked lines; lines rise from `yPercent: 110` on enter. Uses `autoSplit` so resize re-splits and the tween is rebuilt.
- `<PageTransition>` (used by `template.tsx`): an ink panel covering the viewport wipes up and off (~500ms, `expo.inOut`) when the new route mounts; Lenis jumps to top immediately; hero intros start as the panel clears. It is skipped on first load and under reduced motion.

### 5.3 Per-page motion

**Home**
- **Hero (on load):** eyebrow fades, the two `h1` lines rise out of masks, then rotator, lead and CTAs stagger in. `WordRotator` is a GSAP timeline: every 2.6s the current word exits (up, blur, fade) and the next enters, with the container width tweened to the measured word width (remeasured on resize and after fonts load). On scroll out, the hero content drifts up and fades slightly (scrubbed).
- **Why SerenEdge:** the three steps reveal in sequence; dashed connectors draw with scrubbed `scaleX`; infinity marks pop in. Vignettes animate once: tasks tick off in order, the deadline bar fills to 58%, the portal ring counts 0 → 64%.
- **For clients (pinned):** replaces the mock's manual runway. On viewports ≥901px wide and ≥820px tall the section pins with `end: "+=" + items * 60vh`. Progress selects one of 5 checklist items; the active item and its matching dashboard `data-part` light up while the others dim. The progress bar and counters animate with progress. On smaller viewports there is no pin; items and panel simply reveal.
- **For developers:** block reveals.
- **How we work:** a scrubbed timeline fills the 4 rail lines in turn and switches each dot on (replaces the mock's `--f` math).
- **CTA panel (shared):** scales 0.94 → 1 and eases its corner radius as it enters; facts stagger.

**About**
- Hero headline split intro; body copy reveals. The founder hover card is kept (CSS, desktop only).
- **Name breakdown:** "Seren" and "Edge" slide in from opposite sides (scrubbed), brackets draw with `scaleX`, then the two notes fade up.
- **Journey:** the rail draws scrubbed; the "Now" dot has a soft looping pulse ring; the dashed future segment draws last.

**Services**
- Hero split intro.
- **Service list:** rows stagger in. Desktop (`hover: hover` and `pointer: fine`): the "what you get" card follows the cursor with `gsap.quickTo` (x/y, ~0.4s), flips left near the viewport edge, and appears beside a keyboard-focused row; hovering one row dims the others and shifts the name. Touch: the "What you get" disclosure button toggles the panel with a height animation; `aria-expanded` is kept.
- **Process cards:** stagger rise; the dark card enters last.
- **Tool marquee:** GSAP horizontal loop that speeds up with Lenis scroll velocity and eases back to base speed; it pauses on hover. Under reduced motion it becomes a static wrapped list (as in the mock).

**Contact**
- Hero intro; "what happens next" pips and stems draw in order; the form panel rises.
- Topic chips have a small press/select spring.
- On success the form cross-fades out, the panel height eases to the sent state, and the tick draws via SVG `stroke-dashoffset`.

### 5.4 Nav

- A floating pill header, fixed, as in the mock.
- The mobile menu opens with a GSAP height/opacity tween, closes on Escape, outside click and route change, and stops Lenis while open.

## 6. Contact form and email

### 6.1 Page

The layout follows the mock's book page: hero, then a two-column grid.

- **Left:** "What happens next" (3 steps) and a direct contact card: `sales@serenedge.com` (mailto), `+94 70 488 8440 · Call us` (tel), `Sri Lanka · GMT+5:30`.
- **Right:** the form panel.

Form fields (all come from `lib/site.ts` and `lib/contact-schema.ts`):

| Field | Required | Rule |
|---|---|---|
| topic | yes | one of the service topics + "Something weird"; default "Web Development"; preselected from `?topic=<slug>` |
| name | yes | trimmed, 1–120 chars |
| email | yes | valid email, ≤254 chars |
| phone | no | ≤32 chars, digits/spaces/`+()-` only |
| company | no | ≤120 chars |
| message | yes | trimmed, 10–4000 chars |
| website | hidden | honeypot; must be empty |
| startedAt | hidden | render timestamp; submissions under 3s are rejected as spam |

The submit bar shows a live summary ("{Topic} · 90-minute discovery call · Free") and the submit button with pending state ("Sending…", disabled).

### 6.2 Flow

1. `ContactForm` (client) holds form state, validates with the shared zod schema on submit, shows inline errors (`aria-invalid`, message under each field, focus moves to the first invalid field) and submits through `useActionState(sendContact)`.
2. `sendContact(prevState, formData)` (Server Action):
   - parses with the same zod schema; on failure returns `{ status: "invalid", fieldErrors }`;
   - honeypot filled or `startedAt` too recent: returns `{ status: "success" }` without sending (bots get no signal);
   - `RESEND_API_KEY` missing: logs a configuration error and returns `{ status: "error", message }`;
   - sends the **team notification** first; if it fails, returns `{ status: "error", message: "We couldn't send your message. Please email sales@serenedge.com directly." }`;
   - then sends the **client confirmation**; if only this fails, logs it and still returns `{ status: "success" }` (the enquiry was received);
   - returns `{ status: "success", topic }`.
3. On success the client shows the sent state with a recap and "Send another message" (resets the form) and "Back home" actions.

Two separate `resend.emails.send` calls are used because Resend's batch endpoint does not support attachments, which the CID logo needs.

### 6.3 Environment

`.env.example` (committed); real values go in `.env.local` (git-ignored by the Next.js default `.gitignore`):

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=daham@serenedge.com
CONTACT_FROM_EMAIL="SerenEdge <sales@serenedge.com>"
```

`CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` fall back to the values above when unset. The same three variables must be added in the Vercel project settings. Prerequisite: `serenedge.com` is verified in Resend (SPF and DKIM records) so mail from `sales@serenedge.com` is accepted and not flagged as spam.

### 6.4 Email design

Both templates are built with React Email components and share `EmailShell`:

- 600px centred table layout, inline styles, `#f6f7f9` page background, white card with 1px `#dfe3e9` border and 20px radius.
- Font stack `-apple-system, "Segoe UI", Helvetica, Arial, sans-serif`. Geist is not loaded (unsupported in most clients).
- Colours: ink `#0b0d12` headings and primary buttons, accent `#5b8ac5` eyebrow labels and links, muted `#5b6470` body text.
- Buttons are bulletproof table-cell buttons (padding on the cell, works in Outlook).
- Footer: "SerenEdge · for each node.", `sales@serenedge.com`, `+94 70 488 8440`, `serenedge.com`.
- `<meta name="color-scheme" content="light">` and `supported-color-schemes` so clients keep the light design where they honour it.

**Logo (CID inline):**
- `src/emails/assets/logo-email.png` is generated from `Base Logo - Dark.png` at about 480px wide with a **solid white background** (not transparent), so the black infinity stays visible in dark-mode inboxes that invert or darken the card.
- It is attached to each send as `{ filename: "serenedge-logo.png", content: <Buffer>, contentId: "serenedge-logo" }` and referenced as `<img src="cid:serenedge-logo" width="120" alt="SerenEdge">`. The alt text is styled in accent blue, bold, so a readable wordmark shows if images are off.
- The file is read with `fs.readFile(path.join(process.cwd(), "src/emails/assets/logo-email.png"))` and bundled for deploy with `outputFileTracingIncludes: { "/contact": ["./src/emails/assets/**"] }` in `next.config.ts`.

**Client confirmation**
- From `CONTACT_FROM_EMAIL`, to the submitter, reply-to `sales@serenedge.com`.
- Subject: `We've got your message · SerenEdge`
- Body:
  - "Thanks, {firstName}." heading and "We'll be in touch within 24 hours to set up your discovery call."
  - recap box: topic, company (if given) and their message
  - "What happens next": the same 3 steps as the page
  - "Prefer to talk? Call +94 70 488 8440" as a secondary button (`tel:`)
  - sign-off: "The SerenEdge team"

**Team notification**
- From `CONTACT_FROM_EMAIL`, to `CONTACT_TO_EMAIL`, **reply-to the client's email**, so the mail app's Reply answers the client directly.
- Subject: `New enquiry · {topic} · {name}` (newlines stripped).
- Body:
  - eyebrow "New enquiry" and heading "{name} wants to talk about {topic}"
  - primary button **"Reply to {firstName}"**: `mailto:{email}?subject=Re: Your SerenEdge enquiry&body=Hi {firstName},%0D%0A%0D%0A` (all parts URL-encoded)
  - secondary button **"Call {phone}"** (`tel:`), only when phone is given
  - details table: name, email (mailto), phone, company, topic, submitted at (formatted in `Asia/Colombo`)
  - message in a quoted block with preserved line breaks

**Both emails:**
- A plain-text version is rendered and sent alongside the HTML.
- All user input is rendered through React (escaped). Nothing user-provided goes into raw HTML or headers other than the sanitised subject and the validated reply-to address.

## 7. Error handling summary

| Situation | Behaviour |
|---|---|
| Invalid fields | Inline errors, no request sent (client) / `invalid` state returned (server) |
| Bot (honeypot / too fast) | Fake success, nothing sent |
| Missing API key | Error message shown with direct email fallback; server log |
| Team email fails | Error message shown with direct email fallback; server log |
| Client email fails only | Success shown; server log |
| JS disabled | The form still posts through the Server Action (progressive enhancement); the server returns the sent state or errors |

## 8. Accessibility and performance

- Skip link, landmark roles, `aria-current`, visible focus rings (accent outline) as in the mock.
- The form uses labels, `aria-invalid`, `aria-describedby` for errors and an `aria-live` region for the result.
- Decorative motion elements are `aria-hidden`; the rotator keeps its `aria-label` listing all words.
- Images use `next/image` with explicit sizes; the hero background is AVIF; the founder photo is lazy.
- Only transforms and opacity are animated; `will-change` is applied only while pinned or tweening.
- Target: Lighthouse ≥90 for performance and 100 for accessibility on every route.

## 9. Testing and verification

- **Unit (Vitest):**
  - `contact-schema`: valid input, each invalid field, optional fields empty, topic slug mapping
  - `sendContact` with Resend mocked: success (both sends called with the right to/from/reply-to/subject and a CID attachment), validation error, honeypot, too-fast submit, missing key, team send failure (no client send, error state), client-only failure (success state)
  - `buildReplyMailto`: correct encoding
- **Email preview:** `npm run email` starts React Email's preview server on `src/emails` to check both templates visually with sample props.
- **Build gates:** `npm run lint`, `npm run build`, `npm test` all pass.
- **Manual:**
  - check each route against `design-mock/` at 1440px, 900px and 390px widths
  - scroll through each page with smooth scroll and pinned sections
  - use OS reduced-motion to confirm a static site
  - navigate via the nav to see page transitions
  - check the mobile menu
  - once the key is set, send a real test submission and check both emails in Gmail (web plus dark mode on mobile) and Outlook

## 10. Out of scope

- A calendar or time-slot picker (the mock's unused calendar styles are dropped).
- CMS, blog or case studies.
- Analytics, cookie banner.
- Rate limiting beyond honeypot and timing (can add Upstash later if spam appears).
- Storing submissions in a database.
- Internationalisation.
