import { describe, expect, it } from "vitest";
import { validateContact } from "./contact-schema";

const valid = {
  topic: "iot",
  name: "Jane Smith",
  email: "jane@company.com",
  phone: "",
  company: "",
  message: "We need sensors on 40 greenhouses.",
};

describe("validateContact", () => {
  it("accepts a valid submission", () => {
    const r = validateContact(valid);
    expect(r.ok).toBe(true);
  });

  it("trims and accepts plus-addressed email", () => {
    const r = validateContact({ ...valid, name: "  Jane Smith  ", email: "  Jane+test@Company.com " });
    expect(r).toEqual({ ok: true, data: expect.objectContaining({ name: "Jane Smith", email: "Jane+test@Company.com" }) });
  });

  it("defaults optional fields when they are missing", () => {
    const { phone: _p, company: _c, ...rest } = valid;
    const r = validateContact(rest);
    expect(r).toEqual({ ok: true, data: expect.objectContaining({ phone: "", company: "" }) });
  });

  it("accepts an international phone number", () => {
    expect(validateContact({ ...valid, phone: "+94 (70) 488-8440" }).ok).toBe(true);
  });

  it.each([
    ["topic", { topic: "book" }],
    ["name", { name: "   " }],
    ["email", { email: "not-an-email" }],
    ["phone", { phone: "call me maybe" }],
    ["company", { company: "x".repeat(121) }],
    ["message", { message: "too short" }],
    ["message", { message: "x".repeat(4001) }],
  ])("rejects an invalid %s", (field, patch) => {
    const r = validateContact({ ...valid, ...patch });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[field as keyof typeof r.errors]).toEqual(expect.any(String));
  });

  it("reports one message per field", () => {
    const r = validateContact({ topic: "web", name: "", email: "", message: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name"]);
  });
});
