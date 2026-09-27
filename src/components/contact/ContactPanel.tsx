"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import type { TopicSlug } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export function ContactPanel({ initialTopic }: { initialTopic: TopicSlug }) {
  // Bumping the key remounts the form, which resets the action state for "Send another message".
  const [round, setRound] = useState(0);
  return (
    <Reveal className="overflow-hidden rounded-lg border border-line bg-white shadow-2">
      <ContactForm key={round} initialTopic={initialTopic} onReset={() => setRound((r) => r + 1)} />
    </Reveal>
  );
}
