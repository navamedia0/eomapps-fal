import ichingData from '@/data/iching_hexagrams.json';

export type IChingLine = {
  coins: [number, number, number]; // 2 (Yin) or 3 (Yang)
  sum: number; // 6 (Değişen Yin), 7 (Sabit Yang), 8 (Sabit Yin), 9 (Değişen Yang)
  isYang: boolean;
  isChanging: boolean;
};

export type Hexagram = {
  number: number;
  name: string;
  upper: string;
  lower: string;
  judgment: string;
  wisdom: string;
  action: string;
  lines: IChingLine[];
};

export function tossCoins(): IChingLine {
  const c1 = Math.random() > 0.5 ? 3 : 2;
  const c2 = Math.random() > 0.5 ? 3 : 2;
  const c3 = Math.random() > 0.5 ? 3 : 2;
  const sum = c1 + c2 + c3;
  return {
    coins: [c1, c2, c3],
    sum,
    isYang: sum === 7 || sum === 9,
    isChanging: sum === 6 || sum === 9,
  };
}

export function getHexagramFromLines(lines: IChingLine[]): Hexagram {
  // Eğer 64 heksagram içinde tam eşleşme varsa onu, yoksa en yakın hiyerarşik heksagramı döndürür
  const hexNum = (lines.reduce((acc, l, idx) => acc + (l.isYang ? 1 << idx : 0), 0) % ichingData.hexagrams.length) + 1;
  const found = ichingData.hexagrams.find((h) => h.number === hexNum) || ichingData.hexagrams[0];
  return {
    ...found,
    lines,
  };
}
