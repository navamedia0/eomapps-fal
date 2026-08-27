import chakraData from '@/data/aura_chakra_meanings.json';

export type ChakraItem = {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  location: string;
  keywords: string;
  balanced: string;
  blocked: string;
  crystal: string;
  percentage: number; // 0 - 100
};

export type AuraAnalysis = {
  dominantChakra: ChakraItem;
  dominantAuraColor: string;
  dominantAuraName: string;
  auraDescription: string;
  chakras: ChakraItem[];
  vibrationFrequency: number; // 432Hz - 963Hz
};

export function analyzeAuraEnergy(seedNumber: number = Date.now()): AuraAnalysis {
  // Biyometrik / zaman tohumu ile 7 çakranın dinamik dengesini hesapla
  const chakras: ChakraItem[] = chakraData.chakras.map((c, i) => {
    // 55% - 98% arası gerçekçi ve pozitif dengeli yüzdeler
    const base = 60 + ((seedNumber + i * 17) % 35);
    return {
      ...c,
      percentage: Math.min(Math.max(base, 50), 98),
    };
  });

  // En yüksek yüzdeye sahip baskın çakrayı bul
  const sorted = [...chakras].sort((a, b) => b.percentage - a.percentage);
  const dominant = sorted[0];

  const frequencies = [528, 639, 741, 852, 963, 432];
  const vibration = frequencies[seedNumber % frequencies.length];

  return {
    dominantChakra: dominant,
    dominantAuraColor: dominant.colorHex,
    dominantAuraName: `${dominant.color} Işıltılı Aura`,
    auraDescription: `Auran şu anda yoğun bir ${dominant.color.toLowerCase()} frekansıyla parlıyor. Bu enerji özellikle ${dominant.keywords.toLowerCase()} alanında büyük bir ruhsal çekim ve manyetizma yaydığını gösteriyor.`,
    chakras,
    vibrationFrequency: vibration,
  };
}
