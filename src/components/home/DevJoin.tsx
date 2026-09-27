import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/site";

export function DevJoin() {
  return (
    <section aria-labelledby="devs" className="px-(--gutter) py-[clamp(8px,2vw,24px)]">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-8 rounded-lg border border-line bg-surface px-[clamp(24px,3.6vw,48px)] py-[clamp(28px,3.6vw,40px)] md:flex-row md:items-center">
          <div className="flex flex-col gap-2.5">
            <Eyebrow inf>For developers</Eyebrow>
            <h2 id="devs" className="font-display text-[28px] font-bold leading-[1.2]">
              Real projects. Clear specs. Fair rewards.
            </h2>
            <p className="max-w-[620px] text-[15px] leading-relaxed text-muted max-lg:text-base">
              Well-defined tasks, your own AI tools, transparent pay and a bonus when a project lands under budget. Sign in,
              complete a short practice task and pick up your first task.
            </p>
          </div>
          <Button href={SITE.platformUrl} arrow className="shrink-0 max-md:w-full">
            Join as a developer
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
