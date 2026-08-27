import baklaData from '@/data/bakla_fali_kombinasyonlari.json';

export type BaklaOcak = {
  key: string;
  name: string;
  count: number;
  isEven: boolean;
};

export type BaklaReading = {
  ocaklar: BaklaOcak[];
  patternName: string;
  meaning: string;
  outcome: string;
};

export function cast41Beans(): BaklaReading {
  // 41 baklayı 3 ocağa (Hane, Kalp, Yol) dağıt
  const hane = Math.floor(Math.random() * 9) + 9; // 9-17
  const kalp = Math.floor(Math.random() * 9) + 9; // 9-17
  const yol = 41 - (hane + kalp);

  const ocaklar: BaklaOcak[] = [
    { key: 'hane', name: '1. Hane ve Baş Ocağı', count: hane, isEven: hane % 2 === 0 },
    { key: 'kalp', name: '2. Kalp ve Sevda Ocağı', count: kalp, isEven: kalp % 2 === 0 },
    { key: 'yol', name: '3. Yol ve Rızık Ocağı', count: yol, isEven: yol % 2 === 0 },
  ];

  const randomPattern = baklaData.patterns[Math.floor(Math.random() * baklaData.patterns.length)];

  return {
    ocaklar,
    patternName: randomPattern.name,
    meaning: randomPattern.meaning,
    outcome: randomPattern.outcome,
  };
}
