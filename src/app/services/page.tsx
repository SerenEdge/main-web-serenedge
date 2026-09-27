import type { Metadata } from "next";
import { CtaPanel } from "@/components/layout/CtaPanel";
import { ProcessCards } from "@/components/services/ProcessCards";
import { ServiceList } from "@/components/services/ServiceList";
import { ToolMarquee } from "@/components/services/ToolMarquee";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Six disciplines, one continuous team: web development, IoT, automation, system development, installations and AI systems.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Six disciplines."
        accent="One continuous team."
        lead="We don't hand you off between agencies. The same people who scope your project also write the firmware, train the model and push to production."
      >
        <Button href="/contact" arrow className="max-sm:w-full">
          Book a discovery call
        </Button>
      </PageHero>
      <ServiceList />
      <ProcessCards />
      <ToolMarquee />
      <CtaPanel accent="Step 01 is free." title="Tell us the problem. We'll write back in 24 hours." cta="Book a discovery call" />
    </>
  );
}
