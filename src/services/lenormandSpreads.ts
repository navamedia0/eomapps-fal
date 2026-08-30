export type LenormandSpreadId = 1 | 3 | 5 | 7 | 9;

export type LenormandSpreadDef = {
  id: LenormandSpreadId | number;
  name: string;
  description: string;
  positions: string[];
  priceCoins: number;
  // Lenormand'ın kendine has yorumlama tekniği: kartlar birbirinden bağımsız
  // "kutucuklar" değil, komşu kartlarla birleşerek okunan bir CÜMLEdir. Bu
  // notlar AI'a hangi kombinasyon mantığının uygulanacağını anlatır.
  readingTechnique: string;
};

// Bireysel Lenormand Açılım Seçenekleri — hepsi otantik, tarihsel kartomansi
// pratiğinden alınmış gerçek Lenormand teknikleri (Tarot'un Kelt Haçı gibi
// düzenlerinin birebir kopyası DEĞİL, kendi geleneğine ait açılımlar).
export const LENORMAND_SPREADS: LenormandSpreadDef[] = [
  {
    id: 1,
    name: '1 Kart',
    description: 'Günün Kartı — bugünün ana enerjisine dair net ve doğrudan bir işaret.',
    positions: ['Günün Kartı'],
    priceCoins: 0,
    readingTechnique: 'Tek kart, kendi temel anlamıyla doğrudan yorumlanır.',
  },
  {
    id: 3,
    name: '3 Kart',
    description: 'Üç Kart Cümlesi — Lenormand\'ın imza tekniği: üç kart tek bir cümle gibi okunur.',
    positions: ['1. Kart (Özne)', '2. Kart (Odak / Fiil)', '3. Kart (Sonuç / Tümleç)'],
    priceCoins: 0,
    readingTechnique:
      'Bu üç kart AYRI AYRI değil, TEK BİR CÜMLE gibi okunmalı: 1. kart öznedir, 2. kart o özneyi niteleyen odak noktasıdır, 3. kart cümlenin vardığı sonuçtur. Örn: Kalp + Süvari + Balıklar = "Aşk hızla gelişip maddi/bereketli bir birlikteliğe dönüşüyor." Orta karttaki kart, diğer ikisinin arasındaki köprüdür.',
  },
  {
    id: 5,
    name: '5 Kart',
    description: 'Kutsal Haç — bir konunun kökünü, üzerindeki etkiyi ve nihai yönünü gösteren klasik Lenormand haç açılımı.',
    positions: [
      '1. Konu / Mevcut Durum (Merkez)',
      '2. Bu Durumu Ne Yönetiyor (Üst)',
      '3. Kök / Temel (Alt)',
      '4. Geçmişten Gelen Etki (Sol)',
      '5. Yakın Gelecek / Yön (Sağ)',
    ],
    priceCoins: 30,
    readingTechnique:
      'Merkezdeki kart konunun kendisidir, diğer dört kart ona komşu olarak onu değiştirir/renklendirir. Yorumda mutlaka merkez kart ile her bir komşusunun İKİLİ kombinasyonu kurulmalı (ör. Merkez + Üst = "durumu şu enerji yönetiyor"), tek tek izole edilmiş dört ayrı yorum gibi değil.',
  },
  {
    id: 7,
    name: '7 Kart',
    description: 'Haftalık Açılım — otantik Lenormand tekniği: önündeki 7 günün her biri için bir kart.',
    positions: [
      '1. Gün (Pazartesi)',
      '2. Gün (Salı)',
      '3. Gün (Çarşamba)',
      '4. Gün (Perşembe)',
      '5. Gün (Cuma)',
      '6. Gün (Cumartesi)',
      '7. Gün (Pazar)',
    ],
    priceCoins: 50,
    readingTechnique:
      'Her kart o günün baskın enerjisini gösterir — 7 ayrı günlük mesaj olarak yorumlanır, ama art arda gelen kartlar arasında da (ör. 3. ve 4. gün) haftanın genel akışını gösteren bir süreklilik/duygusal geçiş hissi kurulmalı.',
  },
  {
    id: 9,
    name: '9 Kart',
    description: 'Kutu Açılımı (3x3) — otantik Lenormand tekniği: dokuz kart üç satırlık bir kutuda, konunun geçmişini, şimdisini ve geleceğini üç boyutta (duygusal, maddi, ruhsal) katmanlaştırır.',
    positions: [
      '1. Geçmiş — Duygusal Zemin',
      '2. Geçmiş — Maddi/Pratik Zemin',
      '3. Geçmiş — Ruhsal/Zihinsel Zemin',
      '4. Şimdi — Duygusal Durum',
      '5. Şimdi — Maddi/Pratik Durum',
      '6. Şimdi — Ruhsal/Zihinsel Durum',
      '7. Gelecek — Duygusal Yön',
      '8. Gelecek — Maddi/Pratik Yön',
      '9. Gelecek — Ruhsal/Zihinsel Yön',
    ],
    priceCoins: 80,
    readingTechnique:
      'Üç satır (Geçmiş/Şimdi/Gelecek) ve üç sütun (Duygusal/Maddi/Ruhsal) olarak düşünülmeli. Her satırın kendi içindeki 3 kart bir arada okunarak o zaman diliminin bütünsel resmi çizilmeli, ardından sütunlar arası (ör. duygusal sütunun geçmişten geleceğe akışı) bir gelişim çizgisi kurulmalı.',
  },
];

export function findLenormandSpread(id: LenormandSpreadId | number | string): LenormandSpreadDef {
  const spread = LENORMAND_SPREADS.find((entry) => entry.id === id || String(entry.id) === String(id));
  if (spread) return spread;

  const posCount = typeof id === 'number' && id > 0 ? id : 3;
  return {
    id: posCount,
    name: `${posCount} Kart Açılımı`,
    description: `${posCount} kartlık Lenormand açılımı.`,
    positions: Array.from({ length: posCount }, (_, i) => `${i + 1}. Kart`),
    priceCoins: 50,
    readingTechnique: 'Kartlar sırasıyla, komşularıyla birlikte bir bütün olarak okunmalı.',
  };
}
