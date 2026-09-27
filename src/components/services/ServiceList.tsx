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
