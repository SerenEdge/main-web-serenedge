import { describe, expect, it } from "vitest";
import { KONAMI_SEQUENCE, konamiStep } from "./konami";

const type = (keys: string[]) => {
  let progress = 0;
  let complete = false;
  for (const key of keys) ({ progress, complete } = konamiStep(progress, key));
  return { progress, complete };
};

describe("konamiStep", () => {
  it("completes on the full sequence", () => {
    expect(type([...KONAMI_SEQUENCE]).complete).toBe(true);
  });

  it("accepts B and A in either case", () => {
    const upper = [...KONAMI_SEQUENCE.slice(0, 8), "B", "A"];
    expect(type(upper).complete).toBe(true);
  });

  it("resets progress on a wrong key", () => {
    expect(type(["ArrowUp", "ArrowLeft"])).toEqual({ progress: 0, complete: false });
  });

  it("restarts matching when the wrong key is itself the sequence's first key", () => {
    // ArrowUp, ArrowUp, ArrowUp: the 3rd breaks the "ArrowDown" expectation, but is
    // itself a valid start, so it isn't a dead end — the classic Konami forgiveness.
    expect(type(["ArrowUp", "ArrowUp", "ArrowUp"])).toEqual({ progress: 1, complete: false });
  });

  it("does not complete on a partial sequence", () => {
    expect(type(KONAMI_SEQUENCE.slice(0, -1) as unknown as string[]).complete).toBe(false);
  });

  it("resets after completing, ready to match again", () => {
    const keys = [...KONAMI_SEQUENCE, ...KONAMI_SEQUENCE];
    let progress = 0;
    let completions = 0;
    for (const key of keys) {
      const step = konamiStep(progress, key);
      progress = step.progress;
      if (step.complete) completions++;
    }
    expect(completions).toBe(2);
  });
});
