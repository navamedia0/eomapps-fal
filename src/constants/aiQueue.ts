// Per-reading-type cooldown, in seconds. Must mirror READING_COOLDOWN_SECONDS
// in server/ai-proxy/src/index.js — the server is the real enforcement
// point (protects the shared Gemini quota from concurrent users), this copy
// only drives the client-side "queued" countdown so the wait feels
// intentional instead of surfacing as a failed request.
export type ReadingType = 'kahve' | 'el' | 'tarot3' | 'tarot5' | 'tarot7' | 'tarot10' | 'katina' | 'sesli' | 'solitaire';

export const READING_COOLDOWN_SECONDS: Record<ReadingType, number> = {
  kahve: 5 * 60,
  el: 5 * 60,
  tarot3: 1 * 60,
  tarot5: 2 * 60,
  tarot7: 2 * 60,
  tarot10: 3 * 60,
  katina: 1 * 60,
  sesli: 3 * 60,
  solitaire: 1 * 60,
};

export function tarotReadingType(cardCount: number): ReadingType {
  if (cardCount <= 3) return 'tarot3';
  if (cardCount <= 5) return 'tarot5';
  if (cardCount <= 7) return 'tarot7';
  return 'tarot10';
}
