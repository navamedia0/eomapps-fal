export type SpreadId = 3 | 5 | 7 | 10;

export type SpreadDef = {
  id: SpreadId;
  name: string;
  description: string;
  positions: string[];
  priceCoins: number;
};

export const TAROT_SPREADS: SpreadDef[] = [
  {
    id: 3,
    name: '3 Kart',
    description: 'Geçmiş, Şimdi, Gelecek — hızlı ve net bir bakış.',
    positions: ['Geçmiş', 'Şimdi', 'Gelecek'],
    priceCoins: 0,
  },
  {
    id: 5,
    name: '5 Kart',
    description: 'Haç Açılımı — durumun temelini ve olası sonucunu da katar.',
    positions: ['Geçmiş', 'Şimdi', 'Gelecek', 'Temel Sebep', 'Olası Sonuç'],
    priceCoins: 30,
  },
  {
    id: 7,
    name: '7 Kart',
    description: 'At Nalı Açılımı — çevrenin etkisini ve tavsiyeyi de gösterir.',
    positions: ['Geçmiş', 'Şimdi', 'Etkenler', 'Umutlar ve Korkular', 'Çevrenin Bakışı', 'Tavsiye', 'Sonuç'],
    priceCoins: 50,
  },
  {
    id: 10,
    name: '10 Kart',
    description: 'Kelt Haçı Açılımı — en kapsamlı, klasik tarot yayılımı.',
    priceCoins: 80,
    positions: [
      'Mevcut Durum',
      'Engel',
      'Kök Neden',
      'Yakın Geçmiş',
      'Olası Gelecek',
      'Yaklaşan Gelecek',
      'Tutumun',
      'Dış Etkiler',
      'Umutlar ve Korkular',
      'Nihai Sonuç',
    ],
  },
];

export function findSpread(id: SpreadId): SpreadDef {
  const spread = TAROT_SPREADS.find((entry) => entry.id === id);
  if (!spread) throw new Error(`Bilinmeyen açılım: ${id}`);
  return spread;
}
