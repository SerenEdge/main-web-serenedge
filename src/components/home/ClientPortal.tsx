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

          const bar = ref.current!.querySelector<HTMLElement>(".portal-bar");
          const num = ref.current!.querySelector<HTMLElement>(".portal-num");
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
