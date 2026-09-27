"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

type Props = { accent: string; title: string; cta: string };

const FACTS: { label: string; value: string; href?: string; wide?: true }[] = [
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}`, wide: true },
  { label: "Phone", value: SITE.phone.display, href: `tel:${SITE.phone.tel}` },
  { label: "Based", value: SITE.location },
  { label: "Availability", value: SITE.availability, wide: true },
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
        className="grid items-end gap-[clamp(32px,4.4vw,64px)] rounded-lg bg-ink px-[clamp(24px,4.4vw,64px)] py-[clamp(40px,5vw,72px)] text-white max-sm:px-5 lg:grid-cols-[1.2fr_1fr]"
      >
        <div className="flex flex-col gap-7">
          <h2 className="type-h2 text-white">
            <span className="text-accent max-lg:block">{accent}</span> {title}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button href="/contact" variant="white" arrow className="max-lg:w-full">
              {cta}
            </Button>
            <Button href={`mailto:${SITE.email}`} variant="outline" className="max-lg:w-full">
              Email us
            </Button>
          </div>
        </div>
        <dl className="grid gap-x-8 gap-y-7 max-lg:grid-cols-2 max-lg:gap-x-5 max-lg:gap-y-6 sm:grid-cols-2">
          {FACTS.map((f) => (
            <div
              key={f.label}
              className={cn(
                "cta-fact flex min-w-0 flex-col gap-1.5 border-t border-white/14 pt-[18px]",
                f.wide && "max-sm:col-span-2",
              )}
            >
              <dt className="eyebrow text-soft">{f.label}</dt>
              <dd className="text-[17px] text-white [overflow-wrap:anywhere] max-sm:text-base">
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
