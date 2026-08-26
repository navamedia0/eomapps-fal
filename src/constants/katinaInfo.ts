import type { KatinaSuit } from '@/services/katina';

export const KATINA_SUIT_INFO: Record<KatinaSuit, { name: string; icon: string; color: string }> = {
  kupa: { name: 'Kupa', icon: 'cards-playing-heart', color: '#D98E8E' },
  karo: { name: 'Karo', icon: 'cards-playing-diamond', color: '#D98E8E' },
  sinek: { name: 'Sinek', icon: 'cards-playing-club', color: '#E5C87A' },
  maca: { name: 'Maça', icon: 'cards-playing-spade', color: '#E5C87A' },
};
