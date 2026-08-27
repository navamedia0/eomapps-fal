export type CoinPackage = {
  id: string;
  coins: number;
  priceTL: string;
  badge: string | null;
  tagline?: string;
};

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coins-100', coins: 100, priceTL: '₺19,99', badge: null, tagline: 'Başlangıç' },
  { id: 'coins-250', coins: 250, priceTL: '₺39,99', badge: null, tagline: 'Standart' },
  { id: 'coins-500', coins: 500, priceTL: '₺69,99', badge: 'En Popüler', tagline: 'Avantajlı' },
  { id: 'coins-1000', coins: 1000, priceTL: '₺129,99', badge: '%20 Ekstra', tagline: 'Tasarruflu' },
  { id: 'coins-2000', coins: 2000, priceTL: '₺229,99', badge: '%35 Tasarruf', tagline: 'Süper Fırsat' },
  { id: 'coins-3500', coins: 3500, priceTL: '₺349,99', badge: 'En Avantajlı', tagline: 'Büyük Hazine' },
];
