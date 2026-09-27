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
