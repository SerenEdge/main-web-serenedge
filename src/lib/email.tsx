import { readFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/components";
import { Resend } from "resend";
import ClientConfirmation from "@/emails/ClientConfirmation";
import { LOGO_CID } from "@/emails/components/EmailShell";
import TeamNotification from "@/emails/TeamNotification";
import type { ContactInput } from "./contact-schema";
import { SITE, topicFromSlug } from "./site";

export { LOGO_CID };
export const DEFAULT_TO = "daham@serenedge.com";
export const DEFAULT_FROM = "SerenEdge <sales@serenedge.com>";

export type EmailPayload = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  attachments: { filename: string; content: Buffer; contentId: string }[];
};

export function getEmailConfig(env: Record<string, string | undefined> = process.env) {
  return {
    apiKey: env.RESEND_API_KEY?.trim() || null,
    to: env.CONTACT_TO_EMAIL?.trim() || DEFAULT_TO,
    from: env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM,
  };
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

// The address is zod-validated (no ?, & or spaces), so it goes in unencoded.
export function buildReplyMailto(email: string, firstName: string): string {
  const subject = encodeURIComponent("Re: Your SerenEdge enquiry");
  const body = encodeURIComponent(`Hi ${firstName},\r\n\r\n`);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function formatSubmittedAt(date: Date): string {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  });
  return `${f.format(date)} (Sri Lanka)`;
}

let logoCache: Buffer | null = null;
export async function loadLogo(): Promise<Buffer> {
  logoCache ??= await readFile(path.join(process.cwd(), "src/emails/static/logo-email.png"));
  return logoCache;
}

function logoAttachment(logo: Buffer) {
  return [{ filename: "serenedge-logo.png", content: logo, contentId: LOGO_CID }];
}

export async function buildTeamEmail(
  data: ContactInput,
  opts: { from: string; to: string; logo: Buffer; now: Date },
): Promise<EmailPayload> {
  const name = oneLine(data.name);
  const firstName = firstNameOf(name);
  const topicLabel = topicFromSlug(data.topic).label;
  const element = (
    <TeamNotification
      name={name}
      firstName={firstName}
      email={data.email}
      phone={data.phone}
      company={data.company}
      topicLabel={topicLabel}
      message={data.message}
      submittedAt={formatSubmittedAt(opts.now)}
      replyHref={buildReplyMailto(data.email, firstName)}
    />
  );
  return {
    from: opts.from,
    to: opts.to,
    replyTo: data.email,
    subject: oneLine(`New enquiry · ${topicLabel} · ${name}`),
    html: await render(element),
    text: await render(element, { plainText: true }),
    attachments: logoAttachment(opts.logo),
  };
}

export async function buildClientEmail(data: ContactInput, opts: { from: string; logo: Buffer }): Promise<EmailPayload> {
  const element = (
    <ClientConfirmation
      firstName={firstNameOf(oneLine(data.name))}
      topicLabel={topicFromSlug(data.topic).label}
      company={data.company}
      message={data.message}
    />
  );
  return {
    from: opts.from,
    to: data.email,
    replyTo: SITE.email,
    subject: "We've got your message · SerenEdge",
    html: await render(element),
    text: await render(element, { plainText: true }),
    attachments: logoAttachment(opts.logo),
  };
}

export function createResend(apiKey: string): Resend {
  return new Resend(apiKey);
}
