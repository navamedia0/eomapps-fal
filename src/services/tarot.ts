export type TarotSuit = 'major' | 'kupa' | 'kilic' | 'degnek' | 'tilsim';
export type TarotOrientation = 'upright' | 'reversed';
export type TarotSpread = 3 | 7;

export type TarotCardDef = { id: string; name: string; suit: TarotSuit };
export type TarotCard = TarotCardDef & { orientation: TarotOrientation };

const MAJOR_ARCANA: TarotCardDef[] = [
  { id: 'deli', name: 'Deli', suit: 'major' },
  { id: 'buyucu', name: 'Büyücü', suit: 'major' },
  { id: 'bas-rahibe', name: 'Baş Rahibe', suit: 'major' },
  { id: 'imparatorice', name: 'İmparatoriçe', suit: 'major' },
  { id: 'imparator', name: 'İmparator', suit: 'major' },
  { id: 'aziz', name: 'Aziz', suit: 'major' },
  { id: 'asiklar', name: 'Aşıklar', suit: 'major' },
  { id: 'savas-arabasi', name: 'Savaş Arabası', suit: 'major' },
  { id: 'guc', name: 'Güç', suit: 'major' },
  { id: 'ermis', name: 'Ermiş', suit: 'major' },
  { id: 'kader-carki', name: 'Kader Çarkı', suit: 'major' },
  { id: 'adalet', name: 'Adalet', suit: 'major' },
  { id: 'asilan-adam', name: 'Asılan Adam', suit: 'major' },
  { id: 'olum', name: 'Ölüm', suit: 'major' },
  { id: 'denge', name: 'Denge', suit: 'major' },
  { id: 'seytan', name: 'Şeytan', suit: 'major' },
  { id: 'kule', name: 'Kule', suit: 'major' },
  { id: 'yildiz', name: 'Yıldız', suit: 'major' },
  { id: 'ay', name: 'Ay', suit: 'major' },
  { id: 'gunes', name: 'Güneş', suit: 'major' },
  { id: 'mahkeme', name: 'Mahkeme', suit: 'major' },
  { id: 'dunya', name: 'Dünya', suit: 'major' },
];

const SUITS: Array<{ slug: TarotSuit; label: string }> = [
  { slug: 'kupa', label: 'Kupa' },
  { slug: 'kilic', label: 'Kılıç' },
  { slug: 'degnek', label: 'Değnek' },
  { slug: 'tilsim', label: 'Tılsım' },
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
  { slug: 'prensi', label: 'Prensi' },
  { slug: 'sovalyesi', label: 'Şövalyesi' },
  { slug: 'kralicesi', label: 'Kraliçesi' },
  { slug: 'krali', label: 'Kralı' },
];

const MINOR_ARCANA: TarotCardDef[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({
    id: `${suit.slug}-${rank.slug}`,
    name: `${suit.label} ${rank.label}`,
    suit: suit.slug,
  })),
);

export const TAROT_DECK: TarotCardDef[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export function findTarotCard(id: string): TarotCardDef {
  const card = TAROT_DECK.find((entry) => entry.id === id);
  if (!card) throw new Error(`Bilinmeyen kart: ${id}`);
  return card;
}

export function randomOrientation(): TarotOrientation {
  return Math.random() > 0.8 ? 'reversed' : 'upright';
}

export function shuffleTarotDeck(): TarotCardDef[] {
  const deck = [...TAROT_DECK];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function pickRandomTarotCards(count: number): TarotCard[] {
  return shuffleTarotDeck()
    .slice(0, count)
    .map((card) => ({ ...card, orientation: randomOrientation() }));
}
