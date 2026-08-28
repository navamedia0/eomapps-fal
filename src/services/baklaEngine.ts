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

  // Remil deseni, gerçek falcılık geleneğinde ocaklara düşen bakla
  // sayılarının tek/çift durumundan OKUNUR — bağımsız bir zar atışı değildir.
  // Her üçlü tek/çift kombinasyonu (8 ihtimal) kendi özgün desenine eşlenir,
  // böylece yorum her zaman gerçek dağılımla tutarlı olur.
  const signature = ocaklar.map((o) => (o.isEven ? 'E' : 'O')).join('');
  const pattern = baklaData.patterns.find((p) => p.signature === signature) ?? baklaData.patterns[0];

  return {
    ocaklar,
    patternName: pattern.name,
    meaning: pattern.meaning,
    outcome: pattern.outcome,
  };
}
