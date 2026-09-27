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
        <p className="type-lead max-lg:text-lg">{lead}</p>
        {children}
      </Reveal>
    </section>
  );
}
