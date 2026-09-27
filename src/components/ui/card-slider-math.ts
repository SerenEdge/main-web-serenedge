/**
 * Index of the slide whose snap position is closest to the track's current scroll.
 * `starts[i]` is the scrollLeft that lines slide i up with the track's leading padding.
 * At (or within 2px of) the end of the track the last slide is active, because trailing
 * slides can't always scroll all the way to their own start.
 */
export function nearestSlide(starts: readonly number[], scrollLeft: number, maxScroll: number): number {
  if (starts.length === 0 || maxScroll <= 0) return 0;
  if (scrollLeft >= maxScroll - 2) return starts.length - 1;
  let best = 0;
  for (let i = 1; i < starts.length; i++) {
    if (Math.abs(starts[i] - scrollLeft) < Math.abs(starts[best] - scrollLeft)) best = i;
  }
  return best;
}

export function clampIndex(i: number, count: number): number {
  return Math.max(0, Math.min(count - 1, i));
}
