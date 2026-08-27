import type { Zodiac } from '@/services/zodiac';
import compatibilityData from '@/data/burc_uyumu_klasik.json';

export type ClassicCompatibility = {
  score: number;
  elementDynamic: string;
  loveOverview: string;
  communication: string;
  passion: string;
  challenges: string;
  advice: string;
};

// İki burcun sırasından bağımsız olarak (Koç-Boğa veya Boğa-Koç) anahtar üretir
export function getPairKey(a: Zodiac, b: Zodiac): string {
  const ZODIAC_ORDER: Record<Zodiac, number> = {
    Koc: 1,
    Boga: 2,
    Ikizler: 3,
    Yengec: 4,
    Aslan: 5,
    Basak: 6,
    Terazi: 7,
    Akrep: 8,
    Yay: 9,
    Oglak: 10,
    Kova: 11,
    Balik: 12,
  };

  const orderA = ZODIAC_ORDER[a];
  const orderB = ZODIAC_ORDER[b];

  return orderA <= orderB ? `${a}_${b}` : `${b}_${a}`;
}

export function getClassicCompatibility(a: Zodiac, b: Zodiac): ClassicCompatibility {
  const key = getPairKey(a, b);
  const data = (compatibilityData as Record<string, ClassicCompatibility>)[key];

  if (data) return data;

  // Güvenlik yedeği (fallback)
  return {
    score: 75,
    elementDynamic: 'Kozmik etkileşim ve tamamlayıcı enerjiler.',
    loveOverview: 'Bu iki burç bir araya geldiğinde birbirlerinin görmediği yönleri aydınlatır.',
    communication: 'Açık sözlülük ve empati ile her türlü fikir ayrılığı aşılabilir.',
    passion: 'Zamanla derinleşen, güvene dayalı bir duygusal bağ potansiyeli yüksektir.',
    challenges: 'Farklı yaşam tempoları ve öncelikler zaman zaman sabır gerektirebilir.',
    advice: 'Birbirinizi değiştirmeye çalışmak yerine farklılıklarınızı zenginlik olarak görün.',
  };
}
