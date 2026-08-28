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

// Klasik King Wen sıralaması matematiksel bir formülle üretilemez (rastgele bir
// modulo işlemiyle hesaplanamaz) — her alt/üst trigram ikilisinin kendi kadim
// sırası vardır. Bu yüzden 8x8'lik gerçek King Wen tablosunu kullanıyoruz.
// Anahtarlar trigram ikili kodları (alt-orta-üst, 1=Yang), değerler 1-64 arası
// hexagram numarasıdır.
const KING_WEN_TABLE: Record<string, Record<string, number>> = {
  '111': { '111': 1, '110': 43, '101': 14, '100': 34, '011': 9, '010': 5, '001': 26, '000': 11 }, // Qian (alt)
  '110': { '111': 10, '110': 58, '101': 38, '100': 54, '011': 61, '010': 60, '001': 41, '000': 19 }, // Dui (alt)
  '101': { '111': 13, '110': 49, '101': 30, '100': 55, '011': 37, '010': 63, '001': 22, '000': 36 }, // Li (alt)
  '100': { '111': 25, '110': 17, '101': 21, '100': 51, '011': 42, '010': 3, '001': 27, '000': 24 }, // Zhen (alt)
  '011': { '111': 44, '110': 28, '101': 50, '100': 32, '011': 57, '010': 48, '001': 18, '000': 46 }, // Xun (alt)
  '010': { '111': 6, '110': 47, '101': 64, '100': 40, '011': 59, '010': 29, '001': 4, '000': 7 }, // Kan (alt)
  '001': { '111': 33, '110': 31, '101': 56, '100': 62, '011': 53, '010': 39, '001': 52, '000': 15 }, // Gen (alt)
  '000': { '111': 12, '110': 45, '101': 35, '100': 16, '011': 20, '010': 8, '001': 23, '000': 2 }, // Kun (alt)
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

function linesToBinary(isYangFlags: boolean[]): { lower: string; upper: string } {
  const bit = (v: boolean) => (v ? '1' : '0');
  const lower = bit(isYangFlags[0]) + bit(isYangFlags[1]) + bit(isYangFlags[2]);
  const upper = bit(isYangFlags[3]) + bit(isYangFlags[4]) + bit(isYangFlags[5]);
  return { lower, upper };
}

function findHexagramByNumber(num: number) {
  return ichingData.hexagrams.find((h) => h.number === num) ?? ichingData.hexagrams[0];
}

export function getHexagramFromLines(lines: IChingLine[]): Hexagram {
  const { lower, upper } = linesToBinary(lines.map((l) => l.isYang));
  const hexNum = KING_WEN_TABLE[lower][upper];
  const found = findHexagramByNumber(hexNum);
  return { ...found, lines };
}

/**
 * Değişen çizgiler (6 veya 9 atışı) varsa, Yin/Yang'ı ters çevrilmiş "gelecek"
 * hexagramını hesaplar — I Ching geleneğinde asıl hexagram "şu anki durumu",
 * dönüşen hexagram ise "yönelinen sonucu" temsil eder.
 */
export function getTransformedHexagram(lines: IChingLine[]): Hexagram | null {
  if (!lines.some((l) => l.isChanging)) return null;
  const flipped = lines.map((l) => (l.isChanging ? !l.isYang : l.isYang));
  const { lower, upper } = linesToBinary(flipped);
  const hexNum = KING_WEN_TABLE[lower][upper];
  const found = findHexagramByNumber(hexNum);
  return { ...found, lines };
}
