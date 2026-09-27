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
