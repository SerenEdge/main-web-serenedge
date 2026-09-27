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
  // `elapsedMs` is computed entirely on the client (elapsed time since the
  // form mounted, written fresh at submit time) so this never compares two
  // different clocks — a visitor's clock running ahead of the server's can no
  // longer misclassify a real submission as too fast. Missing, zero or NaN
  // (JS disabled, so the hidden field was never populated) means "no timing
  // signal" and is allowed through, exactly like the no-JS case today.
  const honeypot = typeof raw.website === "string" ? raw.website.trim() : "";
  const elapsed = Number(raw.elapsedMs);
  const tooFast = Number.isFinite(elapsed) && elapsed > 0 && elapsed < MIN_FILL_MS;
  if (honeypot || tooFast) return { status: "success", topic: values.topic ?? "web" };

  const result = validateContact(raw);
  if (!result.ok) return { status: "invalid", errors: result.errors, values };

  const config = getEmailConfig();
  if (!config.apiKey) {
    console.error("[contact] RESEND_API_KEY is not set; cannot send enquiry emails.");
    return { status: "error", message: FAIL_MESSAGE, values };
  }

  const resend = createResend(config.apiKey);

  // loadLogo() reads a file from disk and can throw (missing file, a
  // file-tracing gap in some deploy environment); treat that exactly like any
  // other send failure so the visitor always gets the fallback message with
  // their input preserved, instead of an unhandled throw and Next's raw error screen.
  let logo: Awaited<ReturnType<typeof loadLogo>>;
  try {
    logo = await loadLogo();
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
