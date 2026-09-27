import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";

export default function HomePage() {
  return (
    <div className="px-(--gutter)">
      <section className="flex min-h-svh items-center">
        <SplitHeading as="h1" onLoad className="type-hero">
          SerenEdge <span className="text-accent">for each node.</span>
        </SplitHeading>
      </section>
      {[1, 2, 3].map((n) => (
        <section key={n} className="flex min-h-svh flex-col justify-center gap-6">
          <SplitHeading className="type-h2">Section {n}, a long heading that wraps onto more lines</SplitHeading>
          <Reveal className="grid gap-4 sm:grid-cols-3">
            <div className="h-40 rounded-lg bg-surface" />
            <div className="h-40 rounded-lg bg-surface" />
            <div className="h-40 rounded-lg bg-surface" />
          </Reveal>
        </section>
      ))}
    </div>
  );
}
