import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { Journey } from "@/components/about/Journey";
import { NameBreakdown } from "@/components/about/NameBreakdown";
import { CtaPanel } from "@/components/layout/CtaPanel";

export const metadata: Metadata = {
  title: "About",
  description:
    "SerenEdge is not a company framed into a single pathway. Founded by Daham Dissanayake in Sri Lanka, we take on the problems other shops won't touch.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <NameBreakdown />
      <Journey />
      <CtaPanel accent="Get in touch." title="Tell us the problem. We'll write back in 24 hours." cta="Start a project" />
    </>
  );
}
