"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/site";

export function Nav() {
  const pathname = usePathname();
  // The menu is open only for the path it was opened on, so it closes itself on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
      <header
        ref={headerRef}
        className="pointer-events-auto relative flex h-[68px] w-full max-w-[560px] items-center gap-4 rounded-lg border border-line bg-white/85 pl-5 pr-3 shadow-2 backdrop-blur-[14px] lg:w-auto lg:max-w-none lg:gap-12 lg:pl-[26px] lg:pr-4"
      >
        <Link href="/" aria-label="SerenEdge home" className="shrink-0">
          <Image src="/img/logo.png" alt="SerenEdge" width={56} height={30} priority className="h-[30px] w-auto" />
        </Link>

        <button
          type="button"
          className="ml-auto flex size-11 items-center justify-center rounded-md lg:hidden"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label="Menu"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <span
            className={cn(
              "relative block h-[1.5px] w-[18px] bg-ink transition-colors",
              "before:absolute before:-top-1.5 before:left-0 before:h-[1.5px] before:w-[18px] before:bg-ink before:transition-transform before:duration-250 before:ease-out-expo",
              "after:absolute after:left-0 after:top-1.5 after:h-[1.5px] after:w-[18px] after:bg-ink after:transition-transform after:duration-250 after:ease-out-expo",
              open && "bg-transparent before:translate-y-1.5 before:rotate-45 after:-translate-y-1.5 after:-rotate-45",
            )}
          />
        </button>

        <nav
          id="nav-links"
          aria-label="Primary"
          data-open={open}
          className={cn(
            // mobile dropdown
            "invisible absolute inset-x-0 top-[calc(100%+8px)] flex -translate-y-1.5 flex-col rounded-lg border border-line bg-white/96 p-2 opacity-0 shadow-2 backdrop-blur-[14px] transition-[opacity,transform,visibility] duration-200",
            "data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100",
            // desktop inline
            "lg:visible lg:static lg:translate-y-0 lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0 lg:opacity-100 lg:shadow-none lg:backdrop-blur-none",
          )}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="rounded-md px-4 py-3.5 text-base font-medium text-muted transition-colors hover:bg-surface hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink lg:p-0 lg:text-[15px] lg:hover:bg-transparent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            aria-current={pathname === "/contact" ? "page" : undefined}
            className="mt-1 flex justify-center rounded-md bg-ink px-4 py-3.5 font-medium text-white hover:bg-ink-2 lg:hidden"
          >
            Let&apos;s talk
          </Link>
        </nav>

        {/* Wrapper owns display so it doesn't fight the button's own inline-flex. */}
        <div className="hidden lg:block">
          <Button href="/contact" size="sm" arrow>
            Let&apos;s talk
          </Button>
        </div>
      </header>
    </div>
  );
}
