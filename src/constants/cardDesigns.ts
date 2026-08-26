import type { ImageSourcePropType } from 'react-native';

export type CardDesign = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  free: boolean;
  priceCoins: number;
  priceTL: string;
};

export const CARD_DESIGNS: CardDesign[] = [
  {
    id: 'default',
    name: 'Klasik Yıldız',
    image: require('../assets/tarot-backs/default-back.jpg'),
    free: true,
    priceCoins: 0,
    priceTL: '',
  },
  {
    id: 'cosmic-eye',
    name: 'Kozmik Göz',
    image: require('../assets/tarot-backs/premium-back.jpg'),
    free: false,
    priceCoins: 250,
    priceTL: '₺39,99',
  },
];
