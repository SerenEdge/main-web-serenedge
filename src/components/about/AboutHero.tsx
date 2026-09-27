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
