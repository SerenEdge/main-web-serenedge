import type { Metadata } from "next";
import { ClientPortal } from "@/components/home/ClientPortal";
import { DevJoin } from "@/components/home/DevJoin";
import { HeroOverlay } from "@/components/home/HeroOverlay";
import { HowSteps } from "@/components/home/HowSteps";
import { InfinityFinale } from "@/components/home/InfinityFinale";
import { SectionFocus } from "@/components/home/SectionFocus";
import { WhyFlow } from "@/components/home/WhyFlow";
import { CtaPanel } from "@/components/layout/CtaPanel";

export const metadata: Metadata = {
  title: { absolute: "SerenEdge · IT studio from Sri Lanka" },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroOverlay />
      <WhyFlow />
      <ClientPortal />
      <DevJoin />
      <HowSteps />
      <InfinityFinale />
      <CtaPanel accent="Get in touch." title="Tell us the problem. We'll write back in 24 hours." cta="Start a project" />
      <SectionFocus />
    </>
  );
}
