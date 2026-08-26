import type { Zodiac } from '@/services/zodiac';

export const ZODIAC_INFO: Record<Zodiac, { name: string; icon: string; dateRange: string }> = {
  Koc: { name: 'Koç', icon: 'zodiac-aries', dateRange: '21 Mart - 19 Nisan' },
  Boga: { name: 'Boğa', icon: 'zodiac-taurus', dateRange: '20 Nisan - 20 Mayıs' },
  Ikizler: { name: 'İkizler', icon: 'zodiac-gemini', dateRange: '21 Mayıs - 20 Haziran' },
  Yengec: { name: 'Yengeç', icon: 'zodiac-cancer', dateRange: '21 Haziran - 22 Temmuz' },
  Aslan: { name: 'Aslan', icon: 'zodiac-leo', dateRange: '23 Temmuz - 22 Ağustos' },
  Basak: { name: 'Başak', icon: 'zodiac-virgo', dateRange: '23 Ağustos - 22 Eylül' },
  Terazi: { name: 'Terazi', icon: 'zodiac-libra', dateRange: '23 Eylül - 22 Ekim' },
  Akrep: { name: 'Akrep', icon: 'zodiac-scorpio', dateRange: '23 Ekim - 21 Kasım' },
  Yay: { name: 'Yay', icon: 'zodiac-sagittarius', dateRange: '22 Kasım - 21 Aralık' },
  Oglak: { name: 'Oğlak', icon: 'zodiac-capricorn', dateRange: '22 Aralık - 19 Ocak' },
  Kova: { name: 'Kova', icon: 'zodiac-aquarius', dateRange: '20 Ocak - 18 Şubat' },
  Balik: { name: 'Balık', icon: 'zodiac-pisces', dateRange: '19 Şubat - 20 Mart' },
};
