import runesData from '@/data/runes_futhark.json';

export type RuneMeaning = {
  id: string;
  symbol: string;
  name: string;
  meaning: string;
  element: string;
  upright: string;
  reversed: string;
  advice: string;
};

const RUNES: RuneMeaning[] = (runesData as { runes: RuneMeaning[] }).runes;

export function getRuneMeaning(id: string): RuneMeaning | undefined {
  return RUNES.find((rune) => rune.id === id);
}

// Elder Futhark geleneğinde bazı rünler simetriktir (baş aşağı çevrildiğinde
// aynı görünür) — bu rünler için "ters" yorum uygulanmaz, tersi yoktur.
// runes_futhark.json'daki ilgili girişler zaten bunu metinle belirtiyor;
// burada programatik kontrol için de aynı liste tutuluyor.
export const SYMMETRIC_RUNE_IDS = new Set(['gebo', 'hagalaz', 'isa', 'jera', 'eihwaz', 'sowilo', 'ingwaz', 'dagaz']);

export function isSymmetricRune(id: string): boolean {
  return SYMMETRIC_RUNE_IDS.has(id);
}

export function getAllRunes(): RuneMeaning[] {
  return RUNES;
}
