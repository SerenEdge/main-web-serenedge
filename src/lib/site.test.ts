import { describe, expect, it } from "vitest";
import { NAV, PROCESS, SERVICES, SITE, TOOLS, TOPICS, TOPIC_SLUGS, topicFromSlug } from "./site";

describe("topicFromSlug", () => {
  it("returns the matching topic", () => {
    expect(topicFromSlug("iot")).toEqual({ slug: "iot", label: "IoT Projects" });
  });
  it("falls back to Web Development for unknown or missing slugs", () => {
    expect(topicFromSlug("nope").slug).toBe("web");
    expect(topicFromSlug(undefined).slug).toBe("web");
    expect(topicFromSlug(null).slug).toBe("web");
  });
});

describe("site data", () => {
  it("has a topic for every slug, in order", () => {
    expect(TOPICS.map((t) => t.slug)).toEqual([...TOPIC_SLUGS]);
  });
  it("links every service to a real topic", () => {
    for (const s of SERVICES) expect(TOPIC_SLUGS).toContain(s.topic);
  });
  it("has six services and four process steps", () => {
    expect(SERVICES).toHaveLength(6);
    expect(PROCESS).toHaveLength(4);
  });
  it("never mentions WhatsApp", () => {
    const all = JSON.stringify({ SITE, NAV, SERVICES, PROCESS, TOOLS, TOPICS }).toLowerCase();
    expect(all).not.toContain("whatsapp");
    expect(all).not.toContain("wa.me");
  });
  it("uses a dialable phone number", () => {
    expect(SITE.phone.tel).toBe("+94704888440");
  });
});
