export const SITE = {
  name: "SerenEdge",
  url: "https://serenedge.com",
  email: "sales@serenedge.com",
  phone: { display: "+94 70 488 8440", tel: "+94704888440" },
  location: "Sri Lanka · GMT+5:30",
  availability: "Open for new projects",
  platformUrl: "https://platform.serenedge.com",
  founderUrl: "https://daham.serenedge.com",
  tagline: "Firmware, ML pipelines and web platforms, built by one team end to end.",
} as const;

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
] as const;

export const TOPIC_SLUGS = ["web", "iot", "automation", "systems", "installations", "ai", "other"] as const;
export type TopicSlug = (typeof TOPIC_SLUGS)[number];
export type Topic = { slug: TopicSlug; label: string };

export const TOPICS: readonly Topic[] = [
  { slug: "web", label: "Web Development" },
  { slug: "iot", label: "IoT Projects" },
  { slug: "automation", label: "Automation" },
  { slug: "systems", label: "System Development" },
  { slug: "installations", label: "Installations" },
  { slug: "ai", label: "AI Systems" },
  { slug: "other", label: "Something weird" },
];

export function topicFromSlug(slug?: string | null): Topic {
  return TOPICS.find((t) => t.slug === slug) ?? TOPICS[0];
}

export type Service = {
  num: string;
  topic: TopicSlug;
  name: string;
  desc: string;
  tags: string[];
  gets: string[];
  fit: string;
};

export const SERVICES: readonly Service[] = [
  {
    num: "01",
    topic: "web",
    name: "Web Development",
    desc: "Marketing sites, dashboards, customer portals and SaaS products, built for speed and maintainability.",
    tags: ["Next.js", "React", "TypeScript", "PostgreSQL"],
    gets: [
      "A fast website or web app that works on every screen",
      "An admin area your team can update without us",
      "Hosting, domain and launch handled",
    ],
    fit: "your site is slow, dated, or not bringing in enquiries.",
  },
  {
    num: "02",
    topic: "iot",
    name: "IoT Projects",
    desc: "Sensor networks, device firmware and telemetry pipelines, from ESP32 prototype to fleet deployment.",
    tags: ["ESP32", "Arduino", "Raspberry Pi", "MQTT"],
    gets: [
      "Devices with sensors wired, tested and installed",
      "A live dashboard of your readings",
      "Alerts the moment something goes wrong",
    ],
    fit: "you need eyes on equipment, crops or buildings you can't visit every day.",
  },
  {
    num: "03",
    topic: "automation",
    name: "Automation",
    desc: "Document processing, scheduling, factory PLC integration and internal RPA.",
    tags: ["Python", "n8n", "PLC"],
    gets: [
      "Repetitive tasks that run on their own",
      "Data moving between your tools without copy-paste",
      "Time back for your team every week",
    ],
    fit: "people spend hours moving data between spreadsheets and systems by hand.",
  },
  {
    num: "04",
    topic: "systems",
    name: "System Development",
    desc: "Bespoke inventory, scheduling, ERPs, point-of-sale and custom CRMs.",
    tags: ["Node.js", ".NET", "Docker"],
    gets: [
      "One system built around how you already work",
      "Stock, orders, bookings or customers in one place",
      "Reports you can actually act on",
    ],
    fit: "off-the-shelf software never quite fits your business.",
  },
  {
    num: "05",
    topic: "installations",
    name: "System Installations",
    desc: "On-site deployment, network configuration and training the team that'll use it.",
    tags: ["On-site", "Networking", "Training"],
    gets: ["Hardware and network set up at your site", "Everything tested before we leave", "Your team trained to run it"],
    fit: "you're opening a new site or replacing old equipment.",
  },
  {
    num: "06",
    topic: "ai",
    name: "AI Systems",
    desc: "LLM integrations, RAG over your data, computer vision and forecasting, from prototype to deployed service.",
    tags: ["Claude", "OpenAI", "PyTorch", "RAG / LLM"],
    gets: [
      "An assistant that answers from your own documents",
      "Automatic reading, sorting or forecasting",
      "Your data kept private and under your control",
    ],
    fit: "your team keeps searching for, reading or re-typing the same information.",
  },
];

export type ProcessStep = {
  num: string;
  tag: string;
  title: string;
  /** Shorter copy used on Home */
  homeText: string;
  /** Longer copy used on Services */
  text: string;
  facts: [string, string][];
};

export const PROCESS: readonly ProcessStep[] = [
  {
    num: "01",
    tag: "Discover",
    title: "We listen first. Hard.",
    homeText:
      "A 90-minute call where you talk and we map. We don't sell yet, we don't quote yet. We figure out what problem you're actually trying to solve.",
    text: "A 90-minute call where you talk and we map. We don't sell yet, we don't quote yet. We figure out what problem you're actually trying to solve, which is rarely the one in your email.",
    facts: [
      ["Duration", "1 week"],
      ["Output", "Problem doc + scope"],
      ["Cost", "Free"],
    ],
  },
  {
    num: "02",
    tag: "Design",
    title: "Architect, then show.",
    homeText:
      "Wireframes, system diagrams, data models, hardware BOMs. You see the shape of the thing before we write production code.",
    text: "Wireframes, system diagrams, data models, hardware BOMs, whatever the project demands. You see the shape of the thing before we write production code.",
    facts: [
      ["Duration", "1-2 weeks"],
      ["Output", "Spec + prototype"],
      ["Reviews", "Weekly"],
    ],
  },
  {
    num: "03",
    tag: "Build",
    title: "Heads down. Daily demos.",
    homeText:
      "We code, you watch progress in a shared board. Every Friday: a working build you can click, ship, or break.",
    text: "The unsexy part. We code, you watch progress in a shared board. Every Friday: a working build you can click, ship, or break. No “trust us, it's almost done.”",
    facts: [
      ["Duration", "3-12 weeks"],
      ["Cadence", "Daily commits"],
      ["Demos", "Every Friday"],
    ],
  },
  {
    num: "04",
    tag: "Ship & Stay",
    title: "Deploy. Train. Stick around.",
    homeText:
      "We install on-site if needed, train your team, and stay reachable for 90 days post-launch. You'll never get ghosted.",
    text: "We install on-site if needed, train your team, and stay reachable for 90 days post-launch. After that, optional retainers, but you'll never get ghosted.",
    facts: [
      ["Launch", "+90 day support"],
      ["Handover", "Docs + training"],
      ["Retainer", "Optional"],
    ],
  },
];

export const TOOLS: readonly { name: string; logo: string }[] = [
  { name: "Next.js", logo: "nextjs" },
  { name: "Claude", logo: "claude" },
  { name: "ESP32", logo: "espressif" },
  { name: "React", logo: "react" },
  { name: "n8n", logo: "n8n" },
  { name: "PostgreSQL", logo: "postgresql" },
  { name: "Claude Code CLI", logo: "terminal" },
  { name: "Docker", logo: "docker" },
  { name: "PyTorch", logo: "pytorch" },
  { name: "TypeScript", logo: "typescript" },
  { name: "Arduino", logo: "arduino" },
  { name: "OpenAI", logo: "openai" },
  { name: "Node.js", logo: "nodejs" },
  { name: "MQTT", logo: "mqtt" },
  { name: "Python", logo: "python" },
  { name: "Supabase", logo: "supabase" },
  { name: "Raspberry Pi", logo: "raspberrypi" },
  { name: "Tailwind CSS", logo: "tailwind" },
  { name: "Vercel", logo: "vercel" },
  { name: "GitHub", logo: "github" },
  { name: "GSAP", logo: "gsap" },
];

export const NEXT_STEPS: readonly string[] = [
  "Pick a topic and tell us the problem.",
  "Within 24 hours we email you to set up the call.",
  "Within a week you get a problem doc and a scope. Still free.",
];
