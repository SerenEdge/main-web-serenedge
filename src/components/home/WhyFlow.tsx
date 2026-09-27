"use client";

import { useRef } from "react";
import { InfMark } from "@/components/ui/InfMark";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";
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
        platform.serenedge.com/client
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
    <article data-slide className={cn("why-step flex min-w-0 flex-col gap-3", SLIDE_CLASS)}>
      <div aria-hidden="true" className="vig-bg relative flex h-[200px] items-center justify-center overflow-hidden rounded-lg p-5">
        {vignette}
      </div>
      <span className="eyebrow mt-5 text-accent">{eyebrow}</span>
      <h3 className="font-display text-2xl font-bold leading-[1.23]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-muted max-lg:text-base">{children}</p>
    </article>
  );
}

function WhyLink() {
  return (
    <span aria-hidden="true" className="relative flex h-14 items-center justify-center text-accent lg:h-[200px] max-lg:hidden">
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

          // The count-up tween below only starts ~0.8s into the timeline, well
          // after other elements have faded in. Snap to 0% now so the visitor
          // never sees the SSR-baked 64% before the animation takes over.
          ring?.style.setProperty("--p", "0");
          if (label) label.textContent = "0%";

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

          return () => {
            // Restore the SSR-baked final value so a matchMedia requery (e.g.
            // resizing across the `wide` breakpoint, or toggling reduced
            // motion) doesn't strand the ring at 0% with no way to re-trigger
            // the count-up.
            ring?.style.setProperty("--p", "64");
            if (label) label.textContent = "64%";
          };
        },
        ref,
      );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} data-section aria-labelledby="why" className="px-(--gutter) pb-[clamp(40px,4vw,56px)] pt-(--section-y)">
      <div className="flex flex-col gap-12 max-lg:gap-10">
        <SectionIntro
          id="why"
          accent="Why SerenEdge."
          title="Rapid to build. Easy to follow."
          lead="Every project runs on the SerenEdge Delivery Platform: plan it once, build it with AI, and watch it ship. Projects land on time and on budget."
        />
        <CardSlider
          label="Why SerenEdge"
          count={3}
          className="why-flow grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)_56px_minmax(0,1fr)]"
        >
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
            <a className="underline underline-offset-3 transition-colors hover:text-accent" href={`${SITE.platformUrl}/client`} rel="noopener">
              platform.serenedge.com/client
            </a>{" "}
            to follow your project any time. No account setup, no technical knowledge needed.
          </Step>
        </CardSlider>
      </div>
    </section>
  );
}
