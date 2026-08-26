import katinaMeanings from '@/data/katina_meanings.json';

const MEANINGS: Record<string, string> = katinaMeanings;

export function getKatinaMeaning(id: string): string | undefined {
  return MEANINGS[id];
}
