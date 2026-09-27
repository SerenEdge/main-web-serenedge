"use client";

import { Reveal } from "@/components/motion/Reveal";
import { CardSlider, SLIDE_CLASS } from "@/components/ui/CardSlider";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { cn } from "@/lib/cn";
import { PROCESS } from "@/lib/site";

export function ProcessCards() {
  return (
    <section aria-labelledby="how" className="band px-(--gutter) py-(--section-y)">
      <div className="flex flex-col gap-16 max-lg:gap-10">
        <SectionIntro
          id="how"
          accent="How we work."
          title={'From "what if" to in production, in four steps.'}
          lead="Every engagement runs the same way. Predictable cadence, transparent progress, no agency-deck fluff."
        />
        <Reveal selector="[data-slide]" stagger={0.12}>
          <CardSlider as="ol" label="Engagement steps" count={PROCESS.length} className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {PROCESS.map((s, n) => {
              const dark = n === PROCESS.length - 1;
              return (
                <li
                  key={s.num}
                  data-slide
                  className={cn(
                    "flex flex-col gap-4 rounded-lg border p-8 shadow-1",
                    SLIDE_CLASS,
                    "max-lg:p-6",
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
                  <p className={cn("grow text-[15px] leading-relaxed max-lg:text-base", dark ? "text-on-dark" : "text-muted")}>{s.text}</p>
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
          </CardSlider>
        </Reveal>
      </div>
    </section>
  );
}
