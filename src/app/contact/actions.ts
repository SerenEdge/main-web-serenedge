"use server";

import { CONTACT_FIELDS, validateContact, type ContactState, type FormValues } from "@/lib/contact-schema";
import { buildClientEmail, buildTeamEmail, createResend, getEmailConfig, loadLogo } from "@/lib/email";
import { SITE } from "@/lib/site";

const FAIL_MESSAGE = `We couldn't send your message. Please email ${SITE.email} directly.`;
const MIN_FILL_MS = 3000;

function valuesFrom(raw: Record<string, FormDataEntryValue>): FormValues {
  const values: FormValues = {};
  for (const f of CONTACT_FIELDS) {
    const v = raw[f];
    if (typeof v === "string") values[f] = v;
  }
  return values;
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData);
  const values = valuesFrom(raw);

  // Bots: pretend it worked so they get no signal.
  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  const startedAt = Number(raw.startedAt);
  const tooFast = Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS;
  if (honeypot || tooFast) return { status: "success", topic: values.topic ?? "web" };

  const result = validateContact(raw);
  if (!result.ok) return { status: "invalid", errors: result.errors, values };

  const config = getEmailConfig();
  if (!config.apiKey) {
    console.error("[contact] RESEND_API_KEY is not set; cannot send enquiry emails.");
    return { status: "error", message: FAIL_MESSAGE, values };
  }

  const resend = createResend(config.apiKey);
  const logo = await loadLogo();

  try {
    const team = await resend.emails.send(
      await buildTeamEmail(result.data, { from: config.from, to: config.to, logo, now: new Date() }),
    );
    if (team.error) {
      console.error("[contact] team notification failed", team.error);
      return { status: "error", message: FAIL_MESSAGE, values };
    }
  } catch (err) {
    console.error("[contact] team notification threw", err);
    return { status: "error", message: FAIL_MESSAGE, values };
  }

  // We have the enquiry. A failed confirmation is logged but doesn't fail the request.
  try {
    const client = await resend.emails.send(await buildClientEmail(result.data, { from: config.from, logo }));
    if (client.error) console.error("[contact] client confirmation failed", client.error);
  } catch (err) {
    console.error("[contact] client confirmation threw", err);
  }

  return { status: "success", topic: result.data.topic };
}
