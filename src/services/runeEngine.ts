import runesData from '@/data/runes_futhark.json';

export type Rune = {
  id: string;
  symbol: string;
  name: string;
  meaning: string;
  element: string;
  upright: string;
  reversed: string;
  advice: string;
  isReversed?: boolean;
};

export function getAllRunes(): Rune[] {
  return runesData.runes;
}

// Geleneksel Elder Futhark'ta bu 8 rün simetriktir (ters çevrildiğinde aynı
// glif ortaya çıkar), bu yüzden hiçbir zaman "ters" anlamıyla çekilmezler.
const SYMMETRIC_RUNE_IDS = new Set([
  'gebo',
  'hagalaz',
  'isa',
  'jera',
  'eihwaz',
  'sowilo',
  'ingwaz',
  'dagaz',
]);

export function drawRandomRunes(count: number = 1): Rune[] {
  const pool = [...runesData.runes];
  const drawn: Rune[] = [];

  for (let i = 0; i < count; i++) {
    if (pool.length === 0) break;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const rune = pool.splice(randomIndex, 1)[0];
    const isReversed = !SYMMETRIC_RUNE_IDS.has(rune.id) && Math.random() < 0.3; // %30 ters gelme olasılığı
    drawn.push({
      ...rune,
      isReversed,
    });
  }

  return drawn;
}
