import { View, Text, StyleSheet } from 'react-native';
import type { KatinaSuit } from '@/services/katina';
import { PARCHMENT_BG, PARCHMENT_TEXT, RED_ACCENT } from '@/theme/colors';

const SUIT_SYMBOL: Record<KatinaSuit, string> = { kupa: '♥', karo: '♦', sinek: '♣', maca: '♠' };
const SUIT_COLOR: Record<KatinaSuit, string> = {
  kupa: RED_ACCENT,
  karo: RED_ACCENT,
  sinek: PARCHMENT_TEXT,
  maca: PARCHMENT_TEXT,
};
export const RANK_DISPLAY: Record<string, string> = {
  asi: 'A',
  ikilisi: '2',
  uclusu: '3',
  dortlusu: '4',
  beslisi: '5',
  altilisi: '6',
  yedilisi: '7',
  sekizlisi: '8',
  dokuzlusu: '9',
  onlusu: '10',
  valesi: 'J',
  kizi: 'Q',
  papazi: 'K',
};

type Props = { suit: KatinaSuit; rankSlug: string; size?: number };

// Original vector-style playing-card face (rank + suit corners, big center
// suit symbol) — no external image asset, so we control sizing precisely.
export default function PlayingCardFace({ suit, rankSlug, size = 100 }: Props) {
  const symbol = SUIT_SYMBOL[suit];
  const color = SUIT_COLOR[suit];
  const rank = RANK_DISPLAY[rankSlug] ?? '?';
  const width = size;
  const height = Math.round(size * 1.45);

  return (
    <View style={[styles.card, { width, height, borderRadius: size * 0.09 }]}>
      <View style={styles.cornerTL}>
        <Text style={[styles.rankText, { color, fontSize: size * 0.17 }]}>{rank}</Text>
        <Text style={[styles.suitTextSmall, { color, fontSize: size * 0.14 }]}>{symbol}</Text>
      </View>
      <Text style={[styles.suitCenter, { color, fontSize: size * 0.42 }]}>{symbol}</Text>
      <View style={styles.cornerBR}>
        <Text style={[styles.rankText, { color, fontSize: size * 0.17 }]}>{rank}</Text>
        <Text style={[styles.suitTextSmall, { color, fontSize: size * 0.14 }]}>{symbol}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PARCHMENT_BG,
    borderWidth: 1,
    borderColor: 'rgba(42, 27, 84, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cornerTL: {
    position: 'absolute',
    top: 6,
    left: 7,
    alignItems: 'center',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 6,
    right: 7,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  rankText: {
    fontWeight: '800',
  },
  suitTextSmall: {
    fontWeight: '700',
    marginTop: -2,
  },
  suitCenter: {
    fontWeight: '700',
  },
});
