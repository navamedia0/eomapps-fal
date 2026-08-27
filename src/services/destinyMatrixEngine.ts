import matrixData from '@/data/matrix_of_destiny.json';

export type ArcanaInfo = {
  id: number;
  name: string;
  keyword: string;
  general: string;
  talent: string;
  love: string;
  money: string;
  shadow: string;
};

export type DestinyMatrix = {
  birthDate: { day: number; month: number; year: number };
  dayArcana: ArcanaInfo; // Kişilik & Ruh Kartı (Doğum günü)
  monthArcana: ArcanaInfo; // Yetenekler & Sezgi Kartı (Doğum ayı)
  yearArcana: ArcanaInfo; // Maddiyat & Dünya Görevi Kartı (Doğum yılı toplamı)
  bottomArcana: ArcanaInfo; // Karmik Kuyruk (Geçmiş Yaşam Borcu)
  centerArcana: ArcanaInfo; // Ruhun Konfor ve Güç Merkezi (Kalp)
  loveArcana: ArcanaInfo; // Aşk ve Ruh Eşi Kapısı
  moneyArcana: ArcanaInfo; // Zenginlik ve Para Kanalı
  purposeArcana: ArcanaInfo; // Genel Yaşam Amacı
};

function reduceTo22(num: number): number {
  if (num <= 22) return num === 0 ? 22 : num;
  let sum = 0;
  for (const digit of String(num)) {
    sum += parseInt(digit, 10);
  }
  return sum <= 22 ? sum : reduceTo22(sum);
}

function getArcana(id: number): ArcanaInfo {
  const found = matrixData.arcana.find((a) => a.id === id);
  return (
    found || {
      id,
      name: `Arkana ${id}`,
      keyword: 'Dönüşüm ve Keşif',
      general: 'Kişisel gelişim ve dönüşüm enerjisi.',
      talent: 'İçsel bilgelik.',
      love: 'Uyumlu bağlar.',
      money: 'Emekle gelen bereket.',
      shadow: 'Aşırılıklara dikkat.',
    }
  );
}

export function calculateDestinyMatrix(day: number, month: number, year: number): DestinyMatrix {
  // 1. Dış Köşeler
  const dayVal = reduceTo22(day);
  const monthVal = reduceTo22(month);
  const yearDigitsSum = String(year)
    .split('')
    .reduce((acc, curr) => acc + parseInt(curr, 10), 0);
  const yearVal = reduceTo22(yearDigitsSum);

  // 2. Alt Köşe (Karmik Kuyruk) = Day + Month + Year
  const bottomVal = reduceTo22(dayVal + monthVal + yearVal);

  // 3. Merkez (Konfor Alanı / Ruhun Kalbi) = 4 Köşenin Toplamı
  const centerVal = reduceTo22(dayVal + monthVal + yearVal + bottomVal);

  // 4. Aşk ve Para Kanalları
  const loveVal = reduceTo22(centerVal + bottomVal);
  const moneyVal = reduceTo22(centerVal + yearVal);

  // 5. Ruhsal Yaşam Amacı = Göksel ve Yersel Hatların Sentezi
  const purposeVal = reduceTo22(dayVal + monthVal + yearVal + bottomVal + centerVal);

  return {
    birthDate: { day, month, year },
    dayArcana: getArcana(dayVal),
    monthArcana: getArcana(monthVal),
    yearArcana: getArcana(yearVal),
    bottomArcana: getArcana(bottomVal),
    centerArcana: getArcana(centerVal),
    loveArcana: getArcana(loveVal),
    moneyArcana: getArcana(moneyVal),
    purposeArcana: getArcana(purposeVal),
  };
}
