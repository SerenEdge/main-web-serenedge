import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowIcon } from "./ArrowIcon";

const variants = {
  dark: "bg-ink text-white hover:bg-ink-2",
  tint: "bg-accent/12 text-ink hover:bg-accent/22",
  white: "bg-white text-ink hover:bg-surface-2",
  outline: "border border-white/24 bg-transparent text-white hover:border-white/60",
} as const;

const sizes = {
  md: "h-[52px] gap-2.5 px-6 text-base",
  sm: "h-11 gap-2 px-5 text-[15px]",
} as const;

export function buttonClasses(variant: keyof typeof variants = "dark", size: keyof typeof sizes = "md") {
  return cn(
    "group inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
  );
}

type Props = {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Button({ href, variant = "dark", size = "md", arrow = false, className, children }: Props) {
  const cls = cn(buttonClasses(variant, size), className);
  const content = (
    <>
      {children}
      {arrow && (
        <ArrowIcon className="size-4 shrink-0 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />
      )}
    </>
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} rel={href.startsWith("http") ? "noopener" : undefined}>
      {content}
    </a>
  );
}
