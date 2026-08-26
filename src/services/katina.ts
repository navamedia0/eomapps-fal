export type KatinaSuit = 'kupa' | 'karo' | 'sinek' | 'maca';
export type KatinaCard = { id: string; name: string; suit: KatinaSuit };

const SUITS: Array<{ slug: KatinaSuit; label: string }> = [
  { slug: 'kupa', label: 'Kupa' },
  { slug: 'karo', label: 'Karo' },
  { slug: 'sinek', label: 'Sinek' },
  { slug: 'maca', label: 'Maça' },
];

const RANKS: Array<{ slug: string; label: string }> = [
  { slug: 'asi', label: 'Ası' },
  { slug: 'ikilisi', label: 'İkilisi' },
  { slug: 'uclusu', label: 'Üçlüsü' },
  { slug: 'dortlusu', label: 'Dörtlüsü' },
  { slug: 'beslisi', label: 'Beşlisi' },
  { slug: 'altilisi', label: 'Altılısı' },
  { slug: 'yedilisi', label: 'Yedilisi' },
  { slug: 'sekizlisi', label: 'Sekizlisi' },
  { slug: 'dokuzlusu', label: 'Dokuzlusu' },
  { slug: 'onlusu', label: 'Onlusu' },
  { slug: 'valesi', label: 'Valesi' },
  { slug: 'kizi', label: 'Kızı' },
  { slug: 'papazi', label: 'Papazı' },
];

export const KATINA_DECK: KatinaCard[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ id: `${suit.slug}-${rank.slug}`, name: `${suit.label} ${rank.label}`, suit: suit.slug })),
);

export function shuffleKatinaDeck(): KatinaCard[] {
  const deck = [...KATINA_DECK];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function pickRandomKatinaCards(count: number): KatinaCard[] {
  return shuffleKatinaDeck().slice(0, count);
}
