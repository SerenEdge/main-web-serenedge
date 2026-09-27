import { describe, expect, it } from "vitest";
import type { ContactInput } from "./contact-schema";
import {
  buildClientEmail,
  buildReplyMailto,
  buildTeamEmail,
  firstNameOf,
  formatSubmittedAt,
  getEmailConfig,
  oneLine,
} from "./email";

const logo = Buffer.from("png");
const now = new Date("2026-09-27T08:35:00Z"); // 14:05 in Colombo
const data: ContactInput = {
  topic: "iot",
  name: "Jane Smith",
  email: "jane+site@company.com",
  phone: "",
  company: "",
  message: "Line one <script>alert(1)</script>\nLine two",
};
const team = (d: Partial<ContactInput> = {}) =>
  buildTeamEmail({ ...data, ...d }, { from: "SerenEdge <sales@serenedge.com>", to: "daham@serenedge.com", logo, now });

describe("helpers", () => {
  it("getEmailConfig falls back to defaults and treats blank key as missing", () => {
    expect(getEmailConfig({ RESEND_API_KEY: "  " })).toEqual({
      apiKey: null,
      to: "daham@serenedge.com",
      from: "SerenEdge <sales@serenedge.com>",
    });
    expect(getEmailConfig({ RESEND_API_KEY: "re_x", CONTACT_TO_EMAIL: "a@b.co" }).to).toBe("a@b.co");
  });
  it("getEmailConfig strips accidental wrapping quotes from env values", () => {
    // A common deploy-dashboard mistake: pasting the .env.example line's quoted
    // value (correct for dotenv, which strips quotes) verbatim into a host that
    // stores the value literally, quotes included — which Resend then rejects
    // as an invalid `from` address.
    expect(
      getEmailConfig({
        RESEND_API_KEY: "re_x",
        CONTACT_FROM_EMAIL: '"SerenEdge <sales@serenedge.com>"',
        CONTACT_TO_EMAIL: "'daham@serenedge.com'",
      }),
    ).toEqual({
      apiKey: "re_x",
      to: "daham@serenedge.com",
      from: "SerenEdge <sales@serenedge.com>",
    });
  });
  it("firstNameOf takes the first word", () => {
    expect(firstNameOf("  José  Núñez ")).toBe("José");
  });
  it("oneLine collapses newlines", () => {
    expect(oneLine("Jane\r\nSmith\n")).toBe("Jane Smith");
  });
  it("buildReplyMailto encodes unicode", () => {
    expect(buildReplyMailto("jose@x.co", "José")).toBe(
      "mailto:jose@x.co?subject=Re%3A%20Your%20SerenEdge%20enquiry&body=Hi%20Jos%C3%A9%2C%0D%0A%0D%0A",
    );
  });
  it("buildReplyMailto encodes apostrophes safely", () => {
    expect(buildReplyMailto("o@x.co", "O'Brien")).toContain("body=Hi%20O'Brien%2C");
  });
  it("formatSubmittedAt uses Sri Lanka time", () => {
    expect(formatSubmittedAt(now)).toMatch(/14:05/);
    expect(formatSubmittedAt(now)).toMatch(/Sri Lanka/);
  });
});

describe("buildTeamEmail", () => {
  it("addresses the team, replies to the client and attaches the CID logo", async () => {
    const p = await team();
    expect(p.to).toBe("daham@serenedge.com");
    expect(p.from).toBe("SerenEdge <sales@serenedge.com>");
    expect(p.replyTo).toBe("jane+site@company.com");
    expect(p.subject).toBe("New enquiry · IoT Projects · Jane Smith");
    expect(p.attachments).toEqual([{ filename: "serenedge-logo.png", content: logo, contentId: "serenedge-logo" }]);
    expect(p.html).toContain('src="cid:serenedge-logo"');
    expect(p.html).toContain("mailto:jane+site@company.com?subject=Re%3A%20Your%20SerenEdge%20enquiry");
  });

  it("team subject is a single line", async () => {
    const p = await team({ name: "Jane\nSmith" });
    expect(p.subject).toBe("New enquiry · IoT Projects · Jane Smith");
  });

  it("message is escaped and keeps line breaks", async () => {
    const p = await team();
    expect(p.html).not.toContain("<script>");
    expect(p.html).toContain("&lt;script&gt;");
    expect(p.html).toMatch(/Line one [\s\S]*<br\s*\/?>\s*Line two/);
    expect(p.text).toContain("Line two");
  });

  it("omits empty optional rows and the call button", async () => {
    const p = await team();
    expect(p.html).not.toContain("Company");
    // The footer always has the studio's tel: link, so check for the client call button text instead.
    expect(p.html).not.toContain("Call ");
  });

  it("shows phone, company and a call button when given", async () => {
    const p = await team({ phone: "+94 (71) 234-5678", company: "Green Acres" });
    expect(p.html).toContain("Green Acres");
    expect(p.html).toContain('href="tel:+94712345678"');
  });
});

describe("buildClientEmail", () => {
  it("thanks the client and routes replies to sales", async () => {
    const p = await buildClientEmail(data, { from: "SerenEdge <sales@serenedge.com>", logo });
    expect(p.to).toBe("jane+site@company.com");
    expect(p.replyTo).toBe("sales@serenedge.com");
    expect(p.subject).toBe("We've got your message · SerenEdge");
    expect(p.html).toContain("Thanks, Jane.");
    expect(p.html).toContain('src="cid:serenedge-logo"');
    expect(p.html).toContain("&lt;script&gt;");
    expect(p.attachments[0].contentId).toBe("serenedge-logo");
  });
});
