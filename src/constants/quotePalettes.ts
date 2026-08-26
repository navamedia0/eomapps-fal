import type { Ionicons } from '@expo/vector-icons';

export type QuotePalette = {
  id: string;
  colors: [string, string, string];
  icon: keyof typeof Ionicons.glyphMap;
};

// Stand-in "manzara" moods rendered as gradients until real stock photos are
// supplied — swapping these for photo backgrounds later won't touch the
// compositing logic in QuoteShareCard.
export const QUOTE_PALETTES: QuotePalette[] = [
  { id: 'gun-batimi', colors: ['#2b1055', '#c04848', '#f0965a'], icon: 'sunny' },
  { id: 'gece-goku', colors: ['#05061a', '#1b1f4b', '#4a3f8c'], icon: 'moon' },
  { id: 'okyanus', colors: ['#023047', '#127a8c', '#4fc3a1'], icon: 'water' },
  { id: 'orman', colors: ['#0f2818', '#1f5c3a', '#4f8f52'], icon: 'leaf' },
  { id: 'col', colors: ['#4a1e0e', '#a85c2a', '#e8a45c'], icon: 'sunny-outline' },
  { id: 'aurora', colors: ['#1a0e3a', '#3d1e6b', '#2fae7a'], icon: 'sparkles' },
  { id: 'dag-safagi', colors: ['#2c1440', '#6b3a6b', '#e88fa8'], icon: 'triangle-outline' },
  { id: 'lavanta', colors: ['#241a4a', '#5b3d8c', '#a875c4'], icon: 'flower-outline' },
  { id: 'sisli-sabah', colors: ['#1c2333', '#3e4a63', '#7c8ba3'], icon: 'partly-sunny-outline' },
  { id: 'altin-saat', colors: ['#3a1c0e', '#8a4a1e', '#f2b04e'], icon: 'sunny' },
  { id: 'ay-golu', colors: ['#0a0f2e', '#1e3a5c', '#5c8ab4'], icon: 'water-outline' },
  { id: 'sonbahar', colors: ['#3a1408', '#8c3a1e', '#d4822e'], icon: 'leaf-outline' },
  { id: 'kar-zirve', colors: ['#0e1a2e', '#3a5a7c', '#c8dce8'], icon: 'snow-outline' },
  { id: 'galaksi', colors: ['#0a0522', '#3a1a6b', '#a83ab4'], icon: 'planet-outline' },
  { id: 'gun-dogumu', colors: ['#1a1040', '#a8446b', '#f2c14e'], icon: 'partly-sunny' },
  { id: 'yildizli-gece', colors: ['#050818', '#141b4a', '#2e2f7c'], icon: 'star-outline' },
];
