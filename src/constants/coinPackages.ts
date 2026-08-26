export type CoinPackage = { id: string; coins: number; priceTL: string; badge: string | null };

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coins-100', coins: 100, priceTL: '₺19,99', badge: null },
  { id: 'coins-300', coins: 300, priceTL: '₺49,99', badge: 'En popüler' },
  { id: 'coins-700', coins: 700, priceTL: '₺99,99', badge: '%15 fazla' },
  { id: 'coins-1500', coins: 1500, priceTL: '₺179,99', badge: '%25 fazla' },
];
