import lenormandMeanings from '@/data/lenormand_meanings.json';

export type LenormandMeaning = {
  number: number;
  name: string;
  playingCard: string;
  meaning: string;
  love: string;
  career: string;
  advice: string;
  combination: string;
  keywords: string[];
};

const MEANINGS: Record<string, LenormandMeaning> = lenormandMeanings as Record<string, LenormandMeaning>;

export function getLenormandMeaning(cardId: string): LenormandMeaning | undefined {
  return MEANINGS[cardId];
}

export function getLenormandKeywords(cardId: string): string[] {
  return MEANINGS[cardId]?.keywords ?? [];
}

// Kartların 1-36 arası klasik numaralarına göre sıralı listesi — Grand
// Tableau gibi tam deste düzenlerinde veya kart kimliğinden numaraya
// dönüşte kullanılabilir.
export function getAllLenormandIds(): string[] {
  return Object.entries(MEANINGS)
    .sort((a, b) => a[1].number - b[1].number)
    .map(([id]) => id);
}
