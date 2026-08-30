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

export function isSymmetricRune(id: string): boolean {
  return SYMMETRIC_RUNE_IDS.has(id);
}

export function getRuneById(id: string): Rune | undefined {
  return runesData.runes.find((r) => r.id === id);
}

// "Kendi Kartlarınla Fal Bak" (CardDeckTableScreen) ve Anasayfa'daki Rün Falı
// (RuneScreen) TEK bir açılım kataloğunu paylaşır — tek fark kartların kapalı
// usül mü (Anasayfa) yoksa bizzat seçilerek mi (kendi kartların) çekildiği.
export const RUNE_SPREAD_TYPES = ['single', 'norn', 'cross'] as const;
export type RuneSpreadType = (typeof RUNE_SPREAD_TYPES)[number];

export const RUNE_SPREAD_POSITIONS: Record<RuneSpreadType, string[]> = {
  single: ['Günün Rehber Rünü'],
  norn: ['1. Urd (Geçmiş / Kökler)', '2. Verdandi (Şimdi / Ateş)', '3. Skuld (Gelecek / Kehanet)'],
  cross: [
    '1. Merkez (Durumun Özü)',
    '2. Üst (Görünen / Yüzeydeki Etken)',
    '3. Alt (Gizli / Bilinçaltı Etken)',
    '4. Sol (Geçmişten Gelen Kök)',
    '5. Sağ (Olası Yol / Sonuç)',
  ],
};

export const RUNE_SPREAD_INFO: Record<RuneSpreadType, { label: string; desc: string }> = {
  single: { label: 'Tek Rün (Günün Rehberi)', desc: 'Gününe yön veren tek bir kadim işaret' },
  norn: { label: '3 Taşlı Norn Açılımı', desc: 'Geçmiş - Şimdi - Gelecek akışı' },
  cross: { label: '5 Taşlı Norse Haçı', desc: 'Durumun özü, gizli etkenler ve olası sonuç' },
};

export function spreadTypeForCount(count: number): RuneSpreadType {
  if (count <= 1) return 'single';
  if (count <= 3) return 'norn';
  return 'cross';
}

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
