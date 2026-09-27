import type { Metadata } from "next";
import { ContactPanel } from "@/components/contact/ContactPanel";
import { DirectContact } from "@/components/contact/DirectContact";
import { NextSteps } from "@/components/contact/NextSteps";
import { PageHero } from "@/components/ui/PageHero";
import { topicFromSlug } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a discovery call",
  description: "Book a free 90-minute discovery call with SerenEdge. You talk, we map. No selling, no quoting.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string | string[] }> }) {
  const { topic } = await searchParams;
  const initialTopic = topicFromSlug(typeof topic === "string" ? topic : undefined).slug;

  return (
    <>
      <PageHero
        compact
        title="Book your"
        accent="discovery call."
        lead="90 minutes. Free. You talk and we map. We don't sell yet, we don't quote yet. We figure out what problem you're actually trying to solve."
      />
      <div className="grid items-start gap-[clamp(32px,5vw,72px)] px-(--gutter) pb-(--section-y) lg:grid-cols-[5fr_7fr] max-lg:gap-12">
        <div className="flex flex-col gap-10">
          <NextSteps />
          <DirectContact />
        </div>
        <ContactPanel initialTopic={initialTopic} />
      </div>
    </>
  );
}
