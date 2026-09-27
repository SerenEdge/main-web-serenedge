import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return {
    ...actual,
    loadLogo: vi.fn(async () => Buffer.from("png")),
    createResend: vi.fn(() => ({ emails: { send } })),
  };
});

import { sendContact } from "./actions";

const idle = { status: "idle" } as const;
const FAIL = "We couldn't send your message. Please email sales@serenedge.com directly.";

function form(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const fields = {
    topic: "iot",
    name: "Jane Smith",
    email: "jane@company.com",
    phone: "",
    company: "",
    message: "We need sensors on 40 greenhouses.",
    website: "",
    startedAt: String(Date.now() - 10_000),
    ...overrides,
  };
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: "1" }, error: null });
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendContact", () => {
  it("sends the team email then the client email and reports success", async () => {
    const r = await sendContact(idle, form());
    expect(r).toEqual({ status: "success", topic: "iot" });
    expect(send).toHaveBeenCalledTimes(2);
    const [team] = send.mock.calls[0];
    const [client] = send.mock.calls[1];
    expect(team).toMatchObject({ to: "daham@serenedge.com", replyTo: "jane@company.com" });
    expect(team.attachments[0].contentId).toBe("serenedge-logo");
    expect(client).toMatchObject({ to: "jane@company.com", replyTo: "sales@serenedge.com" });
  });

  it("invalid submission returns the submitted values", async () => {
    const r = await sendContact(idle, form({ email: "nope", message: "Hi" }));
    expect(r.status).toBe("invalid");
    if (r.status !== "invalid") return;
    expect(Object.keys(r.errors).sort()).toEqual(["email", "message"]);
    expect(r.values).toMatchObject({ name: "Jane Smith", email: "nope", message: "Hi", topic: "iot" });
    expect(send).not.toHaveBeenCalled();
  });

  it("fakes success for a filled honeypot without sending", async () => {
    const r = await sendContact(idle, form({ website: "http://spam.example" }));
    expect(r.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("fakes success for a too-fast submission without sending", async () => {
    const r = await sendContact(idle, form({ startedAt: String(Date.now() - 500) }));
    expect(r.status).toBe("success");
    expect(send).not.toHaveBeenCalled();
  });

  it("allows a submission with no timestamp (JS disabled)", async () => {
    const r = await sendContact(idle, form({ startedAt: "" }));
    expect(r.status).toBe("success");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("returns the fallback error when the API key is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const r = await sendContact(idle, form());
    expect(r).toMatchObject({ status: "error", message: FAIL });
    expect(send).not.toHaveBeenCalled();
  });

  it("team send returns error object", async () => {
    send.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "bad from" } });
    const r = await sendContact(idle, form());
    expect(r).toMatchObject({ status: "error", message: FAIL, values: { name: "Jane Smith" } });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("team send throws", async () => {
    send.mockRejectedValueOnce(new Error("network down"));
    const r = await sendContact(idle, form());
    expect(r).toMatchObject({ status: "error", message: FAIL });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("still succeeds when only the client email fails", async () => {
    send
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { name: "invalid_to", message: "bounce" } });
    const r = await sendContact(idle, form());
    expect(r).toEqual({ status: "success", topic: "iot" });
    expect(console.error).toHaveBeenCalled();
  });
});
