import type { Zodiac } from '@/services/zodiac';

export type ZodiacTraits = {
  element: 'Ateş' | 'Toprak' | 'Hava' | 'Su';
  quality: 'Öncü' | 'Sabit' | 'Değişken';
  polarity: 'Eril' | 'Dişil';
  rulingPlanet: string;
  keyTraits: string[];
};

export const ZODIAC_TRAITS: Record<Zodiac, ZodiacTraits> = {
  Koc: { element: 'Ateş', quality: 'Öncü', polarity: 'Eril', rulingPlanet: 'Mars', keyTraits: ['Cesur', 'Girişken', 'Sabırsız', 'Enerjik'] },
  Boga: { element: 'Toprak', quality: 'Sabit', polarity: 'Dişil', rulingPlanet: 'Venüs', keyTraits: ['Kararlı', 'Sadık', 'İnatçı', 'Duyusal'] },
  Ikizler: { element: 'Hava', quality: 'Değişken', polarity: 'Eril', rulingPlanet: 'Merkür', keyTraits: ['Meraklı', 'İletişimci', 'Değişken', 'Zeki'] },
  Yengec: { element: 'Su', quality: 'Öncü', polarity: 'Dişil', rulingPlanet: 'Ay', keyTraits: ['Duygusal', 'Koruyucu', 'Sezgisel', 'Evine bağlı'] },
  Aslan: { element: 'Ateş', quality: 'Sabit', polarity: 'Eril', rulingPlanet: 'Güneş', keyTraits: ['Karizmatik', 'Cömert', 'Gururlu', 'Yaratıcı'] },
  Basak: { element: 'Toprak', quality: 'Değişken', polarity: 'Dişil', rulingPlanet: 'Merkür', keyTraits: ['Titiz', 'Analitik', 'Yardımsever', 'Mükemmeliyetçi'] },
  Terazi: { element: 'Hava', quality: 'Öncü', polarity: 'Eril', rulingPlanet: 'Venüs', keyTraits: ['Diplomatik', 'Adil', 'Estetik', 'Kararsız'] },
  Akrep: { element: 'Su', quality: 'Sabit', polarity: 'Dişil', rulingPlanet: 'Plüton', keyTraits: ['Tutkulu', 'Gizemli', 'Kararlı', 'Yoğun'] },
  Yay: { element: 'Ateş', quality: 'Değişken', polarity: 'Eril', rulingPlanet: 'Jüpiter', keyTraits: ['Maceracı', 'İyimser', 'Özgür ruhlu', 'Felsefi'] },
  Oglak: { element: 'Toprak', quality: 'Öncü', polarity: 'Dişil', rulingPlanet: 'Satürn', keyTraits: ['Disiplinli', 'Hırslı', 'Sorumlu', 'Sabırlı'] },
  Kova: { element: 'Hava', quality: 'Sabit', polarity: 'Eril', rulingPlanet: 'Uranüs', keyTraits: ['Özgün', 'Yenilikçi', 'Bağımsız', 'İnsancıl'] },
  Balik: { element: 'Su', quality: 'Değişken', polarity: 'Dişil', rulingPlanet: 'Neptün', keyTraits: ['Hayalperest', 'Şefkatli', 'Sezgisel', 'Duygusal'] },
};
