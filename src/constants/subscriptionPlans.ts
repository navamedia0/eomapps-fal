export type SubscriptionPeriod = 'haftalik' | 'aylik' | 'yillik';

export type SubscriptionPlan = {
  id: string;
  name: string;
  period: SubscriptionPeriod;
  priceTL: string;
  // null = sınırsız fal hakkı. Sadece en üst katman (Premium Lüks) sınırsız —
  // diğer bütün paketler günlük bir kota taşır, ucuz paketler kısa yoldan
  // "sınırsız" hakkı almasın diye.
  dailyQuota: number | null;
  bonusCoins?: number;
  badge?: string;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'weekly-meraklı', name: 'Haftalık Meraklı Paketi', period: 'haftalik', priceTL: '₺39,99', dailyQuota: 5 },
  { id: 'weekly-luks', name: 'Haftalık Lüks Paket', period: 'haftalik', priceTL: '₺69,99', dailyQuota: 10 },

  { id: 'monthly-meraklı', name: 'Aylık Meraklı Paketi', period: 'aylik', priceTL: '₺89,99', dailyQuota: 5 },
  { id: 'monthly-luks', name: 'Aylık Lüks Paket', period: 'aylik', priceTL: '₺149,99', dailyQuota: 10, badge: 'En popüler' },
  { id: 'monthly-ultra', name: 'Aylık Ultra Paket', period: 'aylik', priceTL: '₺219,99', dailyQuota: 20 },
  { id: 'monthly-premium-luks', name: 'Aylık Premium Lüks Paket', period: 'aylik', priceTL: '₺299,99', dailyQuota: null },

  { id: 'yearly-luks', name: 'Yıllık Lüks Paket', period: 'yillik', priceTL: '₺999,99', dailyQuota: 10, bonusCoins: 200 },
  { id: 'yearly-ultra', name: 'Yıllık Ultra Paket', period: 'yillik', priceTL: '₺1.499,99', dailyQuota: 20, bonusCoins: 400, badge: '%40 tasarruf' },
  {
    id: 'yearly-premium-luks',
    name: 'Yıllık Premium Lüks Paket',
    period: 'yillik',
    priceTL: '₺1.999,99',
    dailyQuota: null,
    bonusCoins: 800,
    badge: 'En avantajlı',
  },
];

export type ThemedFalPackage = { id: string; name: string; theme: 'kahve' | 'tarot'; coins: number; priceTL: string };

export const THEMED_FAL_PACKAGES: ThemedFalPackage[] = [
  { id: 'fal-small-kahve', name: 'Küçük Fal Paketi', theme: 'kahve', coins: 90, priceTL: '₺24,99' },
  { id: 'fal-small-tarot', name: 'Küçük Tarot Paketi', theme: 'tarot', coins: 90, priceTL: '₺24,99' },
];
