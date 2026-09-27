import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";
import { NEXT_STEPS } from "@/lib/site";

export function NextSteps() {
  return (
    <div>
      <Eyebrow inf>What happens next</Eyebrow>
      <Reveal as="ol" stagger={0.15} className="mt-3 flex flex-col">
        {NEXT_STEPS.map((step, i) => {
          const last = i === NEXT_STEPS.length - 1;
          return (
            <li key={step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={cn("mt-[5px] size-3.5 rounded-full border-2 border-accent", last && "bg-accent")} />
                {!last && <span className="w-px grow bg-line-2" />}
              </div>
              <p className={cn("text-base leading-relaxed", !last && "mb-6")}>{step}</p>
            </li>
          );
        })}
      </Reveal>
    </div>
  );
}
