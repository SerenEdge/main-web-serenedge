import { describe, expect, it } from "vitest";
import { clampIndex, nearestSlide } from "./card-slider-math";

const starts = [0, 300, 600, 900]; // 4 slides, 300px apart

describe("nearestSlide", () => {
  it("is 0 at the start", () => {
    expect(nearestSlide(starts, 0, 800)).toBe(0);
  });
  it("picks the closest snap position", () => {
    expect(nearestSlide(starts, 140, 800)).toBe(0);
    expect(nearestSlide(starts, 160, 800)).toBe(1);
    expect(nearestSlide(starts, 610, 800)).toBe(2);
  });
  it("is the last slide at the end of the track even if it can't reach its own start", () => {
    expect(nearestSlide(starts, 800, 800)).toBe(3);
    expect(nearestSlide(starts, 799, 800)).toBe(3);
  });
  it("is 0 when the track does not overflow (desktop grid)", () => {
    expect(nearestSlide(starts, 0, 0)).toBe(0);
  });
  it("is 0 with no slides", () => {
    expect(nearestSlide([], 50, 100)).toBe(0);
  });
});

describe("clampIndex", () => {
  it("keeps the index inside the slide range", () => {
    expect(clampIndex(-1, 4)).toBe(0);
    expect(clampIndex(2, 4)).toBe(2);
    expect(clampIndex(9, 4)).toBe(3);
  });
});
