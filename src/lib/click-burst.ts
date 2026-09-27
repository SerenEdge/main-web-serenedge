// Detects a rapid burst of clicks (the nav logo's 5-clicks-in-1.5s easter egg). Pure — no timers,
// no DOM; the caller supplies `now` (e.g. Date.now()) so this stays trivially testable.
export type ClickBurstResult = { timestamps: number[]; triggered: boolean };

export function recordClick(timestamps: number[], now: number, windowMs = 1500, threshold = 5): ClickBurstResult {
  const kept = timestamps.filter((t) => now - t < windowMs);
  kept.push(now);
  if (kept.length >= threshold) return { timestamps: [], triggered: true };
  return { timestamps: kept, triggered: false };
}
