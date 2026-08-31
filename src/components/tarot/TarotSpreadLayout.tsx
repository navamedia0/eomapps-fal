import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { TarotCard } from '@/services/tarot';
import type { SpreadId } from '@/services/tarotSpreads';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_MUTED } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  cards: TarotCard[];
  positions: string[];
  spreadId: SpreadId | number;
  isRelationship?: boolean;
  p1Name?: string;
  p2Name?: string;
};

const MINI_CARD = 52;

// Classic Celtic Cross geometry
const CELTIC_CROSS_POSITIONS = [
  { top: 120, left: 86 }, // 0 Mevcut Durum — center
  { top: 120, left: 86, rotate: true }, // 1 Engel — crosses over center
  { top: 210, left: 86 }, // 2 Kök Neden — below
  { top: 120, left: 16 }, // 3 Yakın Geçmiş — left
  { top: 30, left: 86 }, // 4 Olası Gelecek — above
  { top: 120, left: 156 }, // 5 Yaklaşan Gelecek — right
  { top: 260, left: 232 }, // 6 Tutumun — staff, bottom
  { top: 184, left: 232 }, // 7 Dış Etkiler
  { top: 108, left: 232 }, // 8 Umutlar ve Korkular
  { top: 32, left: 232 }, // 9 Nihai Sonuç — staff, top
];

function CelticCrossLayout({ cards }: { cards: TarotCard[] }) {
  return (
    <View style={styles.celticWrap}>
      {cards.slice(0, 10).map((card, index) => {
        const slot = CELTIC_CROSS_POSITIONS[index];
        if (!slot) return null;
        return (
          <View key={`${card.id}-${index}`} style={[styles.celticSlot, { top: slot.top, left: slot.left }]}>
            <View style={slot.rotate ? styles.rotate90 : undefined}>
              <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// 20 Kartlık Çift Açılımı (10 + 10 Kelt Çift Kehaneti)
function DualCelticCrossLayout({
  cards,
  p1Name = '1. Kişi (Sen)',
  p2Name = '2. Kişi (Partner)',
}: {
  cards: TarotCard[];
  p1Name?: string;
  p2Name?: string;
}) {
  const p1Cards = cards.slice(0, 10);
  const p2Cards = cards.slice(10, 20);

  return (
    <View style={styles.dualCrossContainer}>
      {/* 2. Kişi (Partner) */}
      <View style={styles.dualCrossPlayerBox}>
        <View style={styles.dualPlayerHeader}>
          <MaterialCommunityIcons name="account-heart" size={16} color="#F43F5E" />
          <Text style={[styles.dualPlayerTitle, { color: '#F43F5E' }]}>{p2Name} — Kelt Haçı</Text>
        </View>
        <CelticCrossLayout cards={p2Cards.length >= 10 ? p2Cards : cards.slice(0, 10)} />
      </View>

      {/* Kadersel Rezonans Ekseni */}
      <View style={styles.dualDividerRow}>
        <View style={styles.dualDividerLine} />
        <View style={styles.dualDividerBadge}>
          <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={12} color={GOLD} />
          <Text style={styles.dualDividerText}>KADERSEL REZONANS EKSENİ</Text>
          <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={12} color={GOLD} />
        </View>
        <View style={styles.dualDividerLine} />
      </View>

      {/* 1. Kişi (Sen) */}
      <View style={styles.dualCrossPlayerBox}>
        <View style={styles.dualPlayerHeader}>
          <MaterialCommunityIcons name="account" size={16} color="#38BDF8" />
          <Text style={[styles.dualPlayerTitle, { color: '#38BDF8' }]}>{p1Name} — Kelt Haçı</Text>
        </View>
        <CelticCrossLayout cards={p1Cards} />
      </View>
    </View>
  );
}

// 5 Kartlık Haç Geometrisi (Tek Kişilik veya Çift Parçası)
function FiveCrossLayout({ cards, playerColor }: { cards: TarotCard[]; playerColor: string }) {
  const c1 = cards[0]; // Merkez
  const c2 = cards[1]; // Üst
  const c3 = cards[2]; // Sol
  const c4 = cards[3]; // Sağ
  const c5 = cards[4]; // Alt

  return (
    <View style={styles.fiveCrossWrap}>
      {/* Üst */}
      {c2 && (
        <View style={styles.fiveCrossSlot}>
          <Text style={[styles.fiveCrossSlotLabel, { color: playerColor }]}>2. Taç</Text>
          <TarotCardFace card={c2} orientation={c2.orientation} size={MINI_CARD} />
          <Text style={styles.fiveCrossCardName} numberOfLines={1}>{c2.name}</Text>
        </View>
      )}

      {/* Orta Sıra */}
      <View style={styles.fiveCrossMidRow}>
        {/* Sol */}
        {c3 && (
          <View style={styles.fiveCrossSlot}>
            <Text style={[styles.fiveCrossSlotLabel, { color: playerColor }]}>3. Geçmiş</Text>
            <TarotCardFace card={c3} orientation={c3.orientation} size={MINI_CARD} />
            <Text style={styles.fiveCrossCardName} numberOfLines={1}>{c3.name}</Text>
          </View>
        )}

        {/* Merkez */}
        {c1 && (
          <View style={styles.fiveCrossSlot}>
            <Text style={[styles.fiveCrossSlotLabel, { color: playerColor }]}>1. Merkez</Text>
            <TarotCardFace card={c1} orientation={c1.orientation} size={MINI_CARD} />
            <Text style={styles.fiveCrossCardName} numberOfLines={1}>{c1.name}</Text>
          </View>
        )}

        {/* Sağ */}
        {c4 && (
          <View style={styles.fiveCrossSlot}>
            <Text style={[styles.fiveCrossSlotLabel, { color: playerColor }]}>4. Gelecek</Text>
            <TarotCardFace card={c4} orientation={c4.orientation} size={MINI_CARD} />
            <Text style={styles.fiveCrossCardName} numberOfLines={1}>{c4.name}</Text>
          </View>
        )}
      </View>

      {/* Alt */}
      {c5 && (
        <View style={styles.fiveCrossSlot}>
          <Text style={[styles.fiveCrossSlotLabel, { color: playerColor }]}>5. Temel</Text>
          <TarotCardFace card={c5} orientation={c5.orientation} size={MINI_CARD} />
          <Text style={styles.fiveCrossCardName} numberOfLines={1}>{c5.name}</Text>
        </View>
      )}
    </View>
  );
}

// 10 Kartlık Çift Açılımı (5 + 5 Karşılıklı Haç Altarı)
function DualFiveCrossLayout({
  cards,
  p1Name = '1. Kişi (Sen)',
  p2Name = '2. Kişi (Partner)',
}: {
  cards: TarotCard[];
  p1Name?: string;
  p2Name?: string;
}) {
  const p1Cards = cards.slice(0, 5);
  const p2Cards = cards.slice(5, 10);

  return (
    <View style={styles.dualCrossContainer}>
      {/* 2. Kişi (Partner) */}
      <View style={styles.dualCrossPlayerBox}>
        <View style={styles.dualPlayerHeader}>
          <MaterialCommunityIcons name="account-heart" size={16} color="#F43F5E" />
          <Text style={[styles.dualPlayerTitle, { color: '#F43F5E' }]}>{p2Name} — 5 Kart Haçı</Text>
        </View>
        <FiveCrossLayout cards={p2Cards.length >= 5 ? p2Cards : cards.slice(0, 5)} playerColor="#F43F5E" />
      </View>

      {/* Kadersel Rezonans Ekseni */}
      <View style={styles.dualDividerRow}>
        <View style={styles.dualDividerLine} />
        <View style={styles.dualDividerBadge}>
          <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={12} color={GOLD} />
          <Text style={styles.dualDividerText}>KADERSEL REZONANS EKSENİ</Text>
          <MaterialCommunityIcons name="cards-playing-diamond-multiple" size={12} color={GOLD} />
        </View>
        <View style={styles.dualDividerLine} />
      </View>

      {/* 1. Kişi (Sen) */}
      <View style={styles.dualCrossPlayerBox}>
        <View style={styles.dualPlayerHeader}>
          <MaterialCommunityIcons name="account" size={16} color="#38BDF8" />
          <Text style={[styles.dualPlayerTitle, { color: '#38BDF8' }]}>{p1Name} — 5 Kart Haçı</Text>
        </View>
        <FiveCrossLayout cards={p1Cards} playerColor="#38BDF8" />
      </View>
    </View>
  );
}

// 6 & 7 Kartlık Karşılıklı Çift Aynası
function RelationshipMirrorLayout({
  cards,
  positions,
  p1Name = '1. Kişi (Sen)',
  p2Name = '2. Kişi (Partner)',
}: {
  cards: TarotCard[];
  positions: string[];
  p1Name?: string;
  p2Name?: string;
}) {
  const isSeven = cards.length >= 7;
  const p1Cards = cards.slice(0, 3);
  const p2Cards = cards.slice(3, 6);
  const bridgeCard = isSeven ? cards[6] : null;

  return (
    <View style={styles.mirrorWrap}>
      {/* 2. Kişi (Üst Sıra) */}
      <View style={styles.mirrorRow}>
        <View style={styles.dualPlayerHeader}>
          <MaterialCommunityIcons name="account-heart" size={16} color="#F43F5E" />
          <Text style={[styles.dualPlayerTitle, { color: '#F43F5E' }]}>{p2Name}</Text>
        </View>
        <View style={styles.mirrorCardsRow}>
          {p2Cards.map((card, idx) => (
            <View key={`p2_${card.id}_${idx}`} style={styles.mirrorCardItem}>
              <Text style={styles.mirrorCardIndex}>{['1. Zihin', '2. Kalp', '3. Gelecek'][idx]}</Text>
              <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD} />
              <Text style={styles.mirrorCardName} numberOfLines={1}>{card.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ortak Köprü Kartı */}
      {bridgeCard && (
        <View style={styles.mirrorBridgeBox}>
          <View style={styles.dualDividerLine} />
          <View style={styles.mirrorBridgeCardFrame}>
            <Text style={styles.mirrorBridgeLabel}>✨ Ortak Kadersel Köprü</Text>
            <TarotCardFace card={bridgeCard} orientation={bridgeCard.orientation} size={MINI_CARD + 6} />
            <Text style={[styles.mirrorCardName, { color: GOLD }]} numberOfLines={1}>{bridgeCard.name}</Text>
          </View>
          <View style={styles.dualDividerLine} />
        </View>
      )}

      {/* 1. Kişi (Alt Sıra) */}
      <View style={styles.mirrorRow}>
        <View style={styles.dualPlayerHeader}>
          <MaterialCommunityIcons name="account" size={16} color="#38BDF8" />
          <Text style={[styles.dualPlayerTitle, { color: '#38BDF8' }]}>{p1Name}</Text>
        </View>
        <View style={styles.mirrorCardsRow}>
          {p1Cards.map((card, idx) => (
            <View key={`p1_${card.id}_${idx}`} style={styles.mirrorCardItem}>
              <Text style={[styles.mirrorCardIndex, { color: '#38BDF8' }]}>{['1. Zihin', '2. Kalp', '3. Gelecek'][idx]}</Text>
              <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD} />
              <Text style={styles.mirrorCardName} numberOfLines={1}>{card.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const HORSESHOE_POSITIONS = [
  { top: 15, left: 16, label: '1. Geçmiş' },
  { top: 85, left: 38, label: '2. Şimdi' },
  { top: 160, left: 72, label: '3. Gizli Etki' },
  { top: 200, left: 126, label: '4. Engel/Odak' },
  { top: 160, left: 180, label: '5. Çevre' },
  { top: 85, left: 214, label: '6. Tavsiye' },
  { top: 15, left: 236, label: '7. Sonuç' },
];

// 7 Kartlık Klasik At Nalı (Horseshoe) Açılımı
function HorseshoeLayout({ cards }: { cards: TarotCard[] }) {
  return (
    <View style={styles.horseshoeWrap}>
      {cards.slice(0, 7).map((card, index) => {
        const slot = HORSESHOE_POSITIONS[index];
        if (!slot) return null;
        return (
          <View key={`${card.id}-${index}`} style={[styles.horseshoeSlot, { top: slot.top, left: slot.left }]}>
            <View style={styles.horseshoeBadge}>
              <Text style={styles.horseshoeBadgeText}>{slot.label}</Text>
            </View>
            <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD - 4} />
            <Text style={styles.horseshoeCardName} numberOfLines={1}>
              {card.name}
            </Text>
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
        <View key={`${card.id}-${index}`} style={styles.rowItem}>
          <View style={styles.rowBadge}>
            <Text style={styles.rowBadgeText}>{index + 1}</Text>
          </View>
          <TarotCardFace card={card} orientation={card.orientation} size={MINI_CARD} />
          <Text style={styles.rowLabel} numberOfLines={1}>
            {positions[index] || `${index + 1}. Katman`}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function TarotSpreadLayout({
  cards,
  positions,
  spreadId,
  isRelationship,
  p1Name = '1. Kişi (Sen)',
  p2Name = '2. Kişi (Partner)',
}: Props) {
  const isTwenty = cards.length === 20 || spreadId === 20 || (spreadId as any) === 'rel_cosmic_20';
  const isTenRel = (isRelationship && cards.length === 10) || (spreadId as any) === 'rel_mirror_10';
  const isMirrorRel =
    (isRelationship && (cards.length === 6 || cards.length === 7)) ||
    (spreadId as any) === 'rel_mirror_6' ||
    (spreadId as any) === 'rel_bridge_7';
  const isHorseshoe = !isRelationship && (cards.length === 7 || spreadId === 7);

  return (
    <View style={styles.card}>
      <CornerTicks />
      <Text style={styles.title}>Açılımın Masadaki Dizilimi</Text>
      {isTwenty ? (
        <DualCelticCrossLayout cards={cards} p1Name={p1Name} p2Name={p2Name} />
      ) : isTenRel ? (
        <DualFiveCrossLayout cards={cards} p1Name={p1Name} p2Name={p2Name} />
      ) : isMirrorRel ? (
        <RelationshipMirrorLayout cards={cards} positions={positions} p1Name={p1Name} p2Name={p2Name} />
      ) : spreadId === 10 || cards.length === 10 ? (
        <CelticCrossLayout cards={cards} />
      ) : isHorseshoe ? (
        <HorseshoeLayout cards={cards} />
      ) : spreadId === 5 || cards.length === 5 ? (
        <FiveCrossLayout cards={cards} playerColor={GOLD} />
      ) : (
        <RowLayout cards={cards} positions={positions} />
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
    width: 300,
    height: 340,
    alignSelf: 'center',
  },
  celticSlot: {
    position: 'absolute',
    alignItems: 'center',
  },
  rotate90: {
    transform: [{ rotate: '90deg' }],
  },
  dualCrossContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dualCrossPlayerBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 18,
    padding: 10,
    marginVertical: 6,
  },
  dualPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dualPlayerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  dualDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
    gap: 8,
  },
  dualDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 201, 60, 0.25)',
  },
  dualDividerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.3)',
  },
  dualDividerText: {
    fontSize: 9,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  mirrorWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  mirrorRow: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 16,
  },
  mirrorPlayerLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  mirrorCardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  mirrorCardItem: {
    alignItems: 'center',
    width: MINI_CARD + 10,
  },
  mirrorCardIndex: {
    fontSize: 9,
    color: '#F43F5E',
    fontWeight: '700',
    marginBottom: 4,
  },
  mirrorCardName: {
    fontSize: 9,
    color: '#E2E8F0',
    marginTop: 4,
    textAlign: 'center',
  },
  mirrorBridgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  mirrorBridgeCardFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.4)',
  },
  mirrorBridgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: GOLD,
    marginBottom: 4,
  },
  // 5 Kart Haç Stilleri
  fiveCrossWrap: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 4,
  },
  fiveCrossMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fiveCrossSlot: {
    alignItems: 'center',
    width: MINI_CARD + 10,
  },
  fiveCrossSlotLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    marginBottom: 3,
    textAlign: 'center',
  },
  fiveCrossCardName: {
    fontSize: 8.5,
    color: '#E2E8F0',
    marginTop: 3,
    textAlign: 'center',
    fontWeight: '600',
  },
  // 7 Kart At Nalı (Horseshoe) Stilleri
  horseshoeWrap: {
    width: 310,
    height: 310,
    position: 'relative',
    alignSelf: 'center',
  },
  horseshoeSlot: {
    position: 'absolute',
    alignItems: 'center',
    width: MINI_CARD + 10,
  },
  horseshoeBadge: {
    backgroundColor: 'rgba(255, 201, 60, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 2,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 201, 60, 0.4)',
  },
  horseshoeBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  horseshoeCardName: {
    fontSize: 8,
    color: '#CBD5E1',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
});
