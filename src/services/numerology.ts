const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, Ç: 3, D: 4, E: 5, F: 6, G: 7, Ğ: 7, H: 8, I: 9, İ: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, Ö: 6, P: 7, R: 9, S: 1, Ş: 1, T: 2,
  U: 3, Ü: 3, V: 4, Y: 7, Z: 8,
};

const reduce = (value: number): number => {
  if (value === 11 || value === 22 || value === 33 || value < 10) return value;
  return reduce(String(value).split('').reduce((sum, digit) => sum + Number(digit), 0));
};

export function calculateLifePath(date: Date): number {
  const digits = date.toISOString().slice(0, 10).replace(/-/g, '').split('').map(Number);
  return reduce(digits.reduce((sum, digit) => sum + digit, 0));
}

export function calculateNameNumber(name: string): number {
  const total = [...name.toLocaleUpperCase('tr-TR')].reduce((sum, letter) => sum + (LETTER_VALUES[letter] ?? 0), 0);
  if (!total) throw new Error('Isim en az bir harf icermeli.');
  return reduce(total);
}