import { View, Text, StyleSheet } from 'react-native';
import { getRuneById, isSymmetricRune } from '@/services/runeEngine';
import CornerTicks from '@/components/CornerTicks';
import { GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY } from '@/theme/colors';

type RunePick = { id: string; orientation: 'upright' | 'reversed' };

type Props = {
  runes: RunePick[];
  positions: string[];
  accentColor: string;
};

const MINI_SIZE = 46;

function MiniRune({ rune, label, accentColor }: { rune: RunePick; label: string; accentColor: string }) {
  const meaning = getRuneById(rune.id);
  const symmetric = isSymmetricRune(rune.id);
  const showReversed = rune.orientation === 'reversed' && !symmetric;
  return (
    <View style={styles.miniItem}>
      <Text style={[styles.miniLabel, { color: accentColor }]} numberOfLines={3}>
        {label}
      </Text>
      <View style={[styles.miniBadge, { borderColor: accentColor }, showReversed && styles.miniBadgeReversed]}>
        <Text style={[styles.miniBadgeSymbol, { color: accentColor }]}>{meaning?.symbol ?? '?'}</Text>
      </View>
      <Text style={styles.miniName} numberOfLines={1}>
        {meaning?.name ?? rune.id}
      </Text>
    </View>
  );
}

function RowLayout({ runes, positions, accentColor }: Props) {
  return (
    <View style={styles.rowWrap}>
      {runes.map((rune, index) => (
        <MiniRune key={`${rune.id}-${index}`} rune={rune} label={positions[index] || `${index + 1}. Rün`} accentColor={accentColor} />
      ))}
    </View>
  );
}

// Kuzey Haçı (5 Rün) — Merkez / Üst / Alt / Sol / Sağ, RUNE_SPREADS'teki
// pozisyon sırasıyla birebir eşleşir (services/runeSpreads.ts).
function NorthernCrossLayout({ runes, positions, accentColor }: Props) {
  const [center, top, bottom, left, right] = runes;
  if (!center || !top || !bottom || !left || !right) return <RowLayout runes={runes} positions={positions} accentColor={accentColor} />;
  return (
    <View style={styles.crossWrap}>
      <MiniRune rune={top} label={positions[1]} accentColor={accentColor} />
      <View style={styles.crossMidRow}>
        <MiniRune rune={left} label={positions[3]} accentColor={accentColor} />
        <MiniRune rune={center} label={positions[0]} accentColor={accentColor} />
        <MiniRune rune={right} label={positions[4]} accentColor={accentColor} />
      </View>
      <MiniRune rune={bottom} label={positions[2]} accentColor={accentColor} />
    </View>
  );
}

function SingleLayout({ runes, positions, accentColor }: Props) {
  const rune = runes[0];
  if (!rune) return null;
  return (
    <View style={styles.singleWrap}>
      <MiniRune rune={rune} label={positions[0] || "Odin'in Rünü"} accentColor={accentColor} />
    </View>
  );
}

export default function RuneSpreadLayout({ runes, positions, accentColor }: Props) {
  return (
    <View style={styles.card}>
      <CornerTicks />
      <Text style={[styles.title, { color: accentColor }]}>Açılımın Taş Dizilimi</Text>
      {runes.length === 1 ? (
        <SingleLayout runes={runes} positions={positions} accentColor={accentColor} />
      ) : runes.length === 5 ? (
        <NorthernCrossLayout runes={runes} positions={positions} accentColor={accentColor} />
      ) : (
        <RowLayout runes={runes} positions={positions} accentColor={accentColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: NIGHT_CARD,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
  },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16 },
  singleWrap: { alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  miniItem: { alignItems: 'center', width: MINI_SIZE + 30 },
  miniLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center', marginBottom: 5, minHeight: 22 },
  miniBadge: {
    width: MINI_SIZE,
    height: MINI_SIZE,
    borderRadius: 10,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  miniBadgeReversed: { transform: [{ rotate: '180deg' }] },
  miniBadgeSymbol: { fontSize: 22, fontWeight: '900' },
  miniName: { fontSize: 9, color: TEXT_PRIMARY, marginTop: 4, textAlign: 'center', fontWeight: '600' },
  crossWrap: { alignItems: 'center', gap: 8, width: '100%', paddingVertical: 4 },
  crossMidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
