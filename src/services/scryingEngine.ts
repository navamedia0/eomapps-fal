import visionData from '@/data/kara_ayna_vizyonlari.json';

export type ScryingVision = {
  symbol: string;
  meaning: string;
  clarityLabel: string;
  clarityNote: string;
};

// Kara ayna geleneğinde pratisyen, aynanın karanlığında BELİRSİZ bir şekil ya
// da gölge algılar ve niyetiyle birlikte onu yorumlar — önceden bu adım hiç
// yoktu, ekran doğrudan kullanıcının yazdığı metni "aynada beliren sembol"
// gibi sunuyordu. Artık gerçek bir rastgele vizyon üretiliyor.
export function gazeIntoMirror(): ScryingVision {
  const vision = visionData.visions[Math.floor(Math.random() * visionData.visions.length)];
  const clarity = visionData.clarityLevels[Math.floor(Math.random() * visionData.clarityLevels.length)];
  return {
    symbol: vision.symbol,
    meaning: vision.meaning,
    clarityLabel: clarity.label,
    clarityNote: clarity.note,
  };
}
