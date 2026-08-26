export const ZODIACS = ['Koc', 'Boga', 'Ikizler', 'Yengec', 'Aslan', 'Basak', 'Terazi', 'Akrep', 'Yay', 'Oglak', 'Kova', 'Balik'] as const;
export type Zodiac = typeof ZODIACS[number];

export function zodiacFromLongitude(longitude: number): Zodiac {
  return ZODIACS[Math.floor(((longitude % 360) + 360) % 360 / 30)];
}