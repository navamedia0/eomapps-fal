// Reading types that go through the real, server-confirmed congestion signal
// (server/ai-proxy/src/index.js's checkCongestion) instead of a blanket
// client-side timer. See src/hooks/useReadingCooldown.ts.
export type ReadingType = 'kahve' | 'el' | 'yuz' | 'tarot3' | 'tarot5' | 'tarot7' | 'tarot10' | 'katina' | 'sesli' | 'solitaire';

export function tarotReadingType(cardCount: number): ReadingType {
  if (cardCount <= 3) return 'tarot3';
  if (cardCount <= 5) return 'tarot5';
  if (cardCount <= 7) return 'tarot7';
  return 'tarot10';
}
