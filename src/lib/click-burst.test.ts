import { describe, expect, it } from "vitest";
import { recordClick } from "./click-burst";

describe("recordClick", () => {
  it("triggers on the 5th click within the window", () => {
    let timestamps: number[] = [];
    let triggered = false;
    for (let i = 0; i < 5; i++) {
      ({ timestamps, triggered } = recordClick(timestamps, i * 200, 1500, 5));
    }
    expect(triggered).toBe(true);
    expect(timestamps).toEqual([]); // consumed, ready for a fresh burst
  });

  it("does not trigger on only 4 clicks", () => {
    let timestamps: number[] = [];
    let triggered = false;
    for (let i = 0; i < 4; i++) {
      ({ timestamps, triggered } = recordClick(timestamps, i * 200, 1500, 5));
    }
    expect(triggered).toBe(false);
    expect(timestamps).toHaveLength(4);
  });

  it("drops clicks older than the window, so a slow 5th click never triggers", () => {
    let timestamps: number[] = [];
    ({ timestamps } = recordClick(timestamps, 0, 1500, 5));
    ({ timestamps } = recordClick(timestamps, 1400, 1500, 5));
    ({ timestamps } = recordClick(timestamps, 1450, 1500, 5));
    ({ timestamps } = recordClick(timestamps, 1480, 1500, 5));
    // arrives 1.9s after the very first click — that one has aged out, so only 4 remain in-window
    const result = recordClick(timestamps, 1900, 1500, 5);
    expect(result.triggered).toBe(false);
    expect(result.timestamps).toHaveLength(4);
  });

  it("is configurable by window and threshold", () => {
    let timestamps: number[] = [];
    let triggered = false;
    for (let i = 0; i < 3; i++) {
      ({ timestamps, triggered } = recordClick(timestamps, i * 50, 500, 3));
    }
    expect(triggered).toBe(true);
  });
});
