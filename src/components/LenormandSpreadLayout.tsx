import { View, Text, StyleSheet, Image } from 'react-native';
import { getLenormandMeaning } from '@/services/lenormandMeanings';
import { LENORMAND_IMAGES } from '@/assets/cards/lenormand';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_MUTED, TEXT_PRIMARY } from '@/theme/colors';

type LenormandCardPick = { id: string; orientation: 'upright' | 'reversed' };

type Props = {
  cards: LenormandCardPick[];
  positions: string[];
  accentColor: string;
};

const MINI_SIZE = 48;

function MiniCard({ card, label, accentColor }: { card: LenormandCardPick; label: string; accentColor: string }) {
  const meaning = getLenormandMeaning(card.id);
  const cardImg = meaning?.number ? LENORMAND_IMAGES[meaning.number] : null;

  return (
    <View style={styles.miniItem}>
      <Text style={[styles.miniLabel, { color: accentColor }]} numberOfLines={2}>
        {label}
      </Text>
      <View
        style={[
          styles.miniBadge,
          { borderColor: accentColor, transform: card.orientation === 'reversed' ? [{ rotate: '180deg' }] : undefined },
        ]}
      >
        {cardImg ? (
          <Image source={cardImg} style={{ width: '100%', height: '100%', borderRadius: 6 }} resizeMode="cover" />
        ) : (
          <Text style={[styles.miniBadgeNumber, { color: accentColor }]}>{meaning?.number ?? '?'}</Text>
        )}
      </View>
      <Text style={styles.miniName} numberOfLines={1}>
        {meaning?.name ?? card.id}
      </Text>
    </View>
  );
}

// 3 Kart Cümlesi / 7 Günlük Hafta — otantik Lenormand'da bu açılımlar düz bir
// sırada, soldan sağa "cümle" gibi okunur; Tarot'un at nalı eğrisi gibi
// sembolik bir geometrisi yoktur.
function RowLayout({ cards, positions, accentColor }: Props) {
  return (
    <View style={styles.rowWrap}>
      {cards.map((card, index) => (
        <MiniCard key={`${card.id}-${index}`} card={card} label={positions[index] || `${index + 1}. Kart`} accentColor={accentColor} />
      ))}
    </View>
  );
}

// Kutsal Haç (5 Kart) — Merkez / Üst / Alt / Sol / Sağ, LENORMAND_SPREADS'teki
// pozisyon sırasıyla birebir eşleşir (bkz. services/lenormandSpreads.ts).
function CrossLayout({ cards, positions, accentColor }: Props) {
  const [center, top, bottom, left, right] = cards;
  if (!center || !top || !bottom || !left || !right) return <RowLayout cards={cards} positions={positions} accentColor={accentColor} />;
  return (
    <View style={styles.crossWrap}>
      <MiniCard card={top} label={positions[1]} accentColor={accentColor} />
      <View style={styles.crossMidRow}>
        <MiniCard card={left} label={positions[3]} accentColor={accentColor} />
        <MiniCard card={center} label={positions[0]} accentColor={accentColor} />
        <MiniCard card={right} label={positions[4]} accentColor={accentColor} />
      </View>
      <MiniCard card={bottom} label={positions[2]} accentColor={accentColor} />
    </View>
  );
}

// Kutu Açılımı (9 Kart, 3x3) — satırlar Geçmiş/Şimdi/Gelecek, sütunlar
// Duygusal/Maddi/Ruhsal. LENORMAND_SPREADS'teki pozisyon dizisi zaten bu
// sırayla (0-2 Geçmiş, 3-5 Şimdi, 6-8 Gelecek) tanımlı.
function BoxLayout({ cards, positions, accentColor }: Props) {
  const rows = [cards.slice(0, 3), cards.slice(3, 6), cards.slice(6, 9)];
  const rowLabels = ['Geçmiş', 'Şimdi', 'Gelecek'];
  return (
    <View style={styles.boxWrap}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.boxRow}>
          <Text style={[styles.boxRowLabel, { color: accentColor }]}>{rowLabels[rowIdx]}</Text>
          <View style={styles.boxRowCards}>
            {row.map((card, colIdx) => {
              const posIdx = rowIdx * 3 + colIdx;
              return <MiniCard key={`${card.id}-${posIdx}`} card={card} label={positions[posIdx]?.split('—')[1]?.trim() || `${posIdx + 1}`} accentColor={accentColor} />;
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function SingleLayout({ cards, positions, accentColor }: Props) {
  const card = cards[0];
  if (!card) return null;
  return (
    <View style={styles.singleWrap}>
      <MiniCard card={card} label={positions[0] || 'Günün Kartı'} accentColor={accentColor} />
    </View>
  );
}

export default function LenormandSpreadLayout({ cards, positions, accentColor }: Props) {
  return (
    <View style={styles.card}>
      <CornerTicks />
      <Text style={[styles.title, { color: accentColor }]}>Açılımın Masadaki Dizilimi</Text>
      {cards.length === 1 ? (
        <SingleLayout cards={cards} positions={positions} accentColor={accentColor} />
      ) : cards.length === 5 ? (
        <CrossLayout cards={cards} positions={positions} accentColor={accentColor} />
      ) : cards.length === 9 ? (
        <BoxLayout cards={cards} positions={positions} accentColor={accentColor} />
      ) : (
        <RowLayout cards={cards} positions={positions} accentColor={accentColor} />
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
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  singleWrap: { alignItems: 'center' },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  miniItem: { alignItems: 'center', width: MINI_SIZE + 30 },
  miniLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center', marginBottom: 5, minHeight: 22 },
  miniBadge: {
    width: MINI_SIZE,
    height: MINI_SIZE,
    borderRadius: MINI_SIZE / 2,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  miniBadgeNumber: { fontSize: 15, fontWeight: '900' },
  miniName: { fontSize: 9, color: TEXT_PRIMARY, marginTop: 4, textAlign: 'center', fontWeight: '600' },
  crossWrap: { alignItems: 'center', gap: 8, width: '100%', paddingVertical: 4 },
  crossMidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  boxWrap: { width: '100%', gap: 10 },
  boxRow: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 8 },
  boxRowLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  boxRowCards: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
