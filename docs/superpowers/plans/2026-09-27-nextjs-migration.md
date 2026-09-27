# SerenEdge Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static SerenEdge mock with a Next.js app (Home, About, Services, Contact) that keeps the design, adds GSAP scroll motion with Lenis smooth scrolling, and sends branded Resend emails from the contact form.

**Architecture:** App Router with React Server Components for content. Animation lives in small `"use client"` components that scope GSAP to their own ref through `useGSAP`, all inside `gsap.matchMedia()` so reduced-motion users get a static site. One Lenis instance runs on GSAP's ticker and feeds ScrollTrigger. The contact form posts to a Server Action that validates with a shared zod schema, then sends two emails (React Email templates, CID inline logo) with Resend.

**Tech Stack:** Next.js (latest, App Router, TypeScript), React 19, Tailwind CSS v4, gsap + @gsap/react (ScrollTrigger, SplitText), lenis, resend, @react-email/components, zod v4, Vitest, sharp (build-time logo script).

**Spec:** `docs/superpowers/specs/2026-09-27-nextjs-migration-design.md`. Read it before starting; this plan argues from it.

## Global Constraints

- Routes are exactly `/`, `/about`, `/services`, `/contact`. There is no `/book` route, page or redirect.
- No WhatsApp anywhere: no "WhatsApp" text, no `wa.me` links. Phone is `tel:+94704888440`, shown as `+94 70 488 8440`.
- Copy is taken verbatim from `design-mock/*.html`, except the changes listed in spec §3.3 and §6.
- `design-mock/` is never edited after Task 1.
- Styling is Tailwind v4 utilities plus the `@theme` / `@utility` definitions in `src/app/globals.css`. No CSS Modules, no other UI or animation libraries (no framer-motion, no tailwind-merge).
- Every GSAP animation is created inside `gsap.matchMedia()` with the `MOTION.ok` query (or a query that includes `prefers-reduced-motion: no-preference`), so reduced motion yields no tweens, no pinning and no Lenis.
- Server HTML renders all content visible. Hidden start states are only ever applied by GSAP on mount.
- Scroll motion animates `transform` and `opacity`. The only allowed exceptions: the word rotator's `filter: blur`, the CTA panel's `borderRadius`, and `backgroundColor` on the four "How we work" step dots.
- Env var names: `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (default `daham@serenedge.com`), `CONTACT_FROM_EMAIL` (default `SerenEdge <sales@serenedge.com>`).
- The email logo is referenced as `cid:serenedge-logo`, attached with `contentId: "serenedge-logo"`, and read from `src/emails/static/logo-email.png`.
- Breakpoints mirror the mock: `sm` ≥641px, `md` ≥761px, `lg` ≥901px, `xl` ≥1101px. Pinning (`pin:` variant) needs ≥901px wide **and** ≥820px tall.
- Every commit message ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Shell commands below are POSIX (Git Bash on Windows).

## Review Focus

1. **A server-side validation error wipes the form.** React 19 resets uncontrolled forms after an action, so a person whose message fails server validation would lose everything they typed. Expected: the fields keep their values. Pinned by the Task 12 test "invalid submission returns the submitted values", and by the Task 13 manual check.
2. **Non-ASCII or punctuated names** (`José Núñez`, `O'Brien`, a name with a newline) in the email subject and the reply mailto. Expected: the subject is one line and the mailto is correctly percent-encoded. Pinned by Task 11 tests `buildReplyMailto encodes unicode` and `team subject is a single line`.
3. **Email pasted with spaces, capitals or plus-addressing** (` Jane+test@Company.com `). Expected: accepted, trimmed, and case preserved. Pinned by the Task 4 test "trims and accepts plus-addressed email".
4. **A message containing HTML or several lines.** Expected: shown escaped, with line breaks kept, in both emails. Pinned by the Task 11 test "message is escaped and keeps line breaks".
5. **Resend returns `{ error }` instead of throwing, or the network throws.** Expected: both count as failures, so the person sees the fallback message and the client email is not sent. Pinned by Task 12 tests "team send returns error object" and "team send throws".

---

## File Map

| File | Responsibility | Task |
|---|---|---|
| `design-mock/**` | Frozen static reference | 1 |
| `package.json`, `next.config.ts`, `vitest.config.mts`, `.env.example`, `.gitignore` | Tooling and config | 2 |
| `src/app/globals.css` | Tailwind import, `@theme` tokens, custom variants and utilities | 2 |
| `src/app/fonts/*` | Local font files | 2 |
| `src/lib/cn.ts` | Class-name joiner | 2 |
| `src/lib/site.ts` | All site content and data | 3 |
| `src/lib/contact-schema.ts` | zod schema, `validateContact`, form state types | 4 |
| `src/lib/gsap.ts`, `src/lib/use-reduced-motion.ts` | GSAP registration, motion queries, reduced-motion hook | 5 |
| `src/components/motion/*` | SmoothScroll, Reveal, SplitHeading, PageTransition | 5 |
| `src/app/template.tsx` | Page transition per route | 5 |
| `src/components/ui/*` | ArrowIcon, InfMark, Eyebrow, Button, SectionIntro, PageHero | 6 |
| `src/components/layout/*` | Nav, Footer, CtaPanel | 6 |
| `src/app/layout.tsx` | Fonts, metadata base, chrome, SmoothScroll | 2, 5, 6, 14 |
| `src/components/home/*`, `src/app/page.tsx` | Home | 7, 8 |
| `src/components/about/*`, `src/app/about/page.tsx` | About | 9 |
| `src/components/services/*`, `src/app/services/page.tsx` | Services | 10 |
| `scripts/make-email-logo.mjs`, `src/emails/**` | Email logo and templates | 11 |
| `src/lib/email.tsx` | Email config, payload builders, Resend factory | 11 |
| `src/app/contact/actions.ts` | `sendContact` Server Action | 12 |
| `src/components/contact/*`, `src/app/contact/page.tsx` | Contact page | 13 |
| `src/app/sitemap.ts`, `src/app/robots.ts`, `README.md` | SEO and docs | 14 |

---

### Task 1: Move the static mock into `design-mock/`

**Files:**
- Move: `index.html`, `about.html`, `services.html`, `book.html`, `css/`, `js/`, `img/`, `fonts/` → `design-mock/`

**Interfaces:**
- Consumes: nothing
- Produces: `design-mock/` with the original relative structure (later tasks copy assets from `design-mock/img/...` and `design-mock/fonts/...`)

- [ ] **Step 1: Track the untracked mock files**

```bash
git add index.html about.html services.html book.html css js img fonts
git status --short
```
Expected: the listed files show as `A` (added). `README.md` stays `M` and is **not** staged.

- [ ] **Step 2: Move them**

```bash
mkdir -p design-mock
git mv index.html about.html services.html book.html css js img fonts design-mock/
ls design-mock
```
Expected: `about.html  book.html  css  fonts  img  index.html  js  services.html`

- [ ] **Step 3: Verify the mock still renders**

Open `design-mock/index.html` in a browser. Expected: styled page with logo and fonts (all paths are relative, so nothing breaks).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: move static mock into design-mock/

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Scaffold Next.js, tooling, design tokens and assets

**Files:**
- Create (via scaffold): `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `vitest.config.mts`, `.env.example`, `src/lib/cn.ts`, `src/lib/cn.test.ts`, `src/app/fonts/*`, `public/img/*`, `public/logos/*`, `src/app/favicon.ico`, `src/app/opengraph-image.png`, `src/app/opengraph-image.alt.txt`
- Delete: scaffold sample assets in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`)

**Interfaces:**
- Consumes: `design-mock/fonts/*`, `design-mock/img/*`
- Produces:
  - Tailwind tokens usable as utilities: colours `ink ink-2 muted soft on-dark line line-2 surface surface-2 accent danger ok`; fonts `font-sans font-mono font-display`; radii `rounded-sm|md|lg|xl` (6/12/20/24px); shadows `shadow-1 shadow-2`; ease `ease-out-expo`
  - custom variants `pin:` and `fine:`
  - custom utilities `type-hero type-h2 type-lead eyebrow inf-mask band vig-bg ring-progress check-icon`
  - CSS vars `--gutter`, `--section-y`, `--inf`
  - `cn(...parts: Array<string | false | null | undefined>): string` from `@/lib/cn`
  - `npm test` runs Vitest over `src/**/*.test.{ts,tsx}`

- [ ] **Step 1: Scaffold into a temp folder**

create-next-app refuses non-empty folders, so scaffold beside the repo files and merge:

```bash
npx create-next-app@latest .scaffold --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes
```
If the CLI rejects a flag (flags change between versions), rerun without that flag. `--yes` accepts defaults for everything else.

- [ ] **Step 2: Merge the scaffold into the repo root**

```bash
rm -rf .scaffold/node_modules .scaffold/README.md .scaffold/.git
cp -rn .scaffold/. ./
rm -rf .scaffold
rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg src/app/favicon.ico
npm install
```
Expected: `package.json`, `src/app/`, `public/` now exist in the root. `README.md` is the original.

- [ ] **Step 3: Install dependencies**

```bash
npm i gsap @gsap/react lenis resend @react-email/components zod@^4
npm i -D vitest @vitejs/plugin-react vite-tsconfig-paths react-email sharp
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest" scripts.email="email dev --dir src/emails --port 3001" scripts.email:logo="node scripts/make-email-logo.mjs"
```

- [ ] **Step 4: Allow `.env.example` through `.gitignore`**

The scaffold's `.gitignore` contains `.env*`. Append:

```gitignore
!.env.example
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Resend API key (https://resend.com/api-keys). serenedge.com must be a verified domain in Resend.
RESEND_API_KEY=
# Where new enquiries are delivered
CONTACT_TO_EMAIL=daham@serenedge.com
# Sender for both emails
CONTACT_FROM_EMAIL="SerenEdge <sales@serenedge.com>"
```

- [ ] **Step 6: Replace `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The contact Server Action reads the email logo from disk at runtime.
  outputFileTracingIncludes: {
    "/contact": ["./src/emails/static/**"],
  },
};

export default nextConfig;
```

- [ ] **Step 7: Create `vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 8: Write the failing test for `cn`**

`src/lib/cn.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class names with single spaces", () => {
    expect(cn("a", false, "b", null, undefined, "", "c")).toBe("a b c");
  });
});
```

- [ ] **Step 9: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, `Failed to resolve import "./cn"`.

- [ ] **Step 10: Implement `cn`**

`src/lib/cn.ts`:
```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
```

- [ ] **Step 11: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 12: Copy fonts and images**

Only `geist-latin.woff2` is used. The latin-ext file has no `unicode-range` in `next/font/local` and would shadow basic Latin.

```bash
mkdir -p src/app/fonts public/img public/logos
cp design-mock/fonts/geist-latin.woff2 design-mock/fonts/geist-mono-latin.woff2 design-mock/fonts/candid.otf src/app/fonts/
cp design-mock/img/logos/*.svg public/logos/
cp design-mock/img/logo.png public/img/logo.png
cp design-mock/img/Founder-daham.webp public/img/founder-daham.webp
cp "design-mock/img/icons/Base Logo - Dark.ico" src/app/favicon.ico
cp design-mock/img/OG-page.png src/app/opengraph-image.png
printf "SerenEdge, an IT studio from Sri Lanka" > src/app/opengraph-image.alt.txt
```

- [ ] **Step 13: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

/* Mirrors the mock's pinned-runway media query and its hover-only effects. */
@custom-variant pin (@media (min-width: 901px) and (min-height: 820px));
@custom-variant fine (@media (hover: hover) and (pointer: fine));

@theme {
  --breakpoint-*: initial;
  --breakpoint-sm: 40.0625rem; /* 641px */
  --breakpoint-md: 47.5625rem; /* 761px */
  --breakpoint-lg: 56.3125rem; /* 901px */
  --breakpoint-xl: 68.8125rem; /* 1101px */

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

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 24px;

  --shadow-1: 0 1px 2px rgba(11, 13, 18, 0.06);
  --shadow-2: 0 8px 24px rgba(11, 13, 18, 0.1);

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

@theme inline {
  --font-sans: var(--font-geist), system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-display: var(--font-candid), var(--font-geist), system-ui, sans-serif;
}

:root {
  --gutter: clamp(20px, 5.6vw, 80px);
  --section-y: clamp(72px, 9vw, 128px);
  --inf: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 14'%3E%3Cpath d='M14 7c-2.4-3-4.2-4.6-6.6-4.6a4.6 4.6 0 0 0 0 9.2c2.4 0 4.2-1.6 6.6-4.6s4.2-4.6 6.6-4.6a4.6 4.6 0 0 1 0 9.2c-2.4 0-4.2-1.6-6.6-4.6z' fill='none' stroke='%23000' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E");
}

@utility type-hero {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(46px, 7.4vw, 96px);
  line-height: 1;
  letter-spacing: -0.025em;
  text-wrap: balance;
}
@utility type-h2 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(34px, 4vw, 56px);
  line-height: 1.07;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
@utility type-lead {
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.6;
  color: var(--color-muted);
}
/* No colour on purpose: add text-muted / text-accent / text-soft alongside. */
@utility eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
/* The infinity from the logo. Pair with a bg-* colour. */
@utility inf-mask {
  -webkit-mask: var(--inf) center / contain no-repeat;
  mask: var(--inf) center / contain no-repeat;
}
/* Surface band that fades in and out of white. */
@utility band {
  background: linear-gradient(
    180deg,
    rgb(246 247 249 / 0) 0,
    var(--color-surface) clamp(64px, 8vw, 120px),
    var(--color-surface) calc(100% - clamp(64px, 8vw, 120px)),
    rgb(246 247 249 / 0) 100%
  );
}
@utility vig-bg {
  background:
    radial-gradient(circle at 1px 1px, rgba(11, 13, 18, 0.07) 1px, transparent 0) 0 0 / 16px 16px,
    var(--color-surface);
}
/* Needs --p (0-100) set inline. */
@utility ring-progress {
  background:
    radial-gradient(closest-side, #fff 76%, transparent 78%),
    conic-gradient(var(--color-accent) calc(var(--p) * 1%), var(--color-surface-2) 0);
}
@utility check-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 8.3l2.3 2.3 4.7-5' fill='none' stroke='%23fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-position: center;
  background-size: 100%;
  background-repeat: no-repeat;
}

@layer base {
  html {
    -webkit-text-size-adjust: 100%;
  }
  body {
    overflow-x: clip;
  }
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: 6px;
  }
}
```

- [ ] **Step 14: Replace `src/app/layout.tsx` (fonts + base metadata; chrome comes in Task 6)**

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});
// Declared at 300 exactly like the mock; headings request 700 and get the same synthetic bold.
const candid = localFont({
  src: "./fonts/candid.otf",
  weight: "300",
  variable: "--font-candid",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://serenedge.com"),
  title: { default: "SerenEdge · IT studio from Sri Lanka", template: "%s · SerenEdge" },
  description:
    "SerenEdge is a deeply technical IT studio from Sri Lanka. Web platforms, IoT fleets, automations, custom systems and ML models, built by one team end to end.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${candid.variable}`}>
      <body className="bg-white font-sans text-base leading-normal text-ink antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 15: Replace `src/app/page.tsx` with a token smoke page (replaced in Task 8)**

```tsx
export default function HomePage() {
  return (
    <main className="px-(--gutter) py-(--section-y)">
      <h1 className="type-hero">
        SerenEdge <span className="text-accent">for each node.</span>
      </h1>
      <p className="eyebrow mt-6 text-muted">Tokens smoke test</p>
    </main>
  );
}
```

- [ ] **Step 16: Verify build, lint and dev render**

```bash
npm run lint && npm run build && npm test
npm run dev
```
Expected: all pass. At `http://localhost:3000` the heading is in the Candid display font, "for each node." is `#5b8ac5`, and the eyebrow is Geist Mono uppercase. Stop the dev server.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with Tailwind tokens, fonts and tooling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Site content and data (`lib/site.ts`)

**Files:**
- Create: `src/lib/site.ts`
- Test: `src/lib/site.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces (`@/lib/site`):
  - `SITE` (readonly): `{ name, url, email, phone: { display, tel }, location, availability, platformUrl, founderUrl, tagline }`
  - `NAV: readonly { href: string; label: string }[]`
  - `TOPIC_SLUGS` (`readonly ["web","iot","automation","systems","installations","ai","other"]`), `type TopicSlug`, `type Topic = { slug: TopicSlug; label: string }`, `TOPICS: readonly Topic[]`
  - `topicFromSlug(slug?: string | null): Topic` (defaults to Web Development)
  - `type Service`, `SERVICES: readonly Service[]`
  - `type ProcessStep`, `PROCESS: readonly ProcessStep[]`
  - `TOOLS: readonly { name: string; logo: string }[]`
  - `NEXT_STEPS: readonly string[]`

- [ ] **Step 1: Write the failing tests**

`src/lib/site.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { NAV, PROCESS, SERVICES, SITE, TOOLS, TOPICS, TOPIC_SLUGS, topicFromSlug } from "./site";

describe("topicFromSlug", () => {
  it("returns the matching topic", () => {
    expect(topicFromSlug("iot")).toEqual({ slug: "iot", label: "IoT Projects" });
  });
  it("falls back to Web Development for unknown or missing slugs", () => {
    expect(topicFromSlug("nope").slug).toBe("web");
    expect(topicFromSlug(undefined).slug).toBe("web");
    expect(topicFromSlug(null).slug).toBe("web");
  });
});

describe("site data", () => {
  it("has a topic for every slug, in order", () => {
    expect(TOPICS.map((t) => t.slug)).toEqual([...TOPIC_SLUGS]);
  });
  it("links every service to a real topic", () => {
    for (const s of SERVICES) expect(TOPIC_SLUGS).toContain(s.topic);
  });
  it("has six services and four process steps", () => {
    expect(SERVICES).toHaveLength(6);
    expect(PROCESS).toHaveLength(4);
  });
  it("never mentions WhatsApp", () => {
    const all = JSON.stringify({ SITE, NAV, SERVICES, PROCESS, TOOLS, TOPICS }).toLowerCase();
    expect(all).not.toContain("whatsapp");
    expect(all).not.toContain("wa.me");
  });
  it("uses a dialable phone number", () => {
    expect(SITE.phone.tel).toBe("+94704888440");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/site.test.ts`
Expected: FAIL, `Failed to resolve import "./site"`.

- [ ] **Step 3: Implement `src/lib/site.ts`**

```ts
export const SITE = {
  name: "SerenEdge",
  url: "https://serenedge.com",
  email: "sales@serenedge.com",
  phone: { display: "+94 70 488 8440", tel: "+94704888440" },
  location: "Sri Lanka · GMT+5:30",
  availability: "Open for new projects",
  platformUrl: "https://platform.serenedge.com",
  founderUrl: "https://daham.serenedge.com",
  tagline: "Firmware, ML pipelines and web platforms, built by one team end to end.",
} as const;

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
] as const;

export const TOPIC_SLUGS = ["web", "iot", "automation", "systems", "installations", "ai", "other"] as const;
export type TopicSlug = (typeof TOPIC_SLUGS)[number];
export type Topic = { slug: TopicSlug; label: string };

export const TOPICS: readonly Topic[] = [
  { slug: "web", label: "Web Development" },
  { slug: "iot", label: "IoT Projects" },
  { slug: "automation", label: "Automation" },
  { slug: "systems", label: "System Development" },
  { slug: "installations", label: "Installations" },
  { slug: "ai", label: "AI Systems" },
  { slug: "other", label: "Something weird" },
];

export function topicFromSlug(slug?: string | null): Topic {
  return TOPICS.find((t) => t.slug === slug) ?? TOPICS[0];
}

export type Service = {
  num: string;
  topic: TopicSlug;
  name: string;
  desc: string;
  tags: string[];
  gets: string[];
  fit: string;
};

export const SERVICES: readonly Service[] = [
  {
    num: "01",
    topic: "web",
    name: "Web Development",
    desc: "Marketing sites, dashboards, customer portals and SaaS products, built for speed and maintainability.",
    tags: ["Next.js", "React", "TypeScript", "PostgreSQL"],
    gets: [
      "A fast website or web app that works on every screen",
      "An admin area your team can update without us",
      "Hosting, domain and launch handled",
    ],
    fit: "your site is slow, dated, or not bringing in enquiries.",
  },
  {
    num: "02",
    topic: "iot",
    name: "IoT Projects",
    desc: "Sensor networks, device firmware and telemetry pipelines, from ESP32 prototype to fleet deployment.",
    tags: ["ESP32", "Arduino", "Raspberry Pi", "MQTT"],
    gets: [
      "Devices with sensors wired, tested and installed",
      "A live dashboard of your readings",
      "Alerts the moment something goes wrong",
    ],
    fit: "you need eyes on equipment, crops or buildings you can't visit every day.",
  },
  {
    num: "03",
    topic: "automation",
    name: "Automation",
    desc: "Document processing, scheduling, factory PLC integration and internal RPA.",
    tags: ["Python", "n8n", "PLC"],
    gets: [
      "Repetitive tasks that run on their own",
      "Data moving between your tools without copy-paste",
      "Time back for your team every week",
    ],
    fit: "people spend hours moving data between spreadsheets and systems by hand.",
  },
  {
    num: "04",
    topic: "systems",
    name: "System Development",
    desc: "Bespoke inventory, scheduling, ERPs, point-of-sale and custom CRMs.",
    tags: ["Node.js", ".NET", "Docker"],
    gets: [
      "One system built around how you already work",
      "Stock, orders, bookings or customers in one place",
      "Reports you can actually act on",
    ],
    fit: "off-the-shelf software never quite fits your business.",
  },
  {
    num: "05",
    topic: "installations",
    name: "System Installations",
    desc: "On-site deployment, network configuration and training the team that'll use it.",
    tags: ["On-site", "Networking", "Training"],
    gets: ["Hardware and network set up at your site", "Everything tested before we leave", "Your team trained to run it"],
    fit: "you're opening a new site or replacing old equipment.",
  },
  {
    num: "06",
    topic: "ai",
    name: "AI Systems",
    desc: "LLM integrations, RAG over your data, computer vision and forecasting, from prototype to deployed service.",
    tags: ["Claude", "OpenAI", "PyTorch", "RAG / LLM"],
    gets: [
      "An assistant that answers from your own documents",
      "Automatic reading, sorting or forecasting",
      "Your data kept private and under your control",
    ],
    fit: "your team keeps searching for, reading or re-typing the same information.",
  },
];

export type ProcessStep = {
  num: string;
  tag: string;
  title: string;
  /** Shorter copy used on Home */
  homeText: string;
  /** Longer copy used on Services */
  text: string;
  facts: [string, string][];
};

export const PROCESS: readonly ProcessStep[] = [
  {
    num: "01",
    tag: "Discover",
    title: "We listen first. Hard.",
    homeText:
      "A 90-minute call where you talk and we map. We don't sell yet, we don't quote yet. We figure out what problem you're actually trying to solve.",
    text: "A 90-minute call where you talk and we map. We don't sell yet, we don't quote yet. We figure out what problem you're actually trying to solve, which is rarely the one in your email.",
    facts: [
      ["Duration", "1 week"],
      ["Output", "Problem doc + scope"],
      ["Cost", "Free"],
    ],
  },
  {
    num: "02",
    tag: "Design",
    title: "Architect, then show.",
    homeText:
      "Wireframes, system diagrams, data models, hardware BOMs. You see the shape of the thing before we write production code.",
    text: "Wireframes, system diagrams, data models, hardware BOMs, whatever the project demands. You see the shape of the thing before we write production code.",
    facts: [
      ["Duration", "1-2 weeks"],
      ["Output", "Spec + prototype"],
      ["Reviews", "Weekly"],
    ],
  },
  {
    num: "03",
    tag: "Build",
    title: "Heads down. Daily demos.",
    homeText:
      "We code, you watch progress in a shared board. Every Friday: a working build you can click, ship, or break.",
    text: "The unsexy part. We code, you watch progress in a shared board. Every Friday: a working build you can click, ship, or break. No “trust us, it's almost done.”",
    facts: [
      ["Duration", "3-12 weeks"],
      ["Cadence", "Daily commits"],
      ["Demos", "Every Friday"],
    ],
  },
  {
    num: "04",
    tag: "Ship & Stay",
    title: "Deploy. Train. Stick around.",
    homeText:
      "We install on-site if needed, train your team, and stay reachable for 90 days post-launch. You'll never get ghosted.",
    text: "We install on-site if needed, train your team, and stay reachable for 90 days post-launch. After that, optional retainers, but you'll never get ghosted.",
    facts: [
      ["Launch", "+90 day support"],
      ["Handover", "Docs + training"],
      ["Retainer", "Optional"],
    ],
  },
];

export const TOOLS: readonly { name: string; logo: string }[] = [
  { name: "Next.js", logo: "nextjs" },
  { name: "Claude", logo: "claude" },
  { name: "ESP32", logo: "espressif" },
  { name: "React", logo: "react" },
  { name: "n8n", logo: "n8n" },
  { name: "PostgreSQL", logo: "postgresql" },
  { name: "Claude Code CLI", logo: "terminal" },
  { name: "Docker", logo: "docker" },
  { name: "PyTorch", logo: "pytorch" },
  { name: "TypeScript", logo: "typescript" },
  { name: "Arduino", logo: "arduino" },
  { name: "OpenAI", logo: "openai" },
  { name: "Node.js", logo: "nodejs" },
  { name: "MQTT", logo: "mqtt" },
  { name: "Python", logo: "python" },
  { name: "Supabase", logo: "supabase" },
  { name: "Raspberry Pi", logo: "raspberrypi" },
  { name: "Tailwind CSS", logo: "tailwind" },
  { name: "Vercel", logo: "vercel" },
  { name: "GitHub", logo: "github" },
  { name: "GSAP", logo: "gsap" },
];

export const NEXT_STEPS: readonly string[] = [
  "Pick a topic and tell us the problem.",
  "Within 24 hours we email you to set up the call.",
  "Within a week you get a problem doc and a scope. Still free.",
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/lib/site.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/lib/site.test.ts
git commit -m "feat: add site content and data module

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Contact schema and form state types

**Files:**
- Create: `src/lib/contact-schema.ts`
- Test: `src/lib/contact-schema.test.ts`

**Interfaces:**
- Consumes: `TOPIC_SLUGS`, `TopicSlug` from `@/lib/site`
- Produces (`@/lib/contact-schema`):
  - `contactSchema` (zod object)
  - `type ContactInput = { topic: TopicSlug; name: string; email: string; phone: string; company: string; message: string }` (optional fields default to `""`)
  - `type ContactField = keyof ContactInput`
  - `CONTACT_FIELDS: readonly ContactField[]`, in focus order `["topic","name","email","phone","company","message"]`
  - `type FieldErrors = Partial<Record<ContactField, string>>`
  - `type FormValues = Partial<Record<ContactField, string>>`
  - `validateContact(raw: Record<string, unknown>): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors }`
  - `type ContactState = { status: "idle" } | { status: "invalid"; errors: FieldErrors; values: FormValues } | { status: "error"; message: string; values: FormValues } | { status: "success"; topic: string }`

- [ ] **Step 1: Write the failing tests**

`src/lib/contact-schema.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { validateContact } from "./contact-schema";

const valid = {
  topic: "iot",
  name: "Jane Smith",
  email: "jane@company.com",
  phone: "",
  company: "",
  message: "We need sensors on 40 greenhouses.",
};

describe("validateContact", () => {
  it("accepts a valid submission", () => {
    const r = validateContact(valid);
    expect(r.ok).toBe(true);
  });

  it("trims and accepts plus-addressed email", () => {
    const r = validateContact({ ...valid, name: "  Jane Smith  ", email: "  Jane+test@Company.com " });
    expect(r).toEqual({ ok: true, data: expect.objectContaining({ name: "Jane Smith", email: "Jane+test@Company.com" }) });
  });

  it("defaults optional fields when they are missing", () => {
    const { phone: _p, company: _c, ...rest } = valid;
    const r = validateContact(rest);
    expect(r).toEqual({ ok: true, data: expect.objectContaining({ phone: "", company: "" }) });
  });

  it("accepts an international phone number", () => {
    expect(validateContact({ ...valid, phone: "+94 (70) 488-8440" }).ok).toBe(true);
  });

  it.each([
    ["topic", { topic: "book" }],
    ["name", { name: "   " }],
    ["email", { email: "not-an-email" }],
    ["phone", { phone: "call me maybe" }],
    ["company", { company: "x".repeat(121) }],
    ["message", { message: "too short" }],
    ["message", { message: "x".repeat(4001) }],
  ])("rejects an invalid %s", (field, patch) => {
    const r = validateContact({ ...valid, ...patch });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[field as keyof typeof r.errors]).toEqual(expect.any(String));
  });

  it("reports one message per field", () => {
    const r = validateContact({ topic: "web", name: "", email: "", message: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/contact-schema.test.ts`
Expected: FAIL, `Failed to resolve import "./contact-schema"`.

- [ ] **Step 3: Implement `src/lib/contact-schema.ts`**

```ts
import { z } from "zod";
import { TOPIC_SLUGS } from "./site";

export const contactSchema = z.object({
  topic: z.enum(TOPIC_SLUGS, "Pick a topic."),
  name: z.string().trim().min(1, "Add your name.").max(120, "Keep your name under 120 characters."),
  email: z
    .string()
    .trim()
    .max(254, "That email address is too long.")
    .email("Add a valid email address."),
  phone: z
    .string()
    .trim()
    .max(32, "That phone number is too long.")
    .regex(/^[+()\-\s\d]*$/, "Use digits, spaces and + ( ) - only.")
    .default(""),
  company: z.string().trim().max(120, "Keep the company name under 120 characters.").default(""),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(4000, "Keep the message under 4000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;
export const CONTACT_FIELDS: readonly ContactField[] = ["topic", "name", "email", "phone", "company", "message"];
export type FieldErrors = Partial<Record<ContactField, string>>;
export type FormValues = Partial<Record<ContactField, string>>;

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors; values: FormValues }
  | { status: "error"; message: string; values: FormValues }
  | { status: "success"; topic: string };

export function validateContact(
  raw: Record<string, unknown>,
): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors } {
  const result = contactSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/lib/contact-schema.test.ts`
Expected: PASS (12 tests). If zod rejects the string error argument to `z.enum`, check the installed major version with `npm ls zod` (must be 4.x).

- [ ] **Step 5: Commit**

```bash
git add src/lib/contact-schema.ts src/lib/contact-schema.test.ts
git commit -m "feat: add shared contact form schema

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Motion infrastructure (GSAP, Lenis, primitives, page transition)

**Files:**
- Create: `src/lib/gsap.ts`, `src/lib/use-reduced-motion.ts`
- Create: `src/components/motion/SmoothScroll.tsx`, `Reveal.tsx`, `SplitHeading.tsx`, `PageTransition.tsx`
- Create: `src/app/template.tsx`
- Modify: `src/app/layout.tsx` (wrap in `SmoothScroll`, import Lenis CSS)
- Modify: `src/app/page.tsx` (temporary motion demo, replaced in Task 8)

**Interfaces:**
- Consumes: `cn` from `@/lib/cn`
- Produces:
  - `@/lib/gsap`: `gsap`, `ScrollTrigger`, `SplitText`, `useGSAP` (plugins registered), and `MOTION` = `{ ok: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)", pin: "(min-width: 901px) and (min-height: 820px) and (prefers-reduced-motion: no-preference)", fine: "(hover: hover) and (pointer: fine) and (min-width: 901px)" }`
  - `@/lib/use-reduced-motion`: `useReducedMotion(): boolean` (returns `true` on the server)
  - `<SmoothScroll>{children}</SmoothScroll>`
  - `<Reveal as? className? stagger? y? delay? selector?>`: animates its direct children, or `selector` matches inside it
  - `<SplitHeading as?="h1"|"h2"|"h3" id? className? onLoad?>`: masked line reveal; `onLoad` plays immediately instead of on scroll
  - `<PageTransition>`: used only by `template.tsx`
  - `useLenis` is imported directly from `lenis/react` by later tasks

**Pattern every later motion component follows** (copy this shape):

```tsx
const ref = useRef<HTMLElement>(null);
useGSAP(
  () => {
    const mm = gsap.matchMedia();
    mm.add(MOTION.ok, () => {
      /* tweens + ScrollTriggers using selectors scoped to ref */
    }, ref);
  },
  { scope: ref },
);
```
`useGSAP` reverts the context (and the `matchMedia` created inside it) on unmount, so nothing leaks between routes. Passing `ref` as the third argument of `mm.add` keeps selector text scoped when the media query re-matches later.

- [ ] **Step 1: Create `src/lib/gsap.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/lib/use-reduced-motion.ts`**

```ts
"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** true on the server so smooth scrolling only starts after hydration. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
```

- [ ] **Step 3: Create `src/components/motion/SmoothScroll.tsx`**

```tsx
"use client";

import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/use-reduced-motion";

function ScrollTriggerSync() {
  useLenis(ScrollTrigger.update);
  return null;
}

/**
 * One Lenis instance for the whole site, driven by GSAP's ticker so smooth
 * scroll and ScrollTrigger share a single RAF loop. Off under reduced motion.
 * Lenis renders as a sibling (root mode) so toggling it never remounts the page.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [reduced]);

  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      {!reduced && (
        <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: true }}>
          <ScrollTriggerSync />
        </ReactLenis>
      )}
      {children}
    </>
  );
}
```

If TypeScript rejects an option (`anchors` arrived in lenis 1.2), check the installed version's `LenisOptions` type and drop only that option. Without `anchors`, add a click handler on the skip link that calls `lenis.scrollTo("#main")`.

- [ ] **Step 4: Create `src/components/motion/Reveal.tsx`**

```tsx
"use client";

import { useRef, type ElementType, type ReactNode } from "react";
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
  const Tag = as as ElementType;

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
```

- [ ] **Step 5: Create `src/components/motion/SplitHeading.tsx`**

```tsx
"use client";

import { useRef, type ElementType, type ReactNode } from "react";
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
  const Tag = as as ElementType;

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
```

- [ ] **Step 6: Create `src/components/motion/PageTransition.tsx`**

```tsx
"use client";

import { useLenis } from "lenis/react";
import { useRef } from "react";
import { gsap, MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";

// Last path the curtain ran for. null = first load (no curtain).
// Comparing paths also keeps React StrictMode's double effect from playing it.
let lastPath: string | null = null;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(() => {
    const el = panel.current;
    if (!el) return;
    const path = window.location.pathname;
    const isNavigation = lastPath !== null && lastPath !== path;
    lastPath = path;
    if (!isNavigation) return;

    // Next scrolls the window to top on navigation; keep Lenis's internal position in sync.
    lenis?.scrollTo(0, { immediate: true, force: true });

    const mm = gsap.matchMedia();
    mm.add(MOTION.ok, () => {
      gsap.set(el, { display: "block", yPercent: 0 });
      gsap.to(el, {
        yPercent: -100,
        duration: 0.6,
        ease: "expo.inOut",
        onComplete: () => {
          gsap.set(el, { display: "none" });
          ScrollTrigger.refresh();
        },
      });
    });
  }, []);

  return (
    <>
      <div ref={panel} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] hidden bg-ink" />
      {children}
    </>
  );
}
```

- [ ] **Step 7: Create `src/app/template.tsx`**

```tsx
import { PageTransition } from "@/components/motion/PageTransition";

// template.tsx re-mounts on every navigation, which is what drives the curtain.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
```

- [ ] **Step 8: Wire SmoothScroll into `src/app/layout.tsx`**

Add the imports at the top:
```tsx
import "lenis/dist/lenis.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
```
and change the body to:
```tsx
<body className="bg-white font-sans text-base leading-normal text-ink antialiased">
  <SmoothScroll>{children}</SmoothScroll>
</body>
```

- [ ] **Step 9: Temporary motion demo in `src/app/page.tsx`**

```tsx
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";

export default function HomePage() {
  return (
    <main className="px-(--gutter)">
      <section className="flex min-h-svh items-center">
        <SplitHeading as="h1" onLoad className="type-hero">
          SerenEdge <span className="text-accent">for each node.</span>
        </SplitHeading>
      </section>
      {[1, 2, 3].map((n) => (
        <section key={n} className="flex min-h-svh flex-col justify-center gap-6">
          <SplitHeading className="type-h2">Section {n}, a long heading that wraps onto more lines</SplitHeading>
          <Reveal className="grid gap-4 sm:grid-cols-3">
            <div className="h-40 rounded-lg bg-surface" />
            <div className="h-40 rounded-lg bg-surface" />
            <div className="h-40 rounded-lg bg-surface" />
          </Reveal>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 10: Verify**

```bash
npm run lint && npm run build
npm run dev
```
Check at `http://localhost:3000`:
- Wheel scrolling is smooth and eased (Lenis). `<html>` has the class `lenis`.
- The hero heading lines rise on load; each section heading and card row reveal once when scrolled in.
- Resizing the window re-splits headings with no broken lines.
- With OS "reduce motion" on (Windows: Settings → Accessibility → Visual effects → Animation effects **off**), reload: no smooth scroll, and everything is visible immediately.

Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add GSAP + Lenis motion infrastructure and page transition

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: UI primitives and layout chrome (Nav, Footer, CTA panel)

**Files:**
- Create: `src/components/ui/ArrowIcon.tsx`, `InfMark.tsx`, `Eyebrow.tsx`, `Button.tsx`, `SectionIntro.tsx`, `PageHero.tsx`
- Create: `src/components/layout/Nav.tsx`, `Footer.tsx`, `CtaPanel.tsx`
- Modify: `src/app/layout.tsx` (skip link, Nav, `<main id="main">`, Footer)

**Interfaces:**
- Consumes: `SITE`, `NAV` (`@/lib/site`); `cn`; `gsap`, `MOTION`, `useGSAP`; `Reveal`, `SplitHeading`; `useLenis` from `lenis/react`
- Produces:
  - `<ArrowIcon className? />`
  - `<InfMark className? />`: infinity mark coloured by `currentColor`
  - `<Eyebrow tone?="muted"|"accent"|"soft" inf? className?>`
  - `buttonClasses(variant?: "dark"|"tint"|"white"|"outline", size?: "md"|"sm"): string`
  - `<Button href variant? size? arrow? className?>`: a Next `Link` for `/…` hrefs, `<a>` otherwise
  - `<SectionIntro id accent title lead? className?>`: two-column split heading + lead
  - `<PageHero title accent lead compact?>{children}</PageHero>`: Services/Contact hero (h1)
  - `<CtaPanel accent title cta />`: dark "Get in touch" block
  - `<Nav />`, `<Footer />`

- [ ] **Step 1: Create the small primitives**

`src/components/ui/ArrowIcon.tsx`:
```tsx
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
```

`src/components/ui/InfMark.tsx`:
```tsx
import { cn } from "@/lib/cn";

export function InfMark({ className }: { className?: string }) {
  return <i aria-hidden="true" className={cn("inf-mask inline-block shrink-0 bg-current", className)} />;
}
```

`src/components/ui/Eyebrow.tsx`:
```tsx
import { cn } from "@/lib/cn";

const tones = { muted: "text-muted", accent: "text-accent", soft: "text-soft" } as const;

type Props = { tone?: keyof typeof tones; inf?: boolean; className?: string; children: React.ReactNode };

export function Eyebrow({ tone = "muted", inf = false, className, children }: Props) {
  return (
    <span
      className={cn(
        "eyebrow",
        tones[tone],
        inf && "inline-flex items-center gap-2.5 before:inf-mask before:h-2.5 before:w-5 before:bg-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
```

`src/components/ui/Button.tsx`:
```tsx
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowIcon } from "./ArrowIcon";

const variants = {
  dark: "bg-ink text-white hover:bg-ink-2",
  tint: "bg-accent/12 text-ink hover:bg-accent/22",
  white: "bg-white text-ink hover:bg-surface-2",
  outline: "border border-white/24 bg-transparent text-white hover:border-white/60",
} as const;

const sizes = {
  md: "h-[52px] gap-2.5 px-6 text-base",
  sm: "h-11 gap-2 px-5 text-[15px]",
} as const;

export function buttonClasses(variant: keyof typeof variants = "dark", size: keyof typeof sizes = "md") {
  return cn(
    "group inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
  );
}

type Props = {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Button({ href, variant = "dark", size = "md", arrow = false, className, children }: Props) {
  const cls = cn(buttonClasses(variant, size), className);
  const content = (
    <>
      {children}
      {arrow && (
        <ArrowIcon className="size-4 shrink-0 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
      )}
    </>
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} rel={href.startsWith("http") ? "noopener" : undefined}>
      {content}
    </a>
  );
}
```

- [ ] **Step 2: Create `SectionIntro` and `PageHero`**

`src/components/ui/SectionIntro.tsx`:
```tsx
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { cn } from "@/lib/cn";

type Props = { id: string; accent: string; title: string; lead?: string; className?: string };

export function SectionIntro({ id, accent, title, lead, className }: Props) {
  return (
    <div className={cn("grid items-end gap-[clamp(28px,4.4vw,64px)] lg:grid-cols-2", className)}>
      <SplitHeading id={id} className="type-h2">
        <span className="text-accent">{accent}</span> {title}
      </SplitHeading>
      {lead && (
        <Reveal className="max-w-[520px] lg:justify-self-end">
          <p className="text-lg leading-7 text-muted">{lead}</p>
        </Reveal>
      )}
    </div>
  );
}
```

`src/components/ui/PageHero.tsx`:
```tsx
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { cn } from "@/lib/cn";

type Props = { title: string; accent: string; lead: string; compact?: boolean; children?: React.ReactNode };

export function PageHero({ title, accent, lead, compact = false, children }: Props) {
  return (
    <section
      className={cn(
        "grid items-end gap-[clamp(28px,4.4vw,64px)] px-(--gutter) pt-[clamp(128px,14vw,192px)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
        compact ? "pb-[clamp(40px,5vw,72px)]" : "pb-[clamp(56px,7vw,96px)]",
      )}
    >
      <SplitHeading as="h1" onLoad className="type-hero">
        {title}
        <span className="block text-accent">{accent}</span>
      </SplitHeading>
      <Reveal delay={0.35} className="flex max-w-[520px] flex-col items-start gap-7 lg:justify-self-end">
        <p className="type-lead">{lead}</p>
        {children}
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/layout/Nav.tsx`**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/site";

export function Nav() {
  const pathname = usePathname();
  // The menu is open only for the path it was opened on, so it closes itself on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
      <header
        ref={headerRef}
        className="pointer-events-auto relative flex h-[68px] w-full max-w-[560px] items-center gap-4 rounded-lg border border-line bg-white/85 pl-5 pr-3 shadow-2 backdrop-blur-[14px] lg:w-auto lg:max-w-none lg:gap-12 lg:pl-[26px] lg:pr-4"
      >
        <Link href="/" aria-label="SerenEdge home" className="shrink-0">
          <Image src="/img/logo.png" alt="SerenEdge" width={56} height={30} priority className="h-[30px] w-auto" />
        </Link>

        <button
          type="button"
          className="ml-auto flex size-11 items-center justify-center rounded-md lg:hidden"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label="Menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <span
            className={cn(
              "relative block h-[1.5px] w-[18px] bg-ink transition-colors",
              "before:absolute before:-top-1.5 before:left-0 before:h-[1.5px] before:w-[18px] before:bg-ink before:transition-transform before:duration-250 before:ease-out-expo",
              "after:absolute after:left-0 after:top-1.5 after:h-[1.5px] after:w-[18px] after:bg-ink after:transition-transform after:duration-250 after:ease-out-expo",
              open && "bg-transparent before:translate-y-1.5 before:rotate-45 after:-translate-y-1.5 after:-rotate-45",
            )}
          />
        </button>

        <nav
          id="nav-links"
          aria-label="Primary"
          data-open={open}
          className={cn(
            // mobile dropdown
            "invisible absolute inset-x-0 top-[calc(100%+8px)] flex -translate-y-1.5 flex-col rounded-lg border border-line bg-white/96 p-2 opacity-0 shadow-2 backdrop-blur-[14px] transition-[opacity,transform,visibility] duration-200",
            "data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100",
            // desktop inline
            "lg:visible lg:static lg:translate-y-0 lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0 lg:opacity-100 lg:shadow-none lg:backdrop-blur-none",
          )}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="rounded-md px-4 py-3.5 text-base font-medium text-muted transition-colors hover:bg-surface hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink lg:p-0 lg:text-[15px] lg:hover:bg-transparent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            aria-current={pathname === "/contact" ? "page" : undefined}
            className="mt-1 flex justify-center rounded-md bg-ink px-4 py-3.5 font-medium text-white hover:bg-ink-2 lg:hidden"
          >
            Let&apos;s talk
          </Link>
        </nav>

        {/* Wrapper owns display so it doesn't fight the button's own inline-flex. */}
        <div className="hidden lg:block">
          <Button href="/contact" size="sm" arrow>
            Let&apos;s talk
          </Button>
        </div>
      </header>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/layout/Footer.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { InfMark } from "@/components/ui/InfMark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

type Item = { href: string; label: string };

function FooterCol({ title, items, className }: { title: string; items: Item[]; className?: string }) {
  return (
    <nav aria-label={title} className={cn("flex flex-col gap-3", className)}>
      <Eyebrow>{title}</Eyebrow>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.label}>
            {it.href.startsWith("/") ? (
              <Link href={it.href} className="text-[14.5px] text-ink transition-colors hover:text-accent">
                {it.label}
              </Link>
            ) : (
              <a
                href={it.href}
                rel={it.href.startsWith("http") ? "noopener" : undefined}
                className="text-[14.5px] text-ink transition-colors hover:text-accent"
              >
                {it.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-(--gutter) pt-[clamp(40px,4vw,56px)]">
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 pb-[clamp(32px,3.6vw,48px)] min-[521px]:grid-cols-3 min-[521px]:gap-8 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-full flex max-w-[320px] flex-col gap-3.5 lg:col-span-1">
          <Link href="/" aria-label="SerenEdge home" className="self-start">
            <Image src="/img/logo.png" alt="SerenEdge" width={56} height={30} className="h-[26px] w-auto" />
          </Link>
          <p className="text-sm leading-relaxed text-muted">{SITE.tagline}</p>
        </div>
        <FooterCol
          title="Pages"
          items={[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/services", label: "Services" },
            { href: "/contact", label: "Book a call" },
          ]}
        />
        <FooterCol
          title="Platform"
          items={[
            { href: SITE.platformUrl, label: "Client portal" },
            { href: SITE.platformUrl, label: "Join as a developer" },
          ]}
        />
        <FooterCol
          title="Contact"
          className="col-span-full min-[521px]:col-span-1"
          items={[
            { href: `mailto:${SITE.email}`, label: SITE.email },
            { href: `tel:${SITE.phone.tel}`, label: SITE.phone.display },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line py-5 text-[13px] text-soft">
        <span className="inline-flex items-center gap-1.5">
          © {new Date().getFullYear()} SerenEdge <InfMark className="h-[9px] w-[18px] text-accent" /> for each node.
        </span>
        <span>
          Built by{" "}
          <a className="text-muted underline underline-offset-3 transition-colors hover:text-accent" href={SITE.founderUrl} rel="noopener">
            Daham Dissanayake
          </a>
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Create `src/components/layout/CtaPanel.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { SITE } from "@/lib/site";

type Props = { accent: string; title: string; cta: string };

const FACTS: { label: string; value: string; href?: string }[] = [
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  { label: "Phone", value: SITE.phone.display, href: `tel:${SITE.phone.tel}` },
  { label: "Based", value: SITE.location },
  { label: "Availability", value: SITE.availability },
];

export function CtaPanel({ accent, title, cta }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap.fromTo(
            ref.current,
            { scale: 0.94, borderRadius: 40 },
            {
              scale: 1,
              borderRadius: 20,
              ease: "none",
              scrollTrigger: { trigger: ref.current, start: "top bottom", end: "top 60%", scrub: true },
            },
          );
          gsap.from(".cta-fact", {
            autoAlpha: 0,
            y: 16,
            stagger: 0.08,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
          });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section className="px-(--gutter) pb-(--section-y)">
      <div
        ref={ref}
        className="grid items-end gap-[clamp(32px,4.4vw,64px)] rounded-lg bg-ink px-[clamp(24px,4.4vw,64px)] py-[clamp(40px,5vw,72px)] text-white lg:grid-cols-[1.2fr_1fr]"
      >
        <div className="flex flex-col gap-7">
          <h2 className="type-h2 text-white">
            <span className="text-accent">{accent}</span> {title}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button href="/contact" variant="white" arrow className="max-sm:w-full">
              {cta}
            </Button>
            <Button href={`mailto:${SITE.email}`} variant="outline" className="max-sm:w-full">
              Email us
            </Button>
          </div>
        </div>
        <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          {FACTS.map((f) => (
            <div key={f.label} className="cta-fact flex min-w-0 flex-col gap-1.5 border-t border-white/14 pt-[18px]">
              <dt className="eyebrow text-soft">{f.label}</dt>
              <dd className="text-[17px] text-white [overflow-wrap:anywhere]">
                {f.href ? (
                  <a href={f.href} className="transition-colors hover:text-accent">
                    {f.value}
                  </a>
                ) : (
                  f.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add the chrome to `src/app/layout.tsx`**

Add the imports:
```tsx
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
```
Replace the body contents:
```tsx
<body className="bg-white font-sans text-base leading-normal text-ink antialiased">
  <SmoothScroll>
    <a
      href="#main"
      className="absolute -top-16 left-4 z-[100] rounded-md bg-ink px-4 py-2.5 text-white transition-[top] focus:top-3"
    >
      Skip to content
    </a>
    <Nav />
    <main id="main" tabIndex={-1} className="focus:outline-none">
      {children}
    </main>
    <Footer />
  </SmoothScroll>
</body>
```
In `src/app/page.tsx` change the outer `<main className="px-(--gutter)">` to `<div className="px-(--gutter)">` (the layout now owns `<main>`).

- [ ] **Step 7: Create placeholder routes so nav links resolve (each replaced in later tasks)**

`src/app/about/page.tsx`, `src/app/services/page.tsx`, `src/app/contact/page.tsx`, each with its own name:
```tsx
export default function Page() {
  return <div className="px-(--gutter) pt-40 pb-(--section-y) type-h2">About</div>;
}
```

- [ ] **Step 8: Verify**

```bash
npm run lint && npm run build
grep -ri "whatsapp\|wa\.me" src/ || echo "no whatsapp"
npm run dev
```
Expected: `no whatsapp`. In the browser, compare against `design-mock/index.html`:
- At desktop width: the floating pill nav shows the logo, About, Services and a dark "Let's talk" button; the active page link is bold ink.
- At ≤900px: a burger appears; the dropdown opens and closes on click, Escape, an outside click, and when you follow a link. The page does not scroll while it's open.
- The footer has four columns (brand, Pages, Platform, Contact) with no WhatsApp; the bottom row shows the infinity mark.
- Tab from the address bar: "Skip to content" appears top left.

Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add UI primitives, nav, footer and CTA panel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Home, part 1 (Hero, word rotator, Why SerenEdge)

**Files:**
- Create: `src/components/home/Hero.tsx`, `WordRotator.tsx`, `WhyFlow.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `gsap`, `MOTION`, `useGSAP`; `Button`, `SectionIntro`, `InfMark`; `cn`
- Produces: `<Hero />`, `<WordRotator className? />`, `<WhyFlow />`

Visual reference: `design-mock/index.html` lines 36–100 and `design-mock/css/styles.css` sections "Hero (home)" and "Why SerenEdge: open three-step flow".

- [ ] **Step 1: Create `src/components/home/WordRotator.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

const WORDS = ["web platforms.", "IoT fleets.", "automations.", "custom systems.", "ML models."];

export function WordRotator({ className }: { className?: string }) {
  const box = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = box.current;
      if (!el) return;
      const words = gsap.utils.toArray<HTMLElement>(".rot-word", el);
      let i = 0;
      const widthOf = (w: HTMLElement) => Math.ceil(w.getBoundingClientRect().width) + 2;
      const fit = () => gsap.set(el, { width: widthOf(words[i]) });

      gsap.set(words, { autoAlpha: 0 });
      gsap.set(words[0], { autoAlpha: 1 });
      fit();
      document.fonts?.ready.then(fit);
      window.addEventListener("resize", fit);

      const mm = gsap.matchMedia();
      mm.add(MOTION.ok, () => {
        const id = window.setInterval(() => {
          const prev = words[i];
          i = (i + 1) % words.length;
          const next = words[i];
          gsap.to(prev, { autoAlpha: 0, yPercent: -45, filter: "blur(8px)", duration: 0.7, ease: "expo.out" });
          gsap.fromTo(
            next,
            { autoAlpha: 0, yPercent: 45, filter: "blur(8px)" },
            { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out" },
          );
          gsap.to(el, { width: widthOf(next), duration: 0.7, ease: "expo.out" });
        }, 2600);
        return () => window.clearInterval(id);
      });

      return () => window.removeEventListener("resize", fit);
    },
    { scope: box },
  );

  return (
    <p
      className={cn(
        "mt-2 flex flex-wrap items-baseline justify-center gap-[.28em] text-[clamp(22px,2.7vw,32px)] font-medium leading-tight tracking-[-.015em] text-muted",
        className,
      )}
    >
      We build
      <span
        ref={box}
        className="inline-grid justify-items-center text-ink"
        aria-label="web platforms, IoT fleets, automations, custom systems and ML models"
      >
        {WORDS.map((w, n) => (
          <span key={w} aria-hidden="true" className={cn("rot-word col-start-1 row-start-1 whitespace-nowrap", n > 0 && "opacity-0")}>
            {w}
          </span>
        ))}
      </span>
    </p>
  );
}
```

- [ ] **Step 2: Create `src/components/home/Hero.tsx`**

The mock's hero `h1` uses Geist (not the display face), so no `font-display` here.

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { WordRotator } from "./WordRotator";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap
            .timeline({ defaults: { ease: "expo.out", duration: 1.1 }, delay: 0.1 })
            .from(".hero-kicker", { autoAlpha: 0, y: 12, duration: 0.8 })
            .from(".hero-line > span", { yPercent: 110, stagger: 0.1 }, "-=0.5")
            .from(".hero-fade", { autoAlpha: 0, y: 20, stagger: 0.08, duration: 0.9 }, "-=0.7");

          gsap.to(".hero-inner", {
            yPercent: -12,
            autoAlpha: 0.2,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
          });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className="flex min-h-[min(860px,100svh)] flex-col items-center justify-center px-(--gutter) pb-[72px] pt-[clamp(120px,14vw,150px)] text-center"
    >
      <div className="hero-inner flex max-w-[1060px] flex-col items-center gap-7">
        <p className="hero-kicker text-base font-medium leading-6 text-muted">
          An IT studio from Sri Lanka, building for clients worldwide
        </p>
        <h1 className="text-[clamp(52px,9.4vw,120px)] font-bold leading-[.93] tracking-[-.04em]">
          <span className="hero-line block overflow-hidden pb-[.06em]">
            <span className="block">SerenEdge</span>
          </span>
          <span className="hero-line block overflow-hidden pb-[.06em] text-accent">
            <span className="block">for each node.</span>
          </span>
        </h1>
        <WordRotator className="hero-fade" />
        <p className="hero-fade max-w-[600px] text-lg leading-7 text-muted">
          A deeply technical IT studio. Give us any IT problem. One team takes it from the first call to the last deploy.
        </p>
        <div className="hero-fade mt-2 flex w-full flex-wrap justify-center gap-3 sm:w-auto">
          <Button href="/contact" arrow className="max-sm:w-full">
            Book a discovery call
          </Button>
          <Button href="/services" variant="tint" className="max-sm:w-full">
            Explore services
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/home/WhyFlow.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { InfMark } from "@/components/ui/InfMark";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { SITE } from "@/lib/site";

const card =
  "w-full max-w-[340px] rounded-[14px] border border-line bg-white shadow-[0_10px_24px_rgba(11,13,18,.07)] lg:max-w-[300px]";

function TasksVignette() {
  const tasks: [string, "done" | "now"][] = [
    ["Scope login flow", "done"],
    ["Build reports API", "done"],
    ["Write test suite", "now"],
  ];
  return (
    <ul className={cn(card, "px-3.5 py-2")}>
      {tasks.map(([t, s]) => (
        <li key={t} className="vt-item flex items-center gap-2.5 border-t border-line py-[9px] text-[13px] first:border-t-0">
          <i
            className={cn(
              "size-4 shrink-0 rounded-full border-[1.5px]",
              s === "done" ? "check-icon border-ink bg-ink" : "border-accent",
            )}
          />
          <span className={cn("min-w-0 grow truncate", s === "done" && "text-muted line-through decoration-line-2")}>{t}</span>
          {s === "done" ? (
            <em className="rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[10px] not-italic text-[#2c5f96]">AI</em>
          ) : (
            <b className="h-[5px] w-11 rounded-[3px] bg-[linear-gradient(90deg,var(--color-accent)_60%,var(--color-surface-2)_0)]" />
          )}
        </li>
      ))}
    </ul>
  );
}

function DeadlineVignette() {
  return (
    <div className={cn(card, "p-4")}>
      <div className="mb-[22px] flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ok">On time</span>
        <span className="whitespace-nowrap text-[11px] text-muted">Finish · 2 days early</span>
      </div>
      <div className="relative h-1.5 rounded-[3px] bg-surface-2">
        <i className="vd-fill absolute inset-y-0 left-0 w-[58%] origin-left rounded-[inherit] bg-accent" />
        {[22, 70, 96].map((left, n) => (
          <span
            key={left}
            className={cn(
              "absolute top-1/2 -ml-1.5 -mt-1.5 size-3 rounded-full border-2",
              n === 0 ? "border-accent bg-accent" : "border-line-2 bg-white",
            )}
            style={{ left: `${left}%` }}
          />
        ))}
        <span className="absolute bottom-3 left-[58%] -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[.06em] text-ink after:absolute after:left-1/2 after:top-[13px] after:h-[11px] after:w-px after:bg-ink">
          Today
        </span>
      </div>
      <div className="relative mt-2.5 h-4 text-[11px] text-muted">
        {(
          [
            ["Design", 22],
            ["Beta", 70],
            ["Launch", 92],
          ] as const
        ).map(([t, left]) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${left}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function PortalVignette() {
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="flex h-[30px] items-center gap-2 border-b border-line bg-surface px-3 font-mono text-[10.5px] text-muted">
        <span className="size-2 rounded-full bg-accent" />
        platform.serenedge.com
      </div>
      <div className="flex items-center gap-4 p-4">
        <div
          className="vp-ring ring-progress grid size-16 shrink-0 place-items-center rounded-full"
          style={{ "--p": 64 } as React.CSSProperties}
        >
          <b className="vp-label text-[15px] font-semibold">64%</b>
        </div>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <strong className="text-sm font-semibold">Customer portal</strong>
          <small className="text-[11.5px] text-muted">Updated today</small>
          <small className="text-[11.5px] text-muted">12 days to Beta</small>
        </div>
      </div>
    </div>
  );
}

function Step({ vignette, eyebrow, title, children }: { vignette: React.ReactNode; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <article className="why-step flex min-w-0 flex-col gap-3">
      <div aria-hidden="true" className="vig-bg relative flex h-[200px] items-center justify-center overflow-hidden rounded-lg p-5">
        {vignette}
      </div>
      <span className="eyebrow mt-5 text-accent">{eyebrow}</span>
      <h3 className="font-display text-2xl font-bold leading-[1.23]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-muted">{children}</p>
    </article>
  );
}

function WhyLink() {
  return (
    <span aria-hidden="true" className="relative flex h-14 items-center justify-center text-accent lg:h-[200px]">
      <span className="why-line absolute inset-y-0 left-1/2 border-l border-dashed border-line-2 lg:inset-x-0 lg:inset-y-auto lg:top-1/2 lg:left-0 lg:origin-left lg:border-l-0 lg:border-t" />
      <span className="why-inf relative bg-white px-1.5 py-1">
        <InfMark className="block h-[9px] w-[18px] xl:h-[13px] xl:w-[26px]" />
      </span>
    </span>
  );
}

export function WhyFlow() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { ok: MOTION.ok, wide: "(min-width: 901px)" },
        (ctx) => {
          const { ok, wide } = ctx.conditions as { ok: boolean; wide: boolean };
          if (!ok) return;
          const ring = ref.current?.querySelector<HTMLElement>(".vp-ring");
          const label = ref.current?.querySelector<HTMLElement>(".vp-label");
          const count = { p: 0 };

          gsap
            .timeline({
              defaults: { ease: "expo.out", duration: 0.9 },
              scrollTrigger: { trigger: ".why-flow", start: "top 75%", once: true },
            })
            .from(".why-step", { autoAlpha: 0, y: 32, stagger: 0.18 })
            .from(".why-inf", { scale: 0, stagger: 0.18, ease: "back.out(2)", duration: 0.6 }, 0.6)
            .from(".vt-item", { autoAlpha: 0, x: -8, stagger: 0.12, duration: 0.5 }, 0.5)
            .fromTo(".vd-fill", { scaleX: 0 }, { scaleX: 1, duration: 1.2 }, 0.7)
            .to(
              count,
              {
                p: 64,
                duration: 1.4,
                onUpdate: () => {
                  const v = Math.round(count.p);
                  ring?.style.setProperty("--p", String(v));
                  if (label) label.textContent = `${v}%`;
                },
              },
              0.8,
            );

          if (wide) {
            gsap.from(".why-line", {
              scaleX: 0,
              ease: "none",
              scrollTrigger: { trigger: ".why-flow", start: "top 80%", end: "top 40%", scrub: true },
            });
          }
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="why" className="px-(--gutter) pb-[clamp(40px,4vw,56px)] pt-(--section-y)">
      <div className="flex flex-col gap-12">
        <SectionIntro
          id="why"
          accent="Why SerenEdge."
          title="Rapid to build. Easy to follow."
          lead="Every project runs on the SerenEdge Delivery Platform: plan it once, build it with AI, and watch it ship. Projects land on time and on budget."
        />
        <div className="why-flow grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)_56px_minmax(0,1fr)]">
          <Step vignette={<TasksVignette />} eyebrow="01 · Rapid development" title="Built with AI, shipped fast.">
            Projects are planned once into well-defined tasks, each with context, requirements and guidance. Engineers build
            with AI coding tools, so you get working software sooner, with less decoding and rework.
          </Step>
          <WhyLink />
          <Step vignette={<DeadlineVignette />} eyebrow="02 · Clean deadlines" title="A deadline system with no surprises.">
            Every project has milestones, a live countdown and a projected finish date driven by what the team is actually
            delivering. You see On Time, Behind or Ahead, not a hopeful guess.
          </Step>
          <WhyLink />
          <Step vignette={<PortalVignette />} eyebrow="03 · Client portal" title="Monitor it yourself.">
            After you&apos;re on board, you get a secure invite to{" "}
            <a className="underline underline-offset-3 transition-colors hover:text-accent" href={SITE.platformUrl} rel="noopener">
              platform.serenedge.com
            </a>{" "}
            to follow your project any time. No account setup, no technical knowledge needed.
          </Step>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Render them in `src/app/page.tsx`**

```tsx
import { Hero } from "@/components/home/Hero";
import { WhyFlow } from "@/components/home/WhyFlow";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyFlow />
    </>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build && npm run dev
```
Put `design-mock/index.html` and `http://localhost:3000` side by side at 1440px, 900px and 390px. Check:
- The hero has matching spacing and type. The kicker, both h1 lines, the rotator, the lead and the CTAs animate in on load.
- The rotator swaps a word every 2.6s with a blur-rise, and the width eases with no jump.
- Scrolling fades and lifts the hero.
- Why SerenEdge: the steps stagger in, the connectors draw as you scroll (desktop), the tasks tick in, the deadline bar fills, and the ring counts to 64%.
- Mobile: the steps stack with vertical dashed links.
- Reduced motion: no animation, first rotator word only, the ring shows 64%.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(home): hero, word rotator and Why SerenEdge with scroll motion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Home, part 2 (pinned client portal, developers, how we work)

**Files:**
- Create: `src/components/home/ClientPortal.tsx`, `DevJoin.tsx`, `HowSteps.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `MOTION`, `useGSAP`; `Eyebrow`, `Button`, `SectionIntro`, `ArrowIcon`, `Reveal`, `SplitHeading`, `CtaPanel`; `PROCESS`, `SITE`
- Produces: `<ClientPortal />`, `<DevJoin />`, `<HowSteps />`; the final Home page

Visual reference: `design-mock/index.html` lines 102–205.

- [ ] **Step 1: Create `src/components/home/ClientPortal.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { gsap, MOTION, ScrollTrigger, useGSAP } from "@/lib/gsap";

const ITEMS = [
  { key: "progress", title: "Progress", text: "How far along you are, as a simple percentage." },
  { key: "countdown", title: "Live countdowns", text: "To each milestone and to your deadline." },
  { key: "finish", title: "Projected finish", text: "A date based on what the team is really delivering." },
  { key: "update", title: "Weekly updates", text: "In plain language, with no jargon." },
  { key: "changes", title: "Change requests", text: "Ask for changes, then follow each from received to done, with a clear reason if it's held." },
] as const;
type Key = (typeof ITEMS)[number]["key"];

export function ClientPortal() {
  const ref = useRef<HTMLElement>(null);
  // null = not pinned (mobile, short screens, reduced motion): everything fully visible.
  const [active, setActive] = useState<Key | null>(null);
  const live = active !== null;
  const lit = (k: Key) => cn("transition-opacity duration-300", live && active !== k && "opacity-[.28]");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        { ok: MOTION.ok, pin: "(min-width: 901px) and (min-height: 820px)" },
        (ctx) => {
          const { ok, pin } = ctx.conditions as { ok: boolean; pin: boolean };
          if (!ok) return;

          if (!pin) {
            gsap.from(".tick-item, .dash", {
              autoAlpha: 0,
              y: 24,
              stagger: 0.08,
              duration: 0.9,
              ease: "expo.out",
              scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
            });
            return;
          }

          const bar = ref.current?.querySelector<HTMLElement>(".portal-bar");
          const num = ref.current?.querySelector<HTMLElement>(".portal-num");
          const count = { v: 0 };
          setActive(ITEMS[0].key);

          // 1 unit fills the progress bar, then 4 more units of pinned scroll for the rest.
          const tl = gsap
            .timeline({ defaults: { ease: "none" } })
            .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
            .to(count, { v: 64, duration: 1, onUpdate: () => num && (num.textContent = `${Math.round(count.v)}%`) }, 0)
            .to({}, { duration: ITEMS.length - 1 });

          ScrollTrigger.create({
            trigger: ".portal-split",
            start: "top top",
            end: () => `+=${window.innerHeight * 0.6 * ITEMS.length}`,
            pin: true,
            scrub: true,
            animation: tl,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const i = Math.min(ITEMS.length - 1, Math.floor(self.progress * ITEMS.length));
              setActive(ITEMS[i].key);
            },
          });

          return () => setActive(null);
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      aria-labelledby="clients"
      className="band px-(--gutter) pb-[clamp(24px,3vw,40px)] pt-[clamp(40px,4vw,56px)] pin:pt-0"
    >
      <div className="portal-split grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] pin:pt-28">
        <div className="flex flex-col gap-7">
          <Eyebrow inf>For clients</Eyebrow>
          <h2 id="clients" className="type-h2">
            <span className="text-accent">See your project,</span> any time.
          </h2>
          <p className="type-lead">Stop chasing status updates. Open one link and see where you stand.</p>
          <ul className="flex flex-col">
            {ITEMS.map((it) => {
              const on = active === it.key;
              return (
                <li
                  key={it.key}
                  className={cn(
                    "tick-item relative flex flex-wrap gap-x-2.5 gap-y-0.5 border-t border-line py-3.5 pl-8 text-base leading-normal transition-colors duration-300 last:border-b",
                    "before:inf-mask before:absolute before:left-0 before:top-[21px] before:h-[11px] before:w-[22px] before:transition-colors before:duration-300",
                    !live && "before:bg-accent",
                    live && (on ? "text-ink before:bg-accent" : "text-muted before:bg-line-2"),
                  )}
                >
                  <b className="font-semibold">{it.title}</b>
                  <span className={live && !on ? "text-inherit" : "text-muted"}>{it.text}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-[15px] leading-relaxed text-muted">
            Your budget stays protected. Changes are handled from a dedicated reserve, so requests don&apos;t quietly eat into
            the main scope.
          </p>
        </div>

        <figure className="dash overflow-hidden rounded-lg border border-line bg-white shadow-2">
          <div aria-hidden="true" className="flex h-10 items-center gap-1.5 border-b border-line bg-surface px-4">
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
            <span className="size-2.5 rounded-full bg-line-2" />
            <em className="ml-3 font-mono text-xs not-italic text-muted">platform.serenedge.com</em>
          </div>
          <div className="flex flex-col gap-6 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow>Sample project</Eyebrow>
                <h3 className="mt-1 font-display text-[22px] font-bold leading-[1.23]">Customer portal rebuild</h3>
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-ok">On time</span>
            </div>
            <div className={lit("progress")}>
              <div className="mb-2.5 flex items-baseline justify-between text-sm text-muted">
                <span>Overall progress</span>
                <b className="portal-num font-display text-[32px] leading-none text-ink">64%</b>
              </div>
              <div role="img" aria-label="64 percent complete" className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <i className="block h-full w-[64%] rounded-[inherit]">
                  <span className="portal-bar block h-full w-full origin-left rounded-[inherit] bg-accent" />
                </i>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["countdown", "Next milestone", "12 days", "Beta release"],
                  ["countdown", "Deadline", "41 days", "Final delivery"],
                  ["finish", "Projected finish", "2 days early", "At current pace"],
                ] as const
              ).map(([k, label, value, note]) => (
                <div key={label} className={cn("flex min-w-0 flex-col gap-1 rounded-md border border-line bg-surface p-3.5", lit(k))}>
                  <Eyebrow className="text-[10px]">{label}</Eyebrow>
                  <b className="font-display text-xl leading-[1.2]">{value}</b>
                  <small className="text-xs text-muted">{note}</small>
                </div>
              ))}
            </div>
            <div className={cn("flex flex-col gap-1.5 rounded-md border border-line bg-surface px-4 py-3.5", lit("update"))}>
              <Eyebrow>Weekly update · Week 7</Eyebrow>
              <p className="text-sm leading-[1.55]">Reports are in testing. Next up: inviting your team to the beta.</p>
            </div>
            <ul className={lit("changes")}>
              {(
                [
                  ["Add CSV export to reports", "In progress", "bg-accent/12"],
                  ["Change dashboard colours", "Done", "bg-ink text-white"],
                  ["Second language support", "Held · outside reserve", "bg-surface-2 text-muted"],
                ] as const
              ).map(([t, st, cls]) => (
                <li key={t} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 text-sm sm:flex-nowrap">
                  <span>{t}</span>
                  <em className={cn("whitespace-nowrap rounded-sm px-[9px] py-1 font-mono text-[11px] not-italic", cls)}>{st}</em>
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">
            Illustrative sample, not real client data.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
```
Note: the bar has an outer `<i>` at the real 64% width and an inner `.portal-bar` that GSAP scales 0→1, so without JS it still reads 64%.

- [ ] **Step 2: Create `src/components/home/DevJoin.tsx`**

```tsx
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";

export function DevJoin() {
  return (
    <section aria-labelledby="devs" className="px-(--gutter) py-[clamp(8px,2vw,24px)]">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-8 rounded-lg border border-line bg-surface px-[clamp(24px,3.6vw,48px)] py-[clamp(28px,3.6vw,40px)] md:flex-row md:items-center">
          <div className="flex flex-col gap-2.5">
            <Eyebrow inf>For developers</Eyebrow>
            <h2 id="devs" className="font-display text-[28px] font-bold leading-[1.2]">
              Real projects. Clear specs. Fair rewards.
            </h2>
            <p className="max-w-[620px] text-[15px] leading-relaxed text-muted">
              Well-defined tasks, your own AI tools, transparent pay and a bonus when a project lands under budget. Sign in,
              complete a short practice task and pick up your first task.
            </p>
          </div>
          <Button href={SITE.platformUrl} arrow className="shrink-0">
            Join as a developer
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/home/HowSteps.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { PROCESS } from "@/lib/site";

export function HowSteps() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap.from(".how-step", {
            autoAlpha: 0,
            y: 28,
            stagger: 0.1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: ".how-steps", start: "top 80%", once: true },
          });
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
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="how" className="band px-(--gutter) pb-[clamp(64px,7vw,104px)] pt-(--section-y)">
      <div className="flex flex-col gap-[clamp(40px,5vw,72px)]">
        <SectionIntro
          id="how"
          accent="How we work."
          title={'From "what if" to in production, in four steps.'}
          lead="Every engagement runs the same way. Predictable cadence, transparent progress, no agency-deck fluff."
        />
        <ol className="how-steps grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {PROCESS.map((s, n) => {
            const last = n === PROCESS.length - 1;
            return (
              <li key={s.num} className="how-step flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "how-dot flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[13px] font-medium",
                      last ? "how-dot--solid border-ink bg-ink text-white" : "border-accent bg-white",
                    )}
                  >
                    {s.num}
                  </span>
                  {!last && (
                    <span className="relative h-0.5 grow overflow-hidden rounded-[2px] bg-line-2">
                      <span className="how-line absolute inset-0 origin-left bg-accent" />
                    </span>
                  )}
                </div>
                <span className="eyebrow mt-2 text-muted">{s.tag}</span>
                <h3 className="font-display text-[26px] font-bold leading-[1.23]">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{s.homeText}</p>
              </li>
            );
          })}
        </ol>
        <Link
          href="/services"
          className="group inline-flex items-center gap-2 self-start text-base font-medium transition-colors hover:text-accent"
        >
          See how an engagement runs
          <ArrowIcon className="size-4 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
        </Link>
      </div>
    </section>
  );
}
```
- [ ] **Step 4: Final `src/app/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ClientPortal } from "@/components/home/ClientPortal";
import { DevJoin } from "@/components/home/DevJoin";
import { Hero } from "@/components/home/Hero";
import { HowSteps } from "@/components/home/HowSteps";
import { WhyFlow } from "@/components/home/WhyFlow";
import { CtaPanel } from "@/components/layout/CtaPanel";

export const metadata: Metadata = {
  title: { absolute: "SerenEdge · IT studio from Sri Lanka" },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyFlow />
      <ClientPortal />
      <DevJoin />
      <HowSteps />
      <CtaPanel accent="Get in touch." title="Tell us the problem. We'll write back in 24 hours." cta="Start a project" />
    </>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build && npm run dev
```
Check against `design-mock/index.html`:
- **Desktop ≥901×820:** For clients pins with its content clear of the nav. As you scroll, the checklist item and matching dashboard part light up one at a time across all 5 without skipping (try a fast flick). The progress bar and 64% count up during the first slice. Unpinning hands off smoothly to For developers.
- **Short window (e.g. 1400×700) and mobile:** no pin; items and dashboard reveal; everything is fully opaque.
- How we work: the dots turn blue and the lines fill in order as you scroll, and reverse when you scroll back up.
- CTA panel: scales up and its corners ease as it enters. It has **Phone**, not "Phone / WhatsApp".
- Navigate Home → About → Home: the curtain wipes, no pin spacer is left behind, and the page starts at the top.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(home): pinned client portal, developer block, how-we-work rail

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: About page

**Files:**
- Create: `src/components/about/AboutHero.tsx`, `NameBreakdown.tsx`, `Journey.tsx`
- Modify: `src/app/about/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `SplitHeading`, `Reveal`, `CtaPanel`, `ArrowIcon`, `Eyebrow`; `gsap`, `MOTION`, `useGSAP`; `SITE`
- Produces: `<AboutHero />`, `<NameBreakdown />`, `<Journey />`; the `/about` route

Visual reference: `design-mock/about.html` and the "About" and "About balance pass" CSS sections.

- [ ] **Step 1: Create `src/components/about/AboutHero.tsx`**

```tsx
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { SITE } from "@/lib/site";

function FounderLink() {
  return (
    <span className="group relative inline-block">
      <a className="underline underline-offset-3 transition-colors hover:text-accent" href={SITE.founderUrl} rel="noopener">
        Daham Dissanayake
      </a>
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-[calc(100%+14px)] z-40 hidden w-[200px] -translate-y-1.5 rounded-2xl bg-surface-2 p-2 opacity-0 shadow-[0_16px_32px_rgba(11,13,18,.18)] transition-[opacity,transform,visibility] duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 lg:block"
      >
        <Image
          src="/img/founder-daham.webp"
          alt=""
          width={184}
          height={224}
          className="h-56 w-full rounded-[10px] object-cover object-top"
        />
      </span>
    </span>
  );
}

export function AboutHero() {
  return (
    <section className="grid items-center gap-[clamp(28px,4.4vw,64px)] px-(--gutter) pb-[clamp(56px,6vw,88px)] pt-[clamp(128px,14vw,192px)] lg:grid-cols-2">
      <SplitHeading as="h1" onLoad className="type-hero">
        Not one lane.<span className="block text-accent">Every node.</span>
      </SplitHeading>
      <Reveal delay={0.3} className="flex flex-col gap-6">
        <p className="text-[clamp(18px,1.5vw,20px)] leading-relaxed">
          SerenEdge is not a company framed into a single pathway. Founded by <FounderLink />, we&apos;re an IT studio rooted in
          Sri Lanka and working with clients worldwide.
        </p>
        <p className="text-lg leading-[30px] text-muted">
          We don&apos;t specialise in one stack or one industry. We pick up problems other shops won&apos;t touch (embedded
          firmware, ML pipelines, custom ERPs, IoT fleets, web platforms) and we see them through. Same team, same
          accountability, start to finish.
        </p>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/about/NameBreakdown.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

const word = "font-display text-[min(18.6vw,268px)] font-bold leading-[.9] tracking-[-.04em] pb-[.24em]";
const bracket =
  "nm-bracket mx-[clamp(6px,.8vw,12px)] h-3 rounded-b-[6px] border-x-[3px] border-b-[3px] sm:h-[18px] sm:rounded-b-lg sm:border-x-4 sm:border-b-4";
const meta =
  "nm-meta col-span-full flex max-w-[520px] flex-col gap-2.5 px-[clamp(6px,.8vw,12px)] sm:col-span-1 sm:mx-auto sm:items-center sm:pt-[22px] sm:text-center";

export function NameBreakdown() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: ".nm", start: "top 85%", end: "top 35%", scrub: 0.6 },
            })
            .from(".nm-seren", { xPercent: -30, autoAlpha: 0 }, 0)
            .from(".nm-edge", { xPercent: 30, autoAlpha: 0 }, 0)
            .from(".nm-bracket", { scaleX: 0, stagger: 0.1 }, 0.6)
            .from(".nm-meta", { autoAlpha: 0, y: 20, stagger: 0.1 }, 0.9);
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="name" className="band px-(--gutter) py-(--section-y)">
      <div className="flex flex-col gap-16">
        <SplitHeading id="name" className="type-h2">
          <span className="text-accent">The name.</span> It says it plainly.
        </SplitHeading>
        <div className="nm grid grid-cols-[auto_auto] justify-center">
          <span aria-hidden="true" className={cn("nm-seren", word)}>
            Seren
          </span>
          <span aria-hidden="true" className={cn("nm-edge text-accent", word)}>
            Edge
          </span>
          <span aria-hidden="true" className={cn(bracket, "border-ink")} />
          <span aria-hidden="true" className={cn(bracket, "border-accent")} />
          <div className={cn(meta, "pt-5")}>
            <span className="eyebrow text-muted">01 · the root</span>
            <p className="text-[clamp(17px,1.4vw,20px)] leading-[1.55] text-muted">
              <b className="sr-only">Seren: </b>for Sri Lanka, where we&apos;re rooted.
            </p>
          </div>
          <div className={cn(meta, "mt-4 border-t border-line pt-4 sm:mt-0 sm:border-t-0")}>
            <span className="eyebrow text-accent">02 · the reach</span>
            <p className="text-[clamp(17px,1.4vw,20px)] leading-[1.55] text-muted">
              <b className="sr-only">Edge: </b>for the way we work: connecting through every node, reaching every layer of
              the stack.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/about/Journey.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { SITE } from "@/lib/site";

// A rail runs from this dot's centre to the next dot's centre: item width + 32px gap - 2 × 14px dot clearance.
const rail = "absolute left-[calc(50%+14px)] top-1/2 -mt-px hidden h-0.5 w-[calc(100%+4px)] lg:block";

export function Journey() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap.from(".j-item", {
            autoAlpha: 0,
            y: 24,
            stagger: 0.12,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: ".journey", start: "top 80%", once: true },
          });
          gsap.from(".j-line", {
            scaleX: 0,
            ease: "none",
            stagger: 0.5,
            scrollTrigger: { trigger: ".journey", start: "top 75%", end: "top 35%", scrub: true },
          });
          gsap.to(".j-pulse", { scale: 1.6, autoAlpha: 0, duration: 1.8, ease: "power2.out", repeat: -1 });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="record" className="px-(--gutter) py-(--section-y)">
      <div className="flex flex-col gap-16">
        <SplitHeading id="record" className="type-h2">
          <span className="text-accent">On the record.</span> How we got here.
        </SplitHeading>
        <ol className="journey grid gap-8 lg:grid-cols-3">
          <li className="j-item flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-4 w-full justify-center">
              <span className="size-[18px] rounded-full border-2 border-accent bg-accent" />
              <span className={rail}>
                <span className="j-line absolute inset-0 origin-left rounded-[2px] bg-accent" />
              </span>
            </div>
            <span className="eyebrow mt-2 text-muted">Feb 2026</span>
            <h3 className="font-display text-[clamp(24px,2.2vw,30px)] font-bold leading-[1.2]">SerenEdge founded</h3>
            <p className="max-w-[340px] text-base leading-relaxed text-muted text-pretty">
              Daham Dissanayake starts SerenEdge in Sri Lanka: one team for web, IoT, automation, systems and ML. Building in
              public from day one.
            </p>
          </li>
          <li className="j-item flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-4 w-full justify-center">
              <span className="relative size-[18px] rounded-full border-4 border-accent bg-white">
                <span className="j-pulse absolute -inset-[8px] rounded-full bg-accent/16" />
              </span>
              <span className={rail}>
                <span className="j-line absolute inset-0 origin-left bg-[repeating-linear-gradient(90deg,var(--color-line-2)_0_8px,transparent_8px_14px)]" />
              </span>
            </div>
            <span className="eyebrow mt-2 text-accent">Now</span>
            <h3 className="font-display text-[clamp(24px,2.2vw,30px)] font-bold leading-[1.2]">Delivery platform live</h3>
            <p className="max-w-[340px] text-base leading-relaxed text-muted text-pretty">
              Every project runs on{" "}
              <a className="underline underline-offset-3 transition-colors hover:text-accent" href={SITE.platformUrl} rel="noopener">
                platform.serenedge.com
              </a>
              : planned tasks, live deadlines and a portal clients can open any time.
            </p>
          </li>
          <li className="j-item flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-4 w-full justify-center">
              <span className={cn("size-[18px] rounded-full border-2 border-dashed border-accent bg-white")} />
            </div>
            <span className="eyebrow mt-2 text-muted">Next</span>
            <h3 className="font-display text-[clamp(24px,2.2vw,30px)] font-bold leading-[1.2]">
              Yours<span className="font-normal">?</span>
            </h3>
            <p className="max-w-[340px] text-base leading-relaxed text-muted text-pretty">
              Bring the problem other shops won&apos;t touch. The first call is free.
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 text-base font-medium transition-colors hover:text-accent"
            >
              Reach out and book a call
              <ArrowIcon className="size-4 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace `src/app/about/page.tsx`**

```tsx
import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { Journey } from "@/components/about/Journey";
import { NameBreakdown } from "@/components/about/NameBreakdown";
import { CtaPanel } from "@/components/layout/CtaPanel";

export const metadata: Metadata = {
  title: "About",
  description:
    "SerenEdge is an IT studio rooted in Sri Lanka, founded by Daham Dissanayake. Not one lane: web, IoT, automation, systems and ML, one team end to end.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <NameBreakdown />
      <Journey />
      <CtaPanel accent="Get in touch." title="Tell us the problem. We'll write back in 24 hours." cta="Start a project" />
    </>
  );
}
```
Before finalising the description, open `design-mock/about.html` `<head>` and copy its `<meta name="description">` verbatim if it differs.

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build && npm run dev
```
Check `/about` against `design-mock/about.html` at 1440, 900 and 390px:
- The hero splits in; the founder photo card appears on hover and focus (desktop only).
- "Seren" and "Edge" slide together as you scroll, the brackets draw, the notes fade up. There is no horizontal scrollbar at any point.
- The journey rails draw in order (solid, then dashed), and the "Now" dot pulses.
- Mobile: the rails are hidden and the items stack.
- Reduced motion: everything is static, no pulse.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(about): hero, name breakdown and journey timeline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Services page

**Files:**
- Create: `src/components/services/ServiceList.tsx`, `ProcessCards.tsx`, `ToolMarquee.tsx`
- Modify: `src/app/services/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `SERVICES`, `PROCESS`, `TOOLS`, `topicFromSlug`; `PageHero`, `SectionIntro`, `Button`, `ArrowIcon`, `InfMark`, `Reveal`, `CtaPanel`; `gsap`, `MOTION`, `useGSAP`; `useLenis`
- Produces: `<ServiceList />`, `<ProcessCards />`, `<ToolMarquee />`; the `/services` route. Service rows link to `/contact?topic=<slug>`.

Visual reference: `design-mock/services.html` and the "Services" CSS sections at the end of `styles.css`.

- [ ] **Step 1: Create `src/components/services/ServiceList.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { SERVICES, type Service } from "@/lib/site";

function Gets({ service, dark = false }: { service: Service; dark?: boolean }) {
  return (
    <>
      <span className={cn("font-mono text-[10.5px] uppercase tracking-[.08em]", dark ? "text-soft" : "text-muted")}>You get</span>
      <ul className="mb-1.5 flex flex-col gap-2">
        {service.gets.map((g) => (
          <li
            key={g}
            className="relative pl-7 text-[14.5px] leading-[1.45] before:inf-mask before:absolute before:left-0 before:top-[.42em] before:h-[9px] before:w-[18px] before:bg-accent"
          >
            {g}
          </li>
        ))}
      </ul>
      <span className={cn("font-mono text-[10.5px] uppercase tracking-[.08em]", dark ? "text-soft" : "text-muted")}>Great if</span>
      <p className={cn("text-[14.5px] leading-normal first-letter:uppercase", dark && "text-on-dark")}>{service.fit}</p>
    </>
  );
}

export function ServiceList() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<Service | null>(null);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  // Set by the desktop-only matchMedia branch; places the card instantly or smoothly.
  const placeRef = useRef<((x: number, y: number, instant: boolean) => void) | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap.from(".srow", {
            autoAlpha: 0,
            y: 24,
            stagger: 0.06,
            duration: 0.9,
            ease: "expo.out",
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: ".srows", start: "top 85%", once: true },
          });
        },
        wrapRef,
      );
      mm.add(
        { fine: MOTION.fine, reduce: MOTION.reduce },
        (ctx) => {
          const { fine, reduce } = ctx.conditions as { fine: boolean; reduce: boolean };
          if (!fine) return;
          const card = cardRef.current!;
          const xTo = gsap.quickTo(card, "x", { duration: reduce ? 0 : 0.45, ease: "power3.out" });
          const yTo = gsap.quickTo(card, "y", { duration: reduce ? 0 : 0.45, ease: "power3.out" });
          placeRef.current = (x, y, instant) => {
            if (instant) {
              gsap.set(card, { x, y });
              xTo(x, x);
              yTo(y, y);
            } else {
              xTo(x);
              yTo(y);
            }
          };
          return () => {
            placeRef.current = null;
          };
        },
        wrapRef,
      );
    },
    { scope: wrapRef },
  );

  function targetFor(e: React.PointerEvent) {
    const wrap = wrapRef.current!.getBoundingClientRect();
    const card = cardRef.current!;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let x = e.clientX - wrap.left + 28;
    if (e.clientX + 28 + w > window.innerWidth - 16) x = e.clientX - wrap.left - w - 28; // flip near the right edge
    const y = Math.max(-40, Math.min(wrap.height - h + 40, e.clientY - wrap.top - h / 2));
    return { x, y };
  }

  function show(service: Service, e: React.PointerEvent) {
    if (!placeRef.current) return;
    setCurrent(service);
    const { x, y } = targetFor(e);
    placeRef.current(x, y, !visible);
    setVisible(true);
  }

  function showBeside(service: Service, link: HTMLElement) {
    if (!placeRef.current) return;
    setCurrent(service);
    const wrap = wrapRef.current!.getBoundingClientRect();
    const b = link.getBoundingClientRect();
    placeRef.current(b.right - wrap.left + 28, b.top - wrap.top - 20, true);
    setVisible(true);
  }

  return (
    <section aria-labelledby="svc-list" className="px-(--gutter) pb-(--section-y)">
      <h2 id="svc-list" className="sr-only">
        What we do
      </h2>
      <div
        ref={wrapRef}
        className="relative"
        onPointerMove={(e) => {
          if (visible && placeRef.current) {
            const { x, y } = targetFor(e);
            placeRef.current(x, y, false);
          }
        }}
      >
        <div
          ref={cardRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-[5] hidden opacity-0 transition-opacity duration-250 will-change-transform fine:lg:block",
            visible && "opacity-100",
          )}
        >
          <div
            className={cn(
              "w-[340px] origin-left overflow-hidden rounded-[18px] bg-ink shadow-[0_24px_48px_rgba(11,13,18,.28)] transition-transform duration-350 ease-out-expo",
              visible ? "scale-100 rotate-0" : "scale-[.92] -rotate-2",
            )}
          >
            {current && (
              <>
                <div className="flex items-baseline gap-2.5 border-b border-white/10 px-5 py-4">
                  <span className="font-mono text-xs text-accent">{current.num}</span>
                  <span className="font-display text-[19px] font-bold text-white">{current.name}</span>
                </div>
                <div className="flex flex-col gap-2.5 px-5 py-4 text-white">
                  <Gets service={current} dark />
                </div>
                <div className="flex items-center gap-2 bg-accent/16 px-5 py-[13px] text-[13.5px] font-semibold text-white">
                  Book a call about this
                  <ArrowIcon className="size-[15px]" />
                </div>
              </>
            )}
          </div>
        </div>

        <ol className="srows group/list">
          {SERVICES.map((s) => {
            const isOpen = open === s.num;
            return (
              <li
                key={s.num}
                onPointerEnter={(e) => show(s, e)}
                onPointerLeave={() => setVisible(false)}
                className="srow group/row relative grid grid-cols-[44px_minmax(0,1fr)] items-baseline gap-x-8 gap-y-2 border-b border-line py-6 transition-opacity duration-300 has-[.srow-link:focus-visible]:outline-2 has-[.srow-link:focus-visible]:outline-offset-4 has-[.srow-link:focus-visible]:outline-accent fine:group-hover/list:opacity-[.38] fine:hover:opacity-100! lg:grid-cols-[64px_minmax(0,3.2fr)_minmax(0,4.4fr)_minmax(0,3.4fr)] lg:py-7"
              >
                <span className="font-mono text-[13px] text-accent">{s.num}</span>
                <h3 className="font-display text-[clamp(22px,2vw,28px)] font-bold leading-[1.2] tracking-[-.01em] transition-[transform,color] duration-350 ease-out-expo fine:group-hover/row:translate-x-2.5 fine:group-hover/row:text-accent">
                  <Link
                    href={`/contact?topic=${s.topic}`}
                    className="srow-link after:absolute after:inset-0 after:z-[1] focus-visible:outline-none"
                    onFocus={(e) => showBeside(s, e.currentTarget)}
                    onBlur={() => setVisible(false)}
                  >
                    {s.name}
                    <ArrowIcon className="ml-2.5 inline-block size-5 -translate-x-2 align-[-2px] opacity-0 transition-[opacity,transform] duration-300 ease-out-expo fine:group-hover/row:translate-x-0 fine:group-hover/row:opacity-100" />
                  </Link>
                </h3>
                <p className="col-start-2 max-w-[480px] text-[15.5px] leading-relaxed text-muted lg:col-start-auto">{s.desc}</p>
                <ul aria-label="Tools" className="col-start-2 mt-1.5 flex flex-wrap gap-1.5 lg:col-start-auto lg:mt-0 lg:justify-end">
                  {s.tags.map((t) => (
                    <li key={t} className="flex h-[26px] items-center rounded-sm border border-line px-2.5 font-mono text-[11px] text-muted">
                      {t}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`more-${s.num}`}
                  onClick={() => setOpen(isOpen ? null : s.num)}
                  className="relative z-[2] col-start-2 mt-1 inline-flex items-center gap-2 justify-self-start py-2 text-sm font-semibold text-ink after:size-2 after:-translate-y-[3px] after:rotate-45 after:border-b-[1.5px] after:border-r-[1.5px] after:border-current after:transition-transform after:duration-250 aria-expanded:after:-translate-y-px aria-expanded:after:-rotate-[135deg] fine:lg:hidden"
                >
                  What you get
                </button>
                <div
                  id={`more-${s.num}`}
                  inert={!isOpen}
                  className={cn(
                    "relative z-[2] col-start-2 grid transition-[grid-template-rows] duration-300 ease-out-expo lg:col-span-3 fine:lg:hidden",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mt-1 flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-[18px]">
                      <Gets service={s} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          <li className="grid grid-cols-[44px_minmax(0,1fr)] items-baseline gap-x-8 gap-y-2 border-b border-line py-6 lg:grid-cols-[64px_minmax(0,3.2fr)_minmax(0,4.4fr)_minmax(0,3.4fr)] lg:py-7">
            <span className="font-mono text-[13px] text-accent">?</span>
            <h3 className="font-display text-[clamp(22px,2vw,28px)] font-bold leading-[1.2] tracking-[-.01em] text-accent">
              Something weird<span className="font-normal">?</span>
            </h3>
            <p className="col-start-2 max-w-[480px] text-[15.5px] leading-relaxed text-muted lg:col-start-auto">
              If it ships software, signals or sensors and nobody else wants to take it on, that&apos;s exactly the brief we love.
            </p>
            <Link
              href="/contact?topic=other"
              className="group col-start-2 mt-1 inline-flex items-center gap-2 justify-self-start self-center text-base font-medium transition-colors hover:text-accent lg:col-start-auto lg:mt-0 lg:justify-self-end"
            >
              Tell us about it
              <ArrowIcon className="size-4 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/services/ProcessCards.tsx`**

```tsx
import { Reveal } from "@/components/motion/Reveal";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { PROCESS } from "@/lib/site";

export function ProcessCards() {
  return (
    <section aria-labelledby="how" className="band px-(--gutter) py-(--section-y)">
      <div className="flex flex-col gap-16">
        <SectionIntro
          id="how"
          accent="How we work."
          title={'From "what if" to in production, in four steps.'}
          lead="Every engagement runs the same way. Predictable cadence, transparent progress, no agency-deck fluff."
        />
        <Reveal as="ol" stagger={0.12} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PROCESS.map((s, n) => {
            const dark = n === PROCESS.length - 1;
            return (
              <li
                key={s.num}
                className={cn(
                  "flex flex-col gap-4 rounded-lg border p-8 shadow-1",
                  dark ? "border-ink bg-ink text-white" : "border-line bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 font-mono text-[13px] font-medium",
                      dark ? "border-accent bg-accent text-ink" : "border-accent bg-white",
                    )}
                  >
                    {s.num}
                  </span>
                  <span className={cn("eyebrow", dark ? "text-soft" : "text-muted")}>{s.tag}</span>
                </div>
                <h3 className="mt-2 font-display text-[26px] font-bold leading-[1.23]">{s.title}</h3>
                <p className={cn("grow text-[15px] leading-relaxed", dark ? "text-on-dark" : "text-muted")}>{s.text}</p>
                <dl className="mt-2">
                  {s.facts.map(([dt, dd]) => (
                    <div key={dt} className={cn("flex justify-between gap-3 border-t py-3", dark ? "border-white/14" : "border-line")}>
                      <dt className={cn("font-mono text-xs uppercase tracking-[.06em]", dark ? "text-soft" : "text-muted")}>{dt}</dt>
                      <dd className="text-right text-sm font-medium">{dd}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/services/ToolMarquee.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useLenis } from "lenis/react";
import { useRef } from "react";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { TOOLS } from "@/lib/site";

export function ToolMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const speed = useRef({ target: 1, current: 1, hover: false });

  // Scroll velocity nudges the marquee faster; it eases back to 1× on its own.
  useLenis(({ velocity }) => {
    speed.current.target = 1 + Math.min(Math.abs(velocity) / 6, 5);
  });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          // Two identical copies: -50% lands exactly on the start of the second one.
          const loop = gsap.to(".mq-track", { xPercent: -50, duration: 70, ease: "none", repeat: -1 });
          const tick = () => {
            const s = speed.current;
            s.target += (1 - s.target) * 0.04;
            const goal = s.hover ? 0 : s.target;
            s.current += (goal - s.current) * 0.1;
            loop.timeScale(Math.max(0.0001, s.current));
          };
          gsap.ticker.add(tick);
          return () => gsap.ticker.remove(tick);
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section aria-labelledby="tools" className="px-(--gutter) pb-(--section-y) pt-[clamp(56px,7vw,96px)]">
      <SectionIntro
        id="tools"
        accent="Toolbox."
        title="What we reach for."
        lead="From web stacks to AI integration and hardware, picked for the job, not the trend."
        className="mb-[clamp(32px,4vw,48px)]"
      />
      <div
        ref={ref}
        role="group"
        aria-label={`Tools we use: ${TOOLS.map((t) => t.name).join(", ")}`}
        onPointerEnter={() => (speed.current.hover = true)}
        onPointerLeave={() => (speed.current.hover = false)}
        className="overflow-hidden motion-safe:[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      >
        <div className="mq-track flex w-max motion-reduce:w-auto">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden="true" className={cn("flex shrink-0 motion-reduce:flex-wrap", copy === 1 && "motion-reduce:hidden")}>
              {TOOLS.map((t) => (
                <li key={t.name} className="mr-6 flex h-[52px] items-center gap-3 whitespace-nowrap px-5 text-sm font-medium md:h-[60px] md:text-[15px]">
                  <Image src={`/logos/${t.logo}.svg`} alt="" width={26} height={26} className="size-6 object-contain md:size-[26px]" />
                  <span>{t.name}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
```
`timeScale(0)` would pause the tween permanently in some GSAP versions, so the floor is `0.0001`.

- [ ] **Step 4: Replace `src/app/services/page.tsx`**

```tsx
import type { Metadata } from "next";
import { CtaPanel } from "@/components/layout/CtaPanel";
import { ProcessCards } from "@/components/services/ProcessCards";
import { ServiceList } from "@/components/services/ServiceList";
import { ToolMarquee } from "@/components/services/ToolMarquee";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web development, IoT projects, automation, system development, installations and AI systems. Six disciplines, one continuous team.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Six disciplines."
        accent="One continuous team."
        lead="We don't hand you off between agencies. The same people who scope your project also write the firmware, train the model and push to production."
      >
        <Button href="/contact" arrow>
          Book a discovery call
        </Button>
      </PageHero>
      <ServiceList />
      <ProcessCards />
      <ToolMarquee />
      <CtaPanel accent="Step 01 is free." title="Tell us the problem. We'll write back in 24 hours." cta="Book a discovery call" />
    </>
  );
}
```
Copy the `<meta name="description">` from `design-mock/services.html` verbatim if it differs.

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build && npm run dev
```
Check `/services` against `design-mock/services.html`:
- **Desktop with a mouse:** hovering a row dims the others, shifts the name and shows the arrow. The dark "You get" card follows the cursor smoothly, flips left near the right edge and does not slide in from the corner on first hover. Tab onto a row link: the card appears beside it and the row gets a focus outline.
- Clicking a row goes to `/contact?topic=iot` (etc.).
- **≤900px or touch** (DevTools device mode): no card. "What you get" expands and collapses with a height animation, and the chevron rotates.
- Process cards stagger in; the dark card is last.
- Marquee: loops seamlessly, speeds up while you scroll fast, eases back, and stops on hover. Under reduced motion it's a static wrapped list.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(services): service list with hover card, process cards, tool marquee

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Email logo, templates and payload builders

**Files:**
- Create: `scripts/make-email-logo.mjs`, `src/emails/static/logo-email.png` (generated)
- Create: `src/emails/components/EmailShell.tsx`, `src/emails/ClientConfirmation.tsx`, `src/emails/TeamNotification.tsx`
- Create: `src/lib/email.tsx`
- Test: `src/lib/email.test.tsx`

**Interfaces:**
- Consumes: `ContactInput` (`@/lib/contact-schema`); `SITE`, `topicFromSlug` (`@/lib/site`)
- Produces (`@/lib/email`):
  - `DEFAULT_TO = "daham@serenedge.com"`, `DEFAULT_FROM = "SerenEdge <sales@serenedge.com>"`, `LOGO_CID = "serenedge-logo"` (re-exported from EmailShell)
  - `getEmailConfig(env?: Record<string, string | undefined>): { apiKey: string | null; to: string; from: string }`
  - `firstNameOf(name: string): string`
  - `oneLine(s: string): string`
  - `buildReplyMailto(email: string, firstName: string): string`
  - `formatSubmittedAt(date: Date): string`
  - `loadLogo(): Promise<Buffer>`
  - `type EmailPayload = { from: string; to: string; replyTo: string; subject: string; html: string; text: string; attachments: { filename: string; content: Buffer; contentId: string }[] }`
  - `buildTeamEmail(data: ContactInput, opts: { from: string; to: string; logo: Buffer; now: Date }): Promise<EmailPayload>`
  - `buildClientEmail(data: ContactInput, opts: { from: string; logo: Buffer }): Promise<EmailPayload>`
  - `createResend(apiKey: string): Resend`

**Template rule:** put any text a test asserts on in a single template literal (`{`Thanks, ${firstName}.`}`). Adjacent JSX text and expressions render with `<!-- -->` between them, which breaks string assertions.

- [ ] **Step 1: Create `scripts/make-email-logo.mjs` and generate the PNG**

```js
// Builds the email logo: 480px wide, solid white background (never transparent)
// so the black infinity stays visible in dark-mode inboxes.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const out = "src/emails/static/logo-email.png";
await mkdir("src/emails/static", { recursive: true });
const info = await sharp("design-mock/img/Base Logo - Dark.png")
  .resize({ width: 480 })
  .flatten({ background: "#ffffff" })
  .png({ compressionLevel: 9 })
  .toFile(out);
console.log(`${out}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
```

Run: `npm run email:logo`
Expected output like `src/emails/static/logo-email.png: 480x264, 20 KB`. **Write down the height.** The `<Img>` in EmailShell displays at width 120, so its `height` must be `Math.round(120 * height / 480)` (66 for 264). Open the PNG to confirm a white (not checkered) background.

- [ ] **Step 2: Create `src/emails/components/EmailShell.tsx`**

```tsx
import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { Fragment, type CSSProperties, type ReactNode } from "react";

export const LOGO_CID = "serenedge-logo";

export const colors = {
  ink: "#0b0d12",
  muted: "#5b6470",
  soft: "#8f98a6",
  line: "#dfe3e9",
  surface: "#f6f7f9",
  accent: "#5b8ac5",
  white: "#ffffff",
} as const;

export const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export const styles = {
  eyebrow: {
    margin: "0 0 10px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: colors.accent,
  },
  h1: { margin: "0 0 14px", fontSize: 28, lineHeight: "34px", fontWeight: 700, color: colors.ink },
  body: { margin: "0 0 20px", fontSize: 16, lineHeight: "26px", color: colors.muted },
  box: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: 12,
    padding: "18px 20px",
    margin: "0 0 28px",
  },
  label: { margin: "0 0 4px", fontSize: 12, color: colors.soft, textTransform: "uppercase", letterSpacing: "0.06em" },
  value: { margin: "0 0 12px", fontSize: 15, lineHeight: "22px", color: colors.ink },
  quote: {
    margin: 0,
    fontSize: 15,
    lineHeight: "24px",
    color: colors.ink,
    borderLeft: `3px solid ${colors.accent}`,
    paddingLeft: 14,
  },
} satisfies Record<string, CSSProperties>;

/** Renders user text with its line breaks (React escapes the text itself). */
export function multiline(text: string): ReactNode {
  return text.split(/\r?\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export function EmailButton({ href, children, variant = "primary" }: { href: string; children: string; variant?: "primary" | "secondary" }) {
  const primary = variant === "primary";
  return (
    <Button
      href={href}
      style={{
        backgroundColor: primary ? colors.ink : colors.white,
        color: primary ? colors.white : colors.ink,
        border: `1px solid ${primary ? colors.ink : colors.line}`,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        fontFamily: font,
        padding: "14px 22px",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {children}
    </Button>
  );
}

type ShellProps = { preview: string; children: ReactNode; logoSrc?: string };

export function EmailShell({ preview, children, logoSrc = `cid:${LOGO_CID}` }: ShellProps) {
  const footer: CSSProperties = { margin: "0 0 6px", fontSize: 12, lineHeight: "18px", color: colors.soft, fontFamily: font };
  const footerLink: CSSProperties = { color: colors.muted, textDecoration: "none" };
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: colors.surface, fontFamily: font, color: colors.ink }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}>
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 20 }}>
            <Section style={{ padding: "28px 36px 20px" }}>
              <Img
                src={logoSrc}
                width="120"
                height="66"
                alt="SerenEdge"
                style={{ display: "block", color: colors.accent, fontSize: 20, fontWeight: 700, fontFamily: font }}
              />
            </Section>
            <Hr style={{ borderColor: colors.line, margin: 0 }} />
            <Section style={{ padding: "32px 36px 36px" }}>{children}</Section>
          </Section>
          <Section style={{ padding: "24px 12px 0", textAlign: "center" }}>
            <Text style={footer}>SerenEdge · for each node.</Text>
            <Text style={footer}>
              <Link href="mailto:sales@serenedge.com" style={footerLink}>
                sales@serenedge.com
              </Link>
              {" · "}
              <Link href="tel:+94704888440" style={footerLink}>
                +94 70 488 8440
              </Link>
              {" · "}
              <Link href="https://serenedge.com" style={footerLink}>
                serenedge.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```
Set `height="66"` to the value you calculated in Step 1.

- [ ] **Step 3: Create `src/emails/ClientConfirmation.tsx`**

```tsx
import { Column, Heading, Hr, Row, Section, Text } from "@react-email/components";
import { colors, EmailButton, EmailShell, multiline, styles } from "./components/EmailShell";

export type ClientConfirmationProps = {
  firstName: string;
  topicLabel: string;
  company: string;
  message: string;
  logoSrc?: string;
};

const STEPS = [
  "We read your message and reply within 24 hours to set up the call.",
  "We meet for a free 90-minute discovery call. You talk, we map.",
  "Within a week you get a problem doc and a scope. Still free.",
];

export default function ClientConfirmation({ firstName, topicLabel, company, message, logoSrc }: ClientConfirmationProps) {
  return (
    <EmailShell preview="Thanks for reaching out. We'll be in touch within 24 hours." logoSrc={logoSrc}>
      <Text style={styles.eyebrow}>Message received</Text>
      <Heading as="h1" style={styles.h1}>{`Thanks, ${firstName}.`}</Heading>
      <Text style={styles.body}>
        We&apos;ll be in touch within 24 hours to set up your discovery call. Every message is read personally, never by a bot.
      </Text>

      <Section style={styles.box}>
        <Text style={styles.label}>Your message</Text>
        <Text style={styles.value}>{company ? `${topicLabel} · ${company}` : topicLabel}</Text>
        <Text style={styles.quote}>{multiline(message)}</Text>
      </Section>

      <Text style={styles.eyebrow}>What happens next</Text>
      {STEPS.map((step, i) => (
        <Row key={step} style={{ marginBottom: 10 }}>
          <Column style={{ width: 32, verticalAlign: "top" }}>
            <Text
              style={{
                margin: 0,
                width: 24,
                height: 24,
                lineHeight: "24px",
                borderRadius: 12,
                backgroundColor: colors.ink,
                color: colors.white,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {String(i + 1)}
            </Text>
          </Column>
          <Column>
            <Text style={{ margin: 0, fontSize: 15, lineHeight: "24px", color: colors.ink }}>{step}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: colors.line, margin: "28px 0" }} />
      <Text style={styles.body}>Prefer to talk? We take direct calls.</Text>
      <EmailButton href="tel:+94704888440" variant="secondary">
        Call +94 70 488 8440
      </EmailButton>
      <Text style={{ ...styles.body, margin: "28px 0 0", color: colors.ink }}>The SerenEdge team</Text>
    </EmailShell>
  );
}

ClientConfirmation.PreviewProps = {
  firstName: "Jane",
  topicLabel: "IoT Projects",
  company: "Green Acres",
  message: "We run 40 greenhouses.\nWe'd like live humidity readings and alerts.",
  logoSrc: "/static/logo-email.png",
} satisfies ClientConfirmationProps;
```

- [ ] **Step 4: Create `src/emails/TeamNotification.tsx`**

```tsx
import { Column, Heading, Link, Row, Section, Text } from "@react-email/components";
import { colors, EmailButton, EmailShell, multiline, styles } from "./components/EmailShell";

export type TeamNotificationProps = {
  name: string;
  firstName: string;
  email: string;
  phone: string;
  company: string;
  topicLabel: string;
  message: string;
  submittedAt: string;
  replyHref: string;
  logoSrc?: string;
};

export default function TeamNotification(p: TeamNotificationProps) {
  const rows: [string, React.ReactNode][] = [
    ["Name", p.name],
    ["Email", <Link key="e" href={`mailto:${p.email}`} style={{ color: colors.accent }}>{p.email}</Link>],
    ...(p.phone ? ([["Phone", p.phone]] as [string, React.ReactNode][]) : []),
    ...(p.company ? ([["Company", p.company]] as [string, React.ReactNode][]) : []),
    ["Topic", p.topicLabel],
    ["Submitted", p.submittedAt],
  ];
  const tel = p.phone.replace(/[^\d+]/g, "");

  return (
    <EmailShell preview={`${p.name} wants to talk about ${p.topicLabel}.`} logoSrc={p.logoSrc}>
      <Text style={styles.eyebrow}>New enquiry</Text>
      <Heading as="h1" style={styles.h1}>{`${p.name} wants to talk about ${p.topicLabel}`}</Heading>
      <Text style={styles.body}>Reply straight from this email: the Reply button and your mail app&apos;s Reply both go to the client.</Text>

      <Section style={{ margin: "0 0 28px" }}>
        <Row>
          <Column style={{ paddingRight: 8, width: "1%", whiteSpace: "nowrap" }}>
            <EmailButton href={p.replyHref}>{`Reply to ${p.firstName}`}</EmailButton>
          </Column>
          {tel && (
            <Column>
              <EmailButton href={`tel:${tel}`} variant="secondary">{`Call ${p.phone}`}</EmailButton>
            </Column>
          )}
        </Row>
      </Section>

      <Section style={styles.box}>
        {rows.map(([label, value]) => (
          <Row key={label}>
            <Column style={{ width: 110, verticalAlign: "top" }}>
              <Text style={styles.label}>{label}</Text>
            </Column>
            <Column>
              <Text style={styles.value}>{value}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Text style={styles.eyebrow}>Message</Text>
      <Text style={styles.quote}>{multiline(p.message)}</Text>
    </EmailShell>
  );
}

TeamNotification.PreviewProps = {
  name: "Jane Smith",
  firstName: "Jane",
  email: "jane@company.com",
  phone: "+94 71 234 5678",
  company: "Green Acres",
  topicLabel: "IoT Projects",
  message: "We run 40 greenhouses.\nWe'd like live humidity readings and alerts.",
  submittedAt: "27 Sept 2026, 14:05 (Sri Lanka)",
  replyHref: "mailto:jane@company.com?subject=Re%3A%20Your%20SerenEdge%20enquiry",
  logoSrc: "/static/logo-email.png",
} satisfies TeamNotificationProps;
```

- [ ] **Step 5: Write the failing tests for the builders**

`src/lib/email.test.tsx`:
```tsx
import { describe, expect, it } from "vitest";
import type { ContactInput } from "./contact-schema";
import {
  buildClientEmail,
  buildReplyMailto,
  buildTeamEmail,
  firstNameOf,
  formatSubmittedAt,
  getEmailConfig,
  oneLine,
} from "./email";

const logo = Buffer.from("png");
const now = new Date("2026-09-27T08:35:00Z"); // 14:05 in Colombo
const data: ContactInput = {
  topic: "iot",
  name: "Jane Smith",
  email: "jane+site@company.com",
  phone: "",
  company: "",
  message: "Line one <script>alert(1)</script>\nLine two",
};
const team = (d: Partial<ContactInput> = {}) =>
  buildTeamEmail({ ...data, ...d }, { from: "SerenEdge <sales@serenedge.com>", to: "daham@serenedge.com", logo, now });

describe("helpers", () => {
  it("getEmailConfig falls back to defaults and treats blank key as missing", () => {
    expect(getEmailConfig({ RESEND_API_KEY: "  " })).toEqual({
      apiKey: null,
      to: "daham@serenedge.com",
      from: "SerenEdge <sales@serenedge.com>",
    });
    expect(getEmailConfig({ RESEND_API_KEY: "re_x", CONTACT_TO_EMAIL: "a@b.co" }).to).toBe("a@b.co");
  });
  it("firstNameOf takes the first word", () => {
    expect(firstNameOf("  José  Núñez ")).toBe("José");
  });
  it("oneLine collapses newlines", () => {
    expect(oneLine("Jane\r\nSmith\n")).toBe("Jane Smith");
  });
  it("buildReplyMailto encodes unicode", () => {
    expect(buildReplyMailto("jose@x.co", "José")).toBe(
      "mailto:jose@x.co?subject=Re%3A%20Your%20SerenEdge%20enquiry&body=Hi%20Jos%C3%A9%2C%0D%0A%0D%0A",
    );
  });
  it("buildReplyMailto encodes apostrophes safely", () => {
    expect(buildReplyMailto("o@x.co", "O'Brien")).toContain("body=Hi%20O'Brien%2C");
  });
  it("formatSubmittedAt uses Sri Lanka time", () => {
    expect(formatSubmittedAt(now)).toMatch(/14:05/);
    expect(formatSubmittedAt(now)).toMatch(/Sri Lanka/);
  });
});

describe("buildTeamEmail", () => {
  it("addresses the team, replies to the client and attaches the CID logo", async () => {
    const p = await team();
    expect(p.to).toBe("daham@serenedge.com");
    expect(p.from).toBe("SerenEdge <sales@serenedge.com>");
    expect(p.replyTo).toBe("jane+site@company.com");
    expect(p.subject).toBe("New enquiry · IoT Projects · Jane Smith");
    expect(p.attachments).toEqual([{ filename: "serenedge-logo.png", content: logo, contentId: "serenedge-logo" }]);
    expect(p.html).toContain('src="cid:serenedge-logo"');
    expect(p.html).toContain("mailto:jane+site@company.com?subject=Re%3A%20Your%20SerenEdge%20enquiry");
  });

  it("team subject is a single line", async () => {
    const p = await team({ name: "Jane\nSmith" });
    expect(p.subject).toBe("New enquiry · IoT Projects · Jane Smith");
  });

  it("message is escaped and keeps line breaks", async () => {
    const p = await team();
    expect(p.html).not.toContain("<script>");
    expect(p.html).toContain("&lt;script&gt;");
    expect(p.html).toMatch(/Line one .*<br\s*\/?>\s*Line two/s);
    expect(p.text).toContain("Line two");
  });

  it("omits empty optional rows and the call button", async () => {
    const p = await team();
    expect(p.html).not.toContain("Company");
    // The footer always has the studio's tel: link, so check for the client call button text instead.
    expect(p.html).not.toContain("Call ");
  });

  it("shows phone, company and a call button when given", async () => {
    const p = await team({ phone: "+94 (71) 234-5678", company: "Green Acres" });
    expect(p.html).toContain("Green Acres");
    expect(p.html).toContain('href="tel:+94712345678"');
  });
});

describe("buildClientEmail", () => {
  it("thanks the client and routes replies to sales", async () => {
    const p = await buildClientEmail(data, { from: "SerenEdge <sales@serenedge.com>", logo });
    expect(p.to).toBe("jane+site@company.com");
    expect(p.replyTo).toBe("sales@serenedge.com");
    expect(p.subject).toBe("We've got your message · SerenEdge");
    expect(p.html).toContain("Thanks, Jane.");
    expect(p.html).toContain('src="cid:serenedge-logo"');
    expect(p.html).toContain("&lt;script&gt;");
    expect(p.attachments[0].contentId).toBe("serenedge-logo");
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm test -- src/lib/email.test.tsx`
Expected: FAIL, `Failed to resolve import "./email"`.

- [ ] **Step 7: Implement `src/lib/email.tsx`**

```tsx
import { readFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/components";
import { Resend } from "resend";
import ClientConfirmation from "@/emails/ClientConfirmation";
import { LOGO_CID } from "@/emails/components/EmailShell";
import TeamNotification from "@/emails/TeamNotification";
import type { ContactInput } from "./contact-schema";
import { SITE, topicFromSlug } from "./site";

export { LOGO_CID };
export const DEFAULT_TO = "daham@serenedge.com";
export const DEFAULT_FROM = "SerenEdge <sales@serenedge.com>";

export type EmailPayload = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  attachments: { filename: string; content: Buffer; contentId: string }[];
};

export function getEmailConfig(env: Record<string, string | undefined> = process.env) {
  return {
    apiKey: env.RESEND_API_KEY?.trim() || null,
    to: env.CONTACT_TO_EMAIL?.trim() || DEFAULT_TO,
    from: env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM,
  };
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

// The address is zod-validated (no ?, & or spaces), so it goes in unencoded.
export function buildReplyMailto(email: string, firstName: string): string {
  const subject = encodeURIComponent("Re: Your SerenEdge enquiry");
  const body = encodeURIComponent(`Hi ${firstName},\r\n\r\n`);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function formatSubmittedAt(date: Date): string {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  });
  return `${f.format(date)} (Sri Lanka)`;
}

let logoCache: Buffer | null = null;
export async function loadLogo(): Promise<Buffer> {
  logoCache ??= await readFile(path.join(process.cwd(), "src/emails/static/logo-email.png"));
  return logoCache;
}

function logoAttachment(logo: Buffer) {
  return [{ filename: "serenedge-logo.png", content: logo, contentId: LOGO_CID }];
}

export async function buildTeamEmail(
  data: ContactInput,
  opts: { from: string; to: string; logo: Buffer; now: Date },
): Promise<EmailPayload> {
  const name = oneLine(data.name);
  const firstName = firstNameOf(name);
  const topicLabel = topicFromSlug(data.topic).label;
  const element = (
    <TeamNotification
      name={name}
      firstName={firstName}
      email={data.email}
      phone={data.phone}
      company={data.company}
      topicLabel={topicLabel}
      message={data.message}
      submittedAt={formatSubmittedAt(opts.now)}
      replyHref={buildReplyMailto(data.email, firstName)}
    />
  );
  return {
    from: opts.from,
    to: opts.to,
    replyTo: data.email,
    subject: oneLine(`New enquiry · ${topicLabel} · ${name}`),
    html: await render(element),
    text: await render(element, { plainText: true }),
    attachments: logoAttachment(opts.logo),
  };
}

export async function buildClientEmail(data: ContactInput, opts: { from: string; logo: Buffer }): Promise<EmailPayload> {
  const element = (
    <ClientConfirmation
      firstName={firstNameOf(oneLine(data.name))}
      topicLabel={topicFromSlug(data.topic).label}
      company={data.company}
      message={data.message}
    />
  );
  return {
    from: opts.from,
    to: data.email,
    replyTo: SITE.email,
    subject: "We've got your message · SerenEdge",
    html: await render(element),
    text: await render(element, { plainText: true }),
    attachments: logoAttachment(opts.logo),
  };
}

export function createResend(apiKey: string): Resend {
  return new Resend(apiKey);
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm test -- src/lib/email.test.tsx`
Expected: PASS (12 tests). If the time assertion fails because the runtime lacks ICU time-zone data, check `node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"` works; Node 26 ships full ICU.

- [ ] **Step 9: Check the templates visually**

Run: `npm run email`, open `http://localhost:3001`. For both templates, check:
- the logo (served from `/static/logo-email.png` in preview) sits on white at the top left
- ink headings, accent-blue eyebrows, and a white card on a grey page
- the Reply and Call buttons render as solid rounded buttons
- the footer line is present
- the "Mobile" preview toggle looks right

Stop the server.

- [ ] **Step 10: Type-check and commit**

```bash
npx tsc --noEmit
git add scripts src/emails src/lib/email.tsx src/lib/email.test.tsx
git commit -m "feat(email): branded confirmation and notification templates with CID logo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
If `tsc` reports that `contentId` or `replyTo` is not in Resend's `CreateEmailOptions`, check the installed SDK's type (`node_modules/resend/dist/index.d.ts`). Older SDKs used `reply_to` / `content_id`. Match the installed names in `EmailPayload` and in the tests.

---

### Task 12: `sendContact` Server Action

**Files:**
- Create: `src/app/contact/actions.ts`
- Test: `src/app/contact/actions.test.ts`

**Interfaces:**
- Consumes: `validateContact`, `ContactState`, `FormValues`, `CONTACT_FIELDS` (`@/lib/contact-schema`); `getEmailConfig`, `loadLogo`, `createResend`, `buildTeamEmail`, `buildClientEmail` (`@/lib/email`); `SITE`
- Produces: `sendContact(prev: ContactState, formData: FormData): Promise<ContactState>`
  - **Success:** `{ status: "success", topic }`, where `topic` is the topic slug
  - **Invalid fields:** `{ status: "invalid", errors, values }`
  - **Failure:** `{ status: "error", message, values }`, where message = `"We couldn't send your message. Please email sales@serenedge.com directly."`

- [ ] **Step 1: Write the failing tests**

`src/app/contact/actions.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return {
    ...actual,
    loadLogo: vi.fn(async () => Buffer.from("png")),
    createResend: vi.fn(() => ({ emails: { send } })),
  };
});

import { sendContact } from "./actions";

const idle = { status: "idle" } as const;
const FAIL = "We couldn't send your message. Please email sales@serenedge.com directly.";

function form(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const fields = {
    topic: "iot",
    name: "Jane Smith",
    email: "jane@company.com",
    phone: "",
    company: "",
    message: "We need sensors on 40 greenhouses.",
    website: "",
    startedAt: String(Date.now() - 10_000),
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: "1" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendContact", () => {
  it("sends the team email then the client email and reports success", async () => {
    const r = await sendContact(idle, form());
    expect(r).toEqual({ status: "success", topic: "iot" });
    expect(send).toHaveBeenCalledTimes(2);
    const [team] = send.mock.calls[0];
    const [client] = send.mock.calls[1];
    expect(team).toMatchObject({ to: "daham@serenedge.com", replyTo: "jane@company.com" });
    expect(team.attachments[0].contentId).toBe("serenedge-logo");
    expect(client).toMatchObject({ to: "jane@company.com", replyTo: "sales@serenedge.com" });
  });

  it("invalid submission returns the submitted values", async () => {
    const r = await sendContact(idle, form({ email: "nope", message: "Hi" }));
    expect(r.status).toBe("invalid");
    if (r.status !== "invalid") return;
    expect(Object.keys(r.errors).sort()).toEqual(["email", "message"]);
    expect(r.values).toMatchObject({ name: "Jane Smith", email: "nope", message: "Hi", topic: "iot" });
    expect(send).not.toHaveBeenCalled();
  });

  it("fakes success for a filled honeypot without sending", async () => {
    const r = await sendContact(idle, form({ website: "http://spam.example" }));
    expect(r.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("fakes success for a too-fast submission without sending", async () => {
    const r = await sendContact(idle, form({ startedAt: String(Date.now() - 500) }));
    expect(r.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("allows a submission with no timestamp (JS disabled)", async () => {
    const r = await sendContact(idle, form({ startedAt: "" }));
    expect(r.status).toBe("success");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("returns the fallback error when the API key is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const r = await sendContact(idle, form());
    expect(r).toMatchObject({ status: "error", message: FAIL });
    expect(send).not.toHaveBeenCalled();
  });

  it("team send returns error object", async () => {
    send.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "bad from" } });
    const r = await sendContact(idle, form());
    expect(r).toMatchObject({ status: "error", message: FAIL, values: { name: "Jane Smith" } });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("team send throws", async () => {
    send.mockRejectedValueOnce(new Error("network down"));
    const r = await sendContact(idle, form());
    expect(r).toMatchObject({ status: "error", message: FAIL });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("still succeeds when only the client email fails", async () => {
    send
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { name: "invalid_to", message: "bounce" } });
    const r = await sendContact(idle, form());
    expect(r).toEqual({ status: "success", topic: "iot" });
    expect(console.error).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/app/contact/actions.test.ts`
Expected: FAIL, `Failed to resolve import "./actions"`.

- [ ] **Step 3: Implement `src/app/contact/actions.ts`**

```ts
"use server";

import { CONTACT_FIELDS, validateContact, type ContactState, type FormValues } from "@/lib/contact-schema";
import { buildClientEmail, buildTeamEmail, createResend, getEmailConfig, loadLogo } from "@/lib/email";
import { SITE } from "@/lib/site";

const FAIL_MESSAGE = `We couldn't send your message. Please email ${SITE.email} directly.`;
const MIN_FILL_MS = 3000;

function valuesFrom(raw: Record<string, FormDataEntryValue>): FormValues {
  const values: FormValues = {};
  for (const f of CONTACT_FIELDS) {
    const v = raw[f];
    if (typeof v === "string") values[f] = v;
  }
  return values;
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData);
  const values = valuesFrom(raw);

  // Bots: pretend it worked so they get no signal.
  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  const startedAt = Number(raw.startedAt);
  const tooFast = Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS;
  if (honeypot || tooFast) return { status: "success", topic: values.topic ?? "web" };

  const result = validateContact(raw);
  if (!result.ok) return { status: "invalid", errors: result.errors, values };

  const config = getEmailConfig();
  if (!config.apiKey) {
    console.error("[contact] RESEND_API_KEY is not set; cannot send enquiry emails.");
    return { status: "error", message: FAIL_MESSAGE, values };
  }

  const resend = createResend(config.apiKey);
  const logo = await loadLogo();

  try {
    const team = await resend.emails.send(
      await buildTeamEmail(result.data, { from: config.from, to: config.to, logo, now: new Date() }),
    );
    if (team.error) {
      console.error("[contact] team notification failed", team.error);
      return { status: "error", message: FAIL_MESSAGE, values };
    }
  } catch (err) {
    console.error("[contact] team notification threw", err);
    return { status: "error", message: FAIL_MESSAGE, values };
  }

  // We have the enquiry. A failed confirmation is logged but doesn't fail the request.
  try {
    const client = await resend.emails.send(await buildClientEmail(result.data, { from: config.from, logo }));
    if (client.error) console.error("[contact] client confirmation failed", client.error);
  } catch (err) {
    console.error("[contact] client confirmation threw", err);
  }

  return { status: "success", topic: result.data.topic };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/app/contact/actions.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Run the whole suite and type-check**

```bash
npm test && npx tsc --noEmit
```
Expected: all tests pass, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/contact/actions.ts src/app/contact/actions.test.ts
git commit -m "feat(contact): sendContact server action with spam guard and failure handling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Contact page UI

**Files:**
- Create: `src/components/contact/NextSteps.tsx`, `DirectContact.tsx`, `ContactForm.tsx`, `SentState.tsx`, `ContactPanel.tsx`
- Modify: `src/app/contact/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `sendContact` (`@/app/contact/actions`); `validateContact`, `CONTACT_FIELDS`, `ContactState`, `FieldErrors`, `FormValues`, `ContactField`; `TOPICS`, `topicFromSlug`, `TopicSlug`, `NEXT_STEPS`, `SITE`; `PageHero`, `Eyebrow`, `Button`, `buttonClasses`, `ArrowIcon`, `Reveal`; `gsap`, `MOTION`, `useGSAP`
- Produces: `<ContactPanel initialTopic: TopicSlug />`; the `/contact` route (reads `?topic=`)

Visual reference: `design-mock/book.html` and the "Booking" CSS section.

- [ ] **Step 1: Create `src/components/contact/NextSteps.tsx`**

```tsx
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { NEXT_STEPS } from "@/lib/site";

export function NextSteps() {
  return (
    <div>
      <Eyebrow inf>What happens next</Eyebrow>
      <Reveal as="ol" stagger={0.15} className="mt-3 flex flex-col">
        {NEXT_STEPS.map((step, i) => {
          const last = i === NEXT_STEPS.length - 1;
          return (
            <li key={step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={cn("mt-[5px] size-3.5 rounded-full border-2 border-accent", last && "bg-accent")} />
                {!last && <span className="w-px grow bg-line-2" />}
              </div>
              <p className={cn("text-base leading-relaxed", !last && "mb-6")}>{step}</p>
            </li>
          );
        })}
      </Reveal>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/contact/DirectContact.tsx`**

```tsx
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";

const icon = "size-[18px] shrink-0 stroke-muted";

export function DirectContact() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-7">
      <Eyebrow inf>Rather reach us directly?</Eyebrow>
      <div className="flex flex-col gap-2.5">
        <a href={`mailto:${SITE.email}`} className="flex min-w-0 items-center gap-3 text-[17px] font-medium transition-colors hover:text-accent [overflow-wrap:anywhere]">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          {SITE.email}
        </a>
        <a href={`tel:${SITE.phone.tel}`} className="flex min-w-0 items-center gap-3 text-[17px] font-medium transition-colors hover:text-accent">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}>
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          </svg>
          {`${SITE.phone.display} · Call us`}
        </a>
        <span className="flex items-center gap-3 text-[15px] text-muted">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {SITE.location}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/contact/SentState.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";

export function SentState({ recap, onReset }: { recap: string; onReset: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      ref.current?.focus();
      const mm = gsap.matchMedia();
      mm.add(
        MOTION.ok,
        () => {
          gsap.from(ref.current!.children, { autoAlpha: 0, y: 20, stagger: 0.08, duration: 0.8, ease: "expo.out" });
          gsap.fromTo(".sent-tick path", { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.7, delay: 0.2, ease: "power2.out" });
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      role="status"
      tabIndex={-1}
      className="flex min-h-[640px] flex-col justify-center gap-6 px-[clamp(24px,4.4vw,56px)] py-[clamp(32px,5vw,64px)] focus:outline-none"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-accent/12">
        <svg className="sent-tick size-[26px]" viewBox="0 0 24 24" fill="none" stroke="#0b0d12" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" />
        </svg>
      </span>
      <h2 className="font-display text-[clamp(34px,4vw,48px)] font-bold leading-[1.08] tracking-[-.015em]">Booking requested.</h2>
      <div className="rounded-md border border-line bg-surface px-6 py-5 font-mono text-sm leading-relaxed">{recap}</div>
      <p className="max-w-[520px] text-lg leading-relaxed text-muted">
        We&apos;ve emailed you a confirmation. Expect a reply within 24 hours to set up the call. Reviewed personally, never by
        a bot.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReset} className={buttonClasses("dark", "sm")}>
          Send another message
        </button>
        <Button href="/" variant="tint" size="sm">
          Back home
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/contact/ContactForm.tsx`**

```tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContact } from "@/app/contact/actions";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CONTACT_FIELDS, validateContact, type ContactField, type ContactState, type FieldErrors } from "@/lib/contact-schema";
import { TOPICS, topicFromSlug, type TopicSlug } from "@/lib/site";
import { SentState } from "./SentState";

const INITIAL: ContactState = { status: "idle" };
const fieldCls =
  "min-h-12 w-full rounded-sm border border-line bg-white px-3.5 text-[15px] transition-[border-color,box-shadow] duration-150 placeholder:text-soft focus:border-accent focus:shadow-[0_0_0_3px_rgba(91,138,197,.2)] focus:outline-none aria-[invalid=true]:border-danger";
const fsCls = "flex min-w-0 flex-col gap-5 border-0 px-5 py-6 sm:px-10 sm:py-8";

function StepHead({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs text-white">
        {n}
      </span>
      <h2 className="text-lg font-semibold leading-[1.35]">{children}</h2>
    </div>
  );
}

export function ContactForm({ initialTopic, onReset }: { initialTopic: TopicSlug; onReset: () => void }) {
  const [state, formAction, pending] = useActionState(sendContact, INITIAL);
  const [topic, setTopic] = useState<TopicSlug>(initialTopic);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const startedRef = useRef<HTMLInputElement>(null);

  // Stamp when the form became usable; the action rejects instant (bot) submissions.
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);

  if (state.status === "success") {
    return <SentState recap={`${topicFromSlug(state.topic).label} · 90-minute discovery call · Free`} onReset={onReset} />;
  }

  const serverErrors = state.status === "invalid" ? state.errors : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  // React resets the form after an action; defaultValue brings back what the person typed.
  const values = state.status === "invalid" || state.status === "error" ? state.values : {};
  const clear = (f: ContactField) => setClientErrors((e) => ({ ...e, [f]: undefined }));
  const summary = `${topicFromSlug(topic).label} · 90-minute discovery call · Free`;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const result = validateContact(Object.fromEntries(new FormData(e.currentTarget)));
    if (!result.ok) {
      e.preventDefault();
      setClientErrors(result.errors);
      const first = CONTACT_FIELDS.find((f) => result.errors[f]);
      if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setClientErrors({});
  }

  const field = (name: ContactField) => ({
    id: `ct-${name}`,
    name,
    defaultValue: values[name] ?? "",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `ct-${name}-err` : undefined,
    onInput: () => clear(name),
  });
  const err = (name: ContactField) =>
    errors[name] ? (
      <span id={`ct-${name}-err`} className="text-[13px] leading-snug text-danger">
        {errors[name]}
      </span>
    ) : null;

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="relative">
      <input ref={startedRef} type="hidden" name="startedAt" defaultValue="" />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <fieldset className={fsCls}>
        <legend className="sr-only">Topic</legend>
        <StepHead n={1}>What&apos;s it about?</StepHead>
        <input type="hidden" name="topic" value={topic} />
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const on = topic === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setTopic(t.slug)}
                className={cn(
                  "h-11 rounded-full border px-[18px] text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-95",
                  on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-accent",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {err("topic")}
      </fieldset>

      <fieldset className={cn(fsCls, "border-t border-line")}>
        <legend className="sr-only">Your details</legend>
        <StepHead n={2}>Tell us the problem</StepHead>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-name" className="text-sm font-semibold">Your name</label>
            <input {...field("name")} type="text" maxLength={120} autoComplete="name" placeholder="Jane Smith" required className={fieldCls} />
            {err("name")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-email" className="text-sm font-semibold">Email address</label>
            <input {...field("email")} type="email" maxLength={254} autoComplete="email" placeholder="jane@company.com" required className={fieldCls} />
            {err("email")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-phone" className="text-sm font-semibold">
              Phone <span className="font-normal text-muted">(optional)</span>
            </label>
            <input {...field("phone")} type="tel" maxLength={32} autoComplete="tel" placeholder="+94 70 000 0000" className={fieldCls} />
            {err("phone")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-company" className="text-sm font-semibold">
              Company <span className="font-normal text-muted">(optional)</span>
            </label>
            <input {...field("company")} type="text" maxLength={120} autoComplete="organization" placeholder="Company name" className={fieldCls} />
            {err("company")}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="ct-message" className="text-sm font-semibold">Tell us about the project</label>
          <textarea
            {...field("message")}
            maxLength={4000}
            rows={4}
            placeholder="What problem are you trying to solve? What have you tried so far?"
            required
            className={cn(fieldCls, "resize-y py-3 leading-relaxed")}
          />
          {err("message")}
        </div>
      </fieldset>

      <div className="flex flex-col items-stretch justify-between gap-6 border-t border-line bg-surface px-5 py-5 sm:flex-row sm:items-center sm:px-10 sm:py-6">
        <div className="flex min-w-0 flex-col gap-1" aria-live="polite">
          <span className="eyebrow text-[11px] text-muted">Your booking</span>
          <b className="text-[15px] font-medium">{summary}</b>
          {state.status === "error" && (
            <span role="alert" className="text-[13px] leading-snug text-danger">
              {state.message}
            </span>
          )}
          {Object.values(errors).some(Boolean) && state.status !== "error" && (
            <span role="alert" className="text-[13px] leading-snug text-danger">
              Check the highlighted fields.
            </span>
          )}
        </div>
        <button type="submit" disabled={pending} className={cn(buttonClasses("dark"), "shrink-0")}>
          {pending ? "Sending…" : "Request booking"}
          {!pending && <ArrowIcon className="size-4 shrink-0 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Create `src/components/contact/ContactPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import type { TopicSlug } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export function ContactPanel({ initialTopic }: { initialTopic: TopicSlug }) {
  // Bumping the key remounts the form, which resets the action state for "Send another message".
  const [round, setRound] = useState(0);
  return (
    <Reveal className="overflow-hidden rounded-lg border border-line bg-white shadow-2">
      <ContactForm key={round} initialTopic={initialTopic} onReset={() => setRound((r) => r + 1)} />
    </Reveal>
  );
}
```

- [ ] **Step 6: Replace `src/app/contact/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ContactPanel } from "@/components/contact/ContactPanel";
import { DirectContact } from "@/components/contact/DirectContact";
import { NextSteps } from "@/components/contact/NextSteps";
import { PageHero } from "@/components/ui/PageHero";
import { topicFromSlug } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a discovery call",
  description: "Book a free 90-minute discovery call with SerenEdge. You talk, we map. No selling, no quoting.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string | string[] }> }) {
  const { topic } = await searchParams;
  const initialTopic = topicFromSlug(typeof topic === "string" ? topic : undefined).slug;

  return (
    <>
      <PageHero
        compact
        title="Book your"
        accent="discovery call."
        lead="90 minutes. Free. You talk and we map. We don't sell yet, we don't quote yet. We figure out what problem you're actually trying to solve."
      />
      <div className="grid items-start gap-[clamp(32px,5vw,72px)] px-(--gutter) pb-(--section-y) lg:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-10">
          <NextSteps />
          <DirectContact />
        </div>
        <ContactPanel initialTopic={initialTopic} />
      </div>
    </>
  );
}
```

- [ ] **Step 7: Verify without a key (error path) and client validation**

With no `.env.local`:
```bash
npm run lint && npm run build && npm run dev
```
At `http://localhost:3000/contact`:
1. `/contact?topic=ai` preselects "AI Systems", and the summary reads "AI Systems · 90-minute discovery call · Free".
2. Submitting empty: inline errors under name, email and message; focus jumps to name; the "Check the highlighted fields." alert shows; the network tab shows **no** request.
3. Fill valid data, wait 3s, submit: the button shows "Sending…", then the red fallback message appears **and every typed value is still in the fields** (Review Focus #1). The terminal logs `RESEND_API_KEY is not set`.
4. The direct card shows `+94 70 488 8440 · Call us`, with no WhatsApp.
5. Reduced motion: no animations; the form still works.

- [ ] **Step 8: Verify with a real key (happy path)**

Create `.env.local` from `.env.example` with a real `RESEND_API_KEY` (serenedge.com verified in Resend). Restart `npm run dev`, then submit with your own address, a phone number, a company, and a two-line message that includes `<b>hi</b>`. Check:
- The panel swaps to "Booking requested." with the tick drawing and the recap line. "Send another message" gives a clean form.
- **daham@serenedge.com** gets "New enquiry · … · {name}":
  - the logo shows even with remote images blocked
  - "Reply to {first}" opens a draft to the client with subject "Re: Your SerenEdge enquiry"
  - the mail app's own Reply goes to the client
  - "Call …" is a tel link
  - `<b>hi</b>` shows as literal text, and the line breaks are kept
- **Your address** gets "We've got your message · SerenEdge" with the recap, the steps and the Call button. Replying goes to sales@serenedge.com.
- Check both in Gmail web, Gmail mobile in dark mode (the logo stays visible on its white tile), and Outlook if available.

Stop the dev server. **Do not commit `.env.local`** (`git status` must not list it).

- [ ] **Step 9: Commit**

```bash
git add src/components/contact src/app/contact/page.tsx
git commit -m "feat(contact): contact page with validated form, topic preselect and sent state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: SEO files, README and final verification

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx` (Open Graph and Twitter defaults), `README.md`

**Interfaces:**
- Consumes: `SITE`
- Produces: `/sitemap.xml` and `/robots.txt`; the finished app

- [ ] **Step 1: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/services", "/contact"].map((p) => ({
    url: `${SITE.url}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.8,
  }));
}
```

- [ ] **Step 2: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${SITE.url}/sitemap.xml` };
}
```

- [ ] **Step 3: Extend the root `metadata` in `src/app/layout.tsx`**

Add to the existing `metadata` object:
```ts
  openGraph: { type: "website", siteName: "SerenEdge", locale: "en_US" },
  twitter: { card: "summary_large_image" },
```
and add a separate `viewport` export (Next reads `themeColor` from `viewport`, not `metadata`):
```ts
import type { Viewport } from "next";
export const viewport: Viewport = { themeColor: "#ffffff" };
```

- [ ] **Step 4: Rewrite `README.md`**

````markdown
# serenedge.com

Marketing site for SerenEdge, built with Next.js (App Router), Tailwind CSS v4, GSAP + Lenis, and Resend.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your RESEND_API_KEY
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run email` | React Email preview of both templates on :3001 |
| `npm run email:logo` | Regenerates `src/emails/static/logo-email.png` from the mock logo |

## Environment

| Variable | Default | Notes |
|---|---|---|
| `RESEND_API_KEY` | none | Required to send mail. `serenedge.com` must be verified in Resend. |
| `CONTACT_TO_EMAIL` | `daham@serenedge.com` | Receives new enquiries (reply-to is the client). |
| `CONTACT_FROM_EMAIL` | `SerenEdge <sales@serenedge.com>` | Sender for both emails. |

Set the same variables in the Vercel project settings.

## Structure

- `src/app`: routes `/`, `/about`, `/services`, `/contact` (+ `contact/actions.ts` Server Action)
- `src/components`: `layout`, `ui`, `motion` (Lenis, reveals, page transition), and one folder per page
- `src/emails`: React Email templates; the logo is sent as a CID inline attachment
- `src/lib`: site content (`site.ts`), form schema, GSAP setup, email builders
- `design-mock/`: the original static HTML/CSS mock, kept as the visual reference

Design spec and implementation plan: `docs/superpowers/`.
````

- [ ] **Step 5: Full verification**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
grep -rin "whatsapp\|wa\.me" src/ README.md || echo "no whatsapp"
grep -rn "book\.html\|href=\"/book" src/ || echo "no /book links"
git status --short   # .env.local must not appear
npm start
```
Expected: every command passes; `no whatsapp`; `no /book links`. Then with `npm start`, run this checklist:
- [ ] `/`, `/about`, `/services`, `/contact` each match the mock at 1440, 900 and 390px.
- [ ] `/book` returns the Next 404 page (there is no such route).
- [ ] Smooth scrolling is on every page; the pinned section, rails, marquee and rotator all work as described in Tasks 7–10.
- [ ] Navigating through the nav shows the curtain; each new page starts at the top; there are no stuck pins.
- [ ] Reduced motion: a fully static site with every piece of content visible.
- [ ] `/sitemap.xml` lists 4 URLs; `/robots.txt` points to it; view source shows canonical and og:image per page.
- [ ] Lighthouse (Chrome DevTools, mobile) on `/` and `/contact`: Performance ≥ 90, Accessibility = 100. Fix any a11y findings before committing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: sitemap, robots, metadata defaults and README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

