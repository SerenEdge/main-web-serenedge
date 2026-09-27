import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";

const icon = "size-[18px] shrink-0 stroke-muted";

export function DirectContact() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-7">
      <Eyebrow inf>Rather reach us directly?</Eyebrow>
      <div className="flex flex-col gap-2.5">
        <a href={`mailto:${SITE.email}`} className="flex min-w-0 items-center gap-3 text-[17px] font-medium transition-colors hover:text-accent [overflow-wrap:anywhere]">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          {SITE.email}
        </a>
        <a href={`tel:${SITE.phone.tel}`} className="flex min-w-0 items-center gap-3 text-[17px] font-medium transition-colors hover:text-accent">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}>
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
          </svg>
          {`${SITE.phone.display} · Call us`}
        </a>
        <span className="flex items-center gap-3 text-[15px] text-muted">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={icon}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {SITE.location}
        </span>
      </div>
    </div>
  );
}
