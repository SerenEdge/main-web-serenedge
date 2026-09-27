import Image from "next/image";
import Link from "next/link";
import { InfMark } from "@/components/ui/InfMark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

type Item = { href: string; label: string };

function FooterCol({ title, items, className }: { title: string; items: Item[]; className?: string }) {
  return (
    <nav aria-label={title} className={cn("flex flex-col gap-3", className)}>
      <Eyebrow>{title}</Eyebrow>
      <ul className="flex flex-col gap-2 max-lg:gap-0">
        {items.map((it) => (
          <li key={it.label}>
            {it.href.startsWith("/") ? (
              <Link
                href={it.href}
                className="text-[14.5px] text-ink transition-colors hover:text-accent max-lg:inline-flex max-lg:min-h-11 max-lg:items-center max-lg:text-base"
              >
                {it.label}
              </Link>
            ) : (
              <a
                href={it.href}
                rel={it.href.startsWith("http") ? "noopener" : undefined}
                className="text-[14.5px] text-ink transition-colors hover:text-accent max-lg:inline-flex max-lg:min-h-11 max-lg:items-center max-lg:text-base"
              >
                {it.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-line bg-surface px-(--gutter) pt-[clamp(40px,4vw,56px)]">
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 pb-[clamp(32px,3.6vw,48px)] max-lg:gap-y-8 min-[521px]:grid-cols-3 min-[521px]:gap-8 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-full flex max-w-[320px] flex-col gap-3.5 lg:col-span-1">
          <Link href="/" aria-label="SerenEdge home" className="self-start">
            <Image src="/img/logo.png" alt="SerenEdge" width={56} height={30} className="h-[26px] w-auto" />
          </Link>
          <p className="text-sm leading-relaxed text-muted">{SITE.tagline}</p>
        </div>
        <FooterCol
          title="Pages"
          items={[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/services", label: "Services" },
            { href: "/contact", label: "Book a call" },
          ]}
        />
        <FooterCol
          title="Platform"
          items={[
            { href: SITE.platformUrl, label: "Client portal" },
            { href: SITE.platformUrl, label: "Join as a developer" },
          ]}
        />
        <FooterCol
          title="Contact"
          className="col-span-full min-[521px]:col-span-1"
          items={[
            { href: `mailto:${SITE.email}`, label: SITE.email },
            { href: `tel:${SITE.phone.tel}`, label: SITE.phone.display },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line py-5 text-[13px] text-soft">
        <span className="inline-flex items-center gap-1.5">
          © {new Date().getFullYear()} SerenEdge <InfMark className="h-[9px] w-[18px] text-accent" /> for each node.
        </span>
        <span>
          Built by{" "}
          <a className="text-muted underline underline-offset-3 transition-colors hover:text-accent" href={SITE.founderUrl} rel="noopener">
            Daham Dissanayake
          </a>
        </span>
      </div>
    </footer>
  );
}
