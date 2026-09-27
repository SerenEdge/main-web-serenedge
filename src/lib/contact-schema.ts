import { z } from "zod";
import { TOPIC_SLUGS } from "./site";

export const contactSchema = z.object({
  topic: z.enum(TOPIC_SLUGS, "Pick a topic."),
  name: z.string().trim().min(1, "Add your name.").max(120, "Keep your name under 120 characters."),
  email: z
    .string()
    .trim()
    .max(254, "That email address is too long.")
    .email("Add a valid email address."),
  phone: z
    .string()
    .trim()
    .max(32, "That phone number is too long.")
    .regex(/^[+()\-\s\d]*$/, "Use digits, spaces and + ( ) - only.")
    .default(""),
  company: z.string().trim().max(120, "Keep the company name under 120 characters.").default(""),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(4000, "Keep the message under 4000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;
export const CONTACT_FIELDS: readonly ContactField[] = ["topic", "name", "email", "phone", "company", "message"];
export type FieldErrors = Partial<Record<ContactField, string>>;
export type FormValues = Partial<Record<ContactField, string>>;

export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors; values: FormValues }
  | { status: "error"; message: string; values: FormValues }
  | { status: "success"; topic: string };

export function validateContact(
  raw: Record<string, unknown>,
): { ok: true; data: ContactInput } | { ok: false; errors: FieldErrors } {
  const result = contactSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
