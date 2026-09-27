import { cn } from "@/lib/cn";

export function InfMark({ className }: { className?: string }) {
  return <i aria-hidden="true" className={cn("inf-mask inline-block shrink-0 bg-current", className)} />;
}
