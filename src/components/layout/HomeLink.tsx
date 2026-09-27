"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

type Props = { className?: string; children: React.ReactNode; onNavigate?: () => void };

/**
 * Link to the home page. Already on it, a plain Link to "/" does nothing, so scroll back
 * up to the hero instead (smoothly through Lenis when it's running, so the scroll-driven
 * scene rewinds with it). From other pages it's a normal navigation, which lands at the top.
 */
export function HomeLink({ className, children, onNavigate }: Props) {
  const pathname = usePathname();
  const lenis = useLenis();

  return (
    <Link
      href="/"
      aria-label="SerenEdge home"
      className={className}
      onClick={(e) => {
        onNavigate?.();
        if (pathname !== "/") return;
        e.preventDefault();
        // force: scroll even if Lenis is paused (e.g. the mobile menu was open).
        if (lenis) lenis.scrollTo(0, { duration: 1.4, force: true });
        else window.scrollTo({ top: 0, behavior: "auto" }); // no Lenis = reduced motion: jump
      }}
    >
      {children}
    </Link>
  );
}
