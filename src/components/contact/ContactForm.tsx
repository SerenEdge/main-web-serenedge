"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContact } from "@/app/contact/actions";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CONTACT_FIELDS, validateContact, type ContactField, type ContactState, type FieldErrors } from "@/lib/contact-schema";
import { TOPICS, topicFromSlug, type TopicSlug } from "@/lib/site";
import { SentState } from "./SentState";

const INITIAL: ContactState = { status: "idle" };
const fieldCls =
  "min-h-12 w-full rounded-sm border border-line bg-white px-3.5 text-[15px] transition-[border-color,box-shadow] duration-150 placeholder:text-soft focus:border-accent focus:shadow-[0_0_0_3px_rgba(91,138,197,.2)] focus:outline-none aria-[invalid=true]:border-danger";
const fsCls = "flex min-w-0 flex-col gap-5 border-0 px-5 py-6 sm:px-10 sm:py-8";

function StepHead({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs text-white">
        {n}
      </span>
      <h2 className="text-lg font-semibold leading-[1.35]">{children}</h2>
    </div>
  );
}

export function ContactForm({ initialTopic, onReset }: { initialTopic: TopicSlug; onReset: () => void }) {
  const [state, formAction, pending] = useActionState(sendContact, INITIAL);
  const [topic, setTopic] = useState<TopicSlug>(initialTopic);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const elapsedRef = useRef<HTMLInputElement>(null);
  const mountedAtRef = useRef(0);

  // Record when the form became usable; the action rejects instant (bot)
  // submissions. The elapsed time is (re)computed fresh in the submit handler
  // below rather than here, so it survives React resetting this hidden field
  // back to its empty defaultValue after a failed submit attempt.
  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  if (state.status === "success") {
    return <SentState recap={`${topicFromSlug(state.topic).label} · 90-minute discovery call · Free`} onReset={onReset} />;
  }

  const serverErrors = state.status === "invalid" ? state.errors : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  // React resets the form after an action; defaultValue brings back what the person typed.
  const values = state.status === "invalid" || state.status === "error" ? state.values : {};
  const clear = (f: ContactField) => setClientErrors((e) => ({ ...e, [f]: undefined }));
  const summary = `${topicFromSlug(topic).label} · 90-minute discovery call · Free`;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Elapsed time since mount, computed on this single (client) clock — never
    // compared against the server's clock, so clock skew can't misclassify a
    // real submission as too fast. Written fresh on every submit attempt.
    if (elapsedRef.current) {
      elapsedRef.current.value = mountedAtRef.current > 0 ? String(Date.now() - mountedAtRef.current) : "";
    }
    const result = validateContact(Object.fromEntries(new FormData(e.currentTarget)));
    if (!result.ok) {
      e.preventDefault();
      setClientErrors(result.errors);
      const first = CONTACT_FIELDS.find((f) => result.errors[f]);
      if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setClientErrors({});
  }

  const field = (name: ContactField) => ({
    id: `ct-${name}`,
    name,
    defaultValue: values[name] ?? "",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `ct-${name}-err` : undefined,
    onInput: () => clear(name),
  });
  const err = (name: ContactField) =>
    errors[name] ? (
      <span id={`ct-${name}-err`} className="text-[13px] leading-snug text-danger">
        {errors[name]}
      </span>
    ) : null;

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="relative">
      <input ref={elapsedRef} type="hidden" name="elapsedMs" defaultValue="" />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <fieldset className={fsCls}>
        <legend className="sr-only">Topic</legend>
        <StepHead n={1}>What&apos;s it about?</StepHead>
        <input type="hidden" name="topic" value={topic} />
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => {
            const on = topic === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setTopic(t.slug)}
                className={cn(
                  "h-8 shrink-0 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-95",
                  on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-accent",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {err("topic")}
      </fieldset>

      <fieldset className={cn(fsCls, "border-t border-line")}>
        <legend className="sr-only">Your details</legend>
        <StepHead n={2}>Tell us the problem</StepHead>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-name" className="text-sm font-semibold">Your name</label>
            <input {...field("name")} type="text" maxLength={120} autoComplete="name" placeholder="Your Name" required className={fieldCls} />
            {err("name")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-email" className="text-sm font-semibold">Email address</label>
            <input {...field("email")} type="email" maxLength={254} autoComplete="email" placeholder="you@company.com" required className={fieldCls} />
            {err("email")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-phone" className="text-sm font-semibold">
              Phone <span className="font-normal text-muted">(optional)</span>
            </label>
            <input {...field("phone")} type="tel" maxLength={32} autoComplete="tel" placeholder="+94 70 000 0000" className={fieldCls} />
            {err("phone")}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ct-company" className="text-sm font-semibold">
              Company <span className="font-normal text-muted">(optional)</span>
            </label>
            <input {...field("company")} type="text" maxLength={120} autoComplete="organization" placeholder="Company name" className={fieldCls} />
            {err("company")}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="ct-message" className="text-sm font-semibold">Tell us about the project</label>
          <textarea
            {...field("message")}
            maxLength={4000}
            rows={4}
            placeholder="What problem are you trying to solve? What have you tried so far?"
            required
            className={cn(fieldCls, "resize-y py-3 leading-relaxed")}
          />
          {err("message")}
        </div>
      </fieldset>

      <div className="flex flex-col items-stretch justify-between gap-6 border-t border-line bg-surface px-5 py-5 sm:flex-row sm:items-center sm:px-10 sm:py-6">
        <div className="flex min-w-0 flex-col gap-1" aria-live="polite">
          <span className="eyebrow text-[11px] text-muted">Your booking</span>
          <b className="text-[15px] font-medium">{summary}</b>
          {state.status === "error" && (
            <span role="alert" className="text-[13px] leading-snug text-danger">
              {state.message}
            </span>
          )}
          {Object.values(errors).some(Boolean) && state.status !== "error" && (
            <span role="alert" className="text-[13px] leading-snug text-danger">
              Check the highlighted fields.
            </span>
          )}
        </div>
        <button type="submit" disabled={pending} className={cn(buttonClasses("dark"), "shrink-0")}>
          {pending ? "Sending…" : "Request booking"}
          {!pending && <ArrowIcon className="size-4 shrink-0 transition-transform duration-200 ease-out-expo group-hover:translate-x-[3px]" />}
        </button>
      </div>
    </form>
  );
}
