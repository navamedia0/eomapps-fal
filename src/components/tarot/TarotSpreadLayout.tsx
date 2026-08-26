import { View, Text, StyleSheet } from 'react-native';
import type { TarotCard } from '@/services/tarot';
import type { SpreadId } from '@/services/tarotSpreads';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_MUTED } from '@/theme/colors';

type Props = { cards: TarotCard[]; positions: string[]; spreadId: SpreadId };

const MINI_CARD = 56;

// Classic Celtic Cross geometry: a cross (present / challenge crossing it /
// foundation below / recent past left / potential above / near future right)
// plus a 4-card staff to the right (attitude → external → hopes-fears → outcome).
const CELTIC_CROSS_POSITIONS = [
  { top: 132, left: 96 }, // 0 Mevcut Durum — center
  { top: 132, left: 96, rotate: true }, // 1 Engel — crosses over center
  { top: 232, left: 96 }, // 2 Kök Neden — below
  { top: 132, left: 16 }, // 3 Yakın Geçmiş — left
  { top: 32, left: 96 }, // 4 Olası Gelecek — above
  { top: 132, left: 176 }, // 5 Yaklaşan Gelecek — right
  { top: 292, left: 256 }, // 6 Tutumun — staff, bottom
  { top: 212, left: 256 }, // 7 Dış Etkiler
  { top: 132, left: 256 }, // 8 Umutlar ve Korkular
  { top: 52, left: 256 }, // 9 Nihai Sonuç — staff, top
];

function CelticCrossLayout({ cards }: { cards: TarotCard[] }) {
  return (
    <View style={styles.celticWrap}>
      {cards.map((card, index) => {
        const slot = CELTIC_CROSS_POSITIONS[index];
        if (!slot) return null;
        return (
          <View key={card.id} style={[styles.celticSlot, { top: slot.top, left: slot.left }]}>
            <View style={slot.rotate ? styles.rotate90 : undefined}>
              <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RowLayout({ cards, positions }: { cards: TarotCard[]; positions: string[] }) {
  return (
    <View style={styles.rowWrap}>
      {cards.map((card, index) => (
        <View key={card.id} style={styles.rowItem}>
          <View style={styles.rowBadge}>
            <Text style={styles.rowBadgeText}>{index + 1}</Text>
          </View>
          <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD} />
          <Text style={styles.rowLabel} numberOfLines={1}>
            {positions[index]}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function TarotSpreadLayout({ cards, positions, spreadId }: Props) {
  return (
    <View style={styles.card}>
      <CornerTicks />
      <Text style={styles.title}>Açılımın Masadaki Dizilimi</Text>
      {spreadId === 10 ? <CelticCrossLayout cards={cards} /> : <RowLayout cards={cards} positions={positions} />}
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
    color: GOLD,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  rowItem: {
    alignItems: 'center',
    width: MINI_CARD + 10,
  },
  rowBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  rowLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 4,
  },
  celticWrap: {
    width: 320,
    height: 366,
  },
  celticSlot: {
    position: 'absolute',
    alignItems: 'center',
  },
  rotate90: {
    transform: [{ rotate: '90deg' }],
  },
});
