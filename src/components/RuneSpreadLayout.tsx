import { View, Text, StyleSheet, Pressable } from 'react-native';
import { getRuneById, isSymmetricRune, type Rune } from '@/services/runeEngine';
import RuneStoneItem from '@/components/runes/RuneStoneItem';
import CornerTicks from '@/components/CornerTicks';
import { GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY } from '@/theme/colors';

type RunePick = { id: string; orientation: 'upright' | 'reversed' };

type Props = {
  runes: RunePick[];
  positions: string[];
  accentColor: string;
  onInspectRune?: (rune: Rune, label: string) => void;
};

function MiniRune({
  rune,
  label,
  accentColor,
  onPress,
}: {
  rune: RunePick;
  label: string;
  accentColor: string;
  onPress?: () => void;
}) {
  const meaning = getRuneById(rune.id);
  const symmetric = isSymmetricRune(rune.id);
  const isReversed = rune.orientation === 'reversed' && !symmetric;

  const fullRune: Rune | undefined = meaning ? { ...meaning, isReversed } : undefined;

  return (
    <Pressable onPress={onPress} style={styles.miniItem}>
      <Text style={[styles.miniLabel, { color: accentColor }]} numberOfLines={2}>
        {label}
      </Text>
      <RuneStoneItem rune={fullRune} size="sm" revealed={true} isReversed={isReversed} glowColor={accentColor} />
      <Text style={styles.miniName} numberOfLines={1}>
        {meaning?.name ?? rune.id}
      </Text>
    </Pressable>
  );
}

function RowLayout({ runes, positions, accentColor, onInspectRune }: Props) {
  return (
    <View style={styles.rowWrap}>
      {runes.map((rune, index) => {
        const meaning = getRuneById(rune.id);
        const isReversed = rune.orientation === 'reversed' && !isSymmetricRune(rune.id);
        const full = meaning ? { ...meaning, isReversed } : undefined;
        return (
          <MiniRune
            key={`${rune.id}-${index}`}
            rune={rune}
            label={positions[index] || `${index + 1}. Rün`}
            accentColor={accentColor}
            onPress={() => full && onInspectRune?.(full, positions[index] || '')}
          />
        );
      })}
    </View>
  );
}

function NorthernCrossLayout({ runes, positions, accentColor, onInspectRune }: Props) {
  const [center, top, bottom, left, right] = runes;
  if (!center || !top || !bottom || !left || !right) return <RowLayout runes={runes} positions={positions} accentColor={accentColor} onInspectRune={onInspectRune} />;
  
  const getFull = (pick: RunePick) => {
    const m = getRuneById(pick.id);
    return m ? { ...m, isReversed: pick.orientation === 'reversed' && !isSymmetricRune(pick.id) } : undefined;
  };

  return (
    <View style={styles.crossWrap}>
      <MiniRune rune={top} label={positions[1]} accentColor={accentColor} onPress={() => { const f = getFull(top); if (f) onInspectRune?.(f, positions[1]); }} />
      <View style={styles.crossMidRow}>
        <MiniRune rune={left} label={positions[3]} accentColor={accentColor} onPress={() => { const f = getFull(left); if (f) onInspectRune?.(f, positions[3]); }} />
        <MiniRune rune={center} label={positions[0]} accentColor={accentColor} onPress={() => { const f = getFull(center); if (f) onInspectRune?.(f, positions[0]); }} />
        <MiniRune rune={right} label={positions[4]} accentColor={accentColor} onPress={() => { const f = getFull(right); if (f) onInspectRune?.(f, positions[4]); }} />
      </View>
      <MiniRune rune={bottom} label={positions[2]} accentColor={accentColor} onPress={() => { const f = getFull(bottom); if (f) onInspectRune?.(f, positions[2]); }} />
    </View>
  );
}

function YggdrasilLayout({ runes, positions, accentColor, onInspectRune }: Props) {
  const tiers = [runes.slice(0, 3), runes.slice(3, 6), runes.slice(6, 9)];
  const tierLabels = ['Üst Dünyalar', 'Orta Dünyalar', 'Alt Dünyalar'];

  const getFull = (pick: RunePick) => {
    const m = getRuneById(pick.id);
    return m ? { ...m, isReversed: pick.orientation === 'reversed' && !isSymmetricRune(pick.id) } : undefined;
  };

  return (
    <View style={styles.treeWrap}>
      {tiers.map((tier, tierIdx) => (
        <View key={tierIdx} style={styles.treeTier}>
          <Text style={[styles.treeTierLabel, { color: accentColor }]}>{tierLabels[tierIdx]}</Text>
          <View style={styles.treeTierRunes}>
            {tier.map((rune, colIdx) => {
              const posIdx = tierIdx * 3 + colIdx;
              const shortLabel = positions[posIdx]?.split('—')[0]?.replace(/^\d+\.\s*/, '').trim();
              const full = getFull(rune);
              return (
                <MiniRune
                  key={`${rune.id}-${posIdx}`}
                  rune={rune}
                  label={shortLabel || `${posIdx + 1}`}
                  accentColor={accentColor}
                  onPress={() => full && onInspectRune?.(full, positions[posIdx] || '')}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function SingleLayout({ runes, positions, accentColor, onInspectRune }: Props) {
  const rune = runes[0];
  if (!rune) return null;
  const m = getRuneById(rune.id);
  const full = m ? { ...m, isReversed: rune.orientation === 'reversed' && !isSymmetricRune(rune.id) } : undefined;

  return (
    <View style={styles.singleWrap}>
      <MiniRune
        rune={rune}
        label={positions[0] || "Odin'in Rünü"}
        accentColor={accentColor}
        onPress={() => full && onInspectRune?.(full, positions[0] || '')}
      />
    </View>
  );
}

export default function RuneSpreadLayout({ runes, positions, accentColor, onInspectRune }: Props) {
  return (
    <View style={styles.card}>
      <CornerTicks />
      <Text style={[styles.title, { color: accentColor }]}>Açılımın Taş Dizilimi</Text>
      {runes.length === 1 ? (
        <SingleLayout runes={runes} positions={positions} accentColor={accentColor} onInspectRune={onInspectRune} />
      ) : runes.length === 5 ? (
        <NorthernCrossLayout runes={runes} positions={positions} accentColor={accentColor} onInspectRune={onInspectRune} />
      ) : runes.length === 9 ? (
        <YggdrasilLayout runes={runes} positions={positions} accentColor={accentColor} onInspectRune={onInspectRune} />
      ) : (
        <RowLayout runes={runes} positions={positions} accentColor={accentColor} onInspectRune={onInspectRune} />
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
  miniItem: { alignItems: 'center', width: 72, gap: 4 },
  miniLabel: { fontSize: 9.5, fontWeight: '700', textAlign: 'center', marginBottom: 2, minHeight: 20 },
  miniName: { fontSize: 9.5, color: TEXT_PRIMARY, marginTop: 2, textAlign: 'center', fontWeight: '700' },
  crossWrap: { alignItems: 'center', gap: 8, width: '100%', paddingVertical: 4 },
  crossMidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  treeWrap: { width: '100%', gap: 10 },
  treeTier: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 8 },
  treeTierLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  treeTierRunes: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
