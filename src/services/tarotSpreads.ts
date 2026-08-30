export type SpreadId = 1 | 3 | 5 | 7 | 10;

export type SpreadDef = {
  id: SpreadId | number;
  name: string;
  description: string;
  positions: string[];
  priceCoins: number;
};

// Bireysel Tarot Falı Seçenekleri (Anasayfa & Kendim İçin Tarot)
export const TAROT_SPREADS: SpreadDef[] = [
  {
    id: 1,
    name: '1 Kart',
    description: 'Günün Mesajı & Anlık Cevap — net ve doğrudan rehberlik.',
    positions: ['Günün Ana Enerjisi'],
    priceCoins: 0,
  },
  {
    id: 3,
    name: '3 Kart',
    description: 'Geçmiş, Şimdi, Gelecek — zaman çizgisine hızlı ve net bir bakış.',
    positions: ['Geçmişin İzi', 'Şimdiki Durum & Enerji', 'Geleceğin Olasılığı'],
    priceCoins: 0,
  },
  {
    id: 5,
    name: '5 Kart',
    description: 'Beşli Haç Açılımı — durumun temelini, bilinçaltını ve olası sonucunu inceler.',
    positions: [
      '1. Mevcut Durum (Merkez)',
      '2. Geçmiş & Kök Neden (Sol)',
      '3. Gelecek Eğilimi (Sağ)',
      '4. Bilinçaltı & Zemin (Alt)',
      '5. Taç & Olası Sonuç (Üst)',
    ],
    priceCoins: 30,
  },
  {
    id: 7,
    name: '7 Kart',
    description: 'At Nalı (Horseshoe) Açılımı — kadim U-açılımı ile gizli etkiler ve tavsiyeler.',
    positions: [
      '1. Geçmişin Kökleri',
      '2. Şimdiki Durum & Enerji',
      '3. Gizli Etkiler & Beklenmedik Olaylar',
      '4. Engeller & Odak Noktası',
      '5. Dış Çevre & İnsanlar',
      '6. Tavsiye & Yol Haritası',
      '7. Nihai Sonuç & Olası Gelecek',
    ],
    priceCoins: 50,
  },
  {
    id: 10,
    name: '10 Kart',
    description: 'Kelt Haçı (Celtic Cross) — dünyanın en kadim ve kapsamlı büyük kehaneti.',
    positions: [
      '1. Mevcut Durum (Merkez)',
      '2. Engel & Zorluk (Çapraz)',
      '3. Kök Neden & Bilinçaltı (Alt)',
      '4. Yakın Geçmişin İzi (Sol)',
      '5. Olası Gelecek & Taç (Üst)',
      '6. Yaklaşan Gelecek (Sağ)',
      '7. Kişisel Tutum & Enerji',
      '8. Dış Etkiler & Çevre',
      '9. Umutlar ve Korkular',
      '10. Nihai Sonuç & Bütünleşme',
    ],
    priceCoins: 80,
  },
];

export function findSpread(id: SpreadId | number | string): SpreadDef {
  // 1. Standart listede ara
  const spread = TAROT_SPREADS.find((entry) => entry.id === id || String(entry.id) === String(id));
  if (spread) return spread;

  // 2. Çift / 20 Kart Özel Açılımı
  if (id === 20 || id === 'rel_cosmic_20' || String(id) === '20') {
    return {
      id: 20,
      name: '20 Kart (Kozmik Çift Açılımı)',
      description: 'Kozmik Çift & İkiz Alev Büyük Kehaneti — 10+10 çift aynası.',
      priceCoins: 100,
      positions: [
        '1. Kişi - Mevcut Durum & Ruh Hali',
        '1. Kişi - Karşı Tarafın Hisleri & Tavrı',
        '1. Kişi - Bilinçaltı & Kök Temel',
        '1. Kişi - Geçmişin Kalıcı İzi',
        '1. Kişi - Zihinsel Beklenti & Niyet',
        '1. Kişi - Yaklaşan Adım & Eylem',
        '1. Kişi - İçsel Korku & Çekinceler',
        '1. Kişi - Dış Etkenler & Çevre',
        '1. Kişi - Gizli Umutlar & Arzular',
        '1. Kişi - Kadersel Nihai Bütünleşme',
        '2. Kişi - Mevcut Durum & Ruh Hali',
        '2. Kişi - Karşı Tarafın Hisleri & Tavrı',
        '2. Kişi - Bilinçaltı & Kök Temel',
        '2. Kişi - Geçmişin Kalıcı İzi',
        '2. Kişi - Zihinsel Beklenti & Niyet',
        '2. Kişi - Yaklaşan Adım & Eylem',
        '2. Kişi - İçsel Korku & Çekinceler',
        '2. Kişi - Dış Etkenler & Çevre',
        '2. Kişi - Gizli Umutlar & Arzular',
        '2. Kişi - Kadersel Nihai Bütünleşme',
      ],
    };
  }

  // 3. Çift / 6 Kart Özel Açılımı
  if (id === 6 || id === 'rel_mirror_6' || String(id) === '6') {
    return {
      id: 6,
      name: '6 Kart (Karşılıklı Ayna)',
      description: 'Karşılıklı İlişki Aynası — 3+3 çift uyumu ve aşk analizi.',
      priceCoins: 50,
      positions: [
        '1. Kişi - Zihin & Düşünce',
        '1. Kişi - Kalp & Hisler',
        '1. Kişi - Beklenti & Gelecek',
        '2. Kişi - Zihin & Düşünce',
        '2. Kişi - Kalp & Hisler',
        '2. Kişi - Beklenti & Gelecek',
      ],
    };
  }

  // 4. Bilinmeyen sayı geldiğinde güvenli dinamik tanım üret (Render error'u önler)
  const posCount = typeof id === 'number' && id > 0 ? id : 3;
  return {
    id: posCount as any,
    name: `${posCount} Kart Açılımı`,
    description: `${posCount} kartlık özel kadersel yayılım.`,
    positions: Array.from({ length: posCount }, (_, i) => `${i + 1}. Kadersel Konum`),
    priceCoins: 50,
  };
}
