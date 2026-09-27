// The classic cheat code: ↑ ↑ ↓ ↓ ← → ← → B A. Pure state machine, no DOM — see use-konami-code.ts for the listener.
export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

export type KonamiStep = { progress: number; complete: boolean };

/**
 * Advances the match by one keypress. `key` is a KeyboardEvent.key, normalized to
 * lowercase for single-character keys so "B"/"b" both count (arrow key names are
 * already fixed strings, so they pass through untouched).
 *
 * A wrong key doesn't just reset to 0: if it happens to be the sequence's first key
 * (its second ArrowUp, say), matching restarts from there — the standard Konami
 * behaviour that survives a sloppy re-entry into the sequence.
 */
export function konamiStep(progress: number, key: string): KonamiStep {
  const got = key.length === 1 ? key.toLowerCase() : key;
  if (got === KONAMI_SEQUENCE[progress]) {
    const next = progress + 1;
    return next === KONAMI_SEQUENCE.length ? { progress: 0, complete: true } : { progress: next, complete: false };
  }
  return { progress: got === KONAMI_SEQUENCE[0] ? 1 : 0, complete: false };
}
