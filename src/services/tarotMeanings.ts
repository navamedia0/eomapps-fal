import tarotMeanings from '@/data/tarot_meanings.json';

export type TarotMeaning = { upright: string; reversed: string; story: string };

const MEANINGS: Record<string, TarotMeaning | string> = tarotMeanings;

export function getTarotMeaning(cardId: string): TarotMeaning | undefined {
  const entry = MEANINGS[cardId];
  return typeof entry === 'string' ? undefined : entry;
}
