import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addCoins } from '@/services/coins';
import { canPlayRewarded, markGamePlayed } from '@/services/miniGamesCooldown';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type CardItem = {
  id: number;
  pairKey: string;
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const MAX_ALLOWED_MOVES = 14; // Katı hamle sınırı!

const BASE_CARDS = [
  { pairKey: 'magician', name: 'Büyücü', icon: 'auto-fix' as const, color: '#A855F7' },
  { pairKey: 'sun', name: 'Güneş', icon: 'white-balance-sunny' as const, color: '#F59E0B' },
  { pairKey: 'moon', name: 'Ay', icon: 'moon-waning-crescent' as const, color: '#CBD5E1' },
  { pairKey: 'star', name: 'Yıldız', icon: 'star-four-points' as const, color: '#38BDF8' },
  { pairKey: 'empress', name: 'Kraliçe', icon: 'crown' as const, color: '#EC4899' },
  { pairKey: 'cup', name: 'Kupa', icon: 'cup-water' as const, color: '#10B981' },
];

function createShuffledDeck(): CardItem[] {
  const deck: CardItem[] = [];
  let id = 0;

  BASE_CARDS.forEach((card) => {
    deck.push({ ...card, id: id++, isFlipped: false, isMatched: false });
    deck.push({ ...card, id: id++, isFlipped: false, isMatched: false });
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export default function TarotMemoryGame({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min((width - 72) / 3, 90);
  const cardHeight = cardWidth * 1.35;

  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [movesUsed, setMovesUsed] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const movesLeft = Math.max(0, MAX_ALLOWED_MOVES - movesUsed);

  useEffect(() => {
    setCards(createShuffledDeck());
    canPlayRewarded('match').then(setIsRewarded);
  }, []);

  const handleCardPress = (index: number) => {
    if (isBusy || isCompleted || isFailed || cards[index].isFlipped || cards[index].isMatched || selectedIndices.includes(index)) {
      return;
    }

    const newIndices = [...selectedIndices, index];

    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c)),
    );
    setSelectedIndices(newIndices);

    if (newIndices.length === 2) {
      setIsBusy(true);
      const nextMovesUsed = movesUsed + 1;
      setMovesUsed(nextMovesUsed);

      const [firstIdx, secondIdx] = newIndices;
      const firstCard = cards[firstIdx];
      const secondCard = cards[index];

      if (firstCard.pairKey === secondCard.pairKey) {
        // EŞLEŞTİ
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === index ? { ...c, isMatched: true, isFlipped: true } : c,
            ),
          );
          setSelectedIndices([]);
          setIsBusy(false);

          const nextMatches = matches + 1;
          setMatches(nextMatches);

          if (nextMatches === BASE_CARDS.length) {
            handleGameWin();
          } else if (nextMovesUsed >= MAX_ALLOWED_MOVES) {
            setIsFailed(true);
          }
        }, 400);
      } else {
        // EŞLEŞMEDİ
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === index ? { ...c, isFlipped: false } : c,
            ),
          );
          setSelectedIndices([]);
          setIsBusy(false);

          if (nextMovesUsed >= MAX_ALLOWED_MOVES) {
            setIsFailed(true);
          }
        }, 900);
      }
    }
  };

  const handleGameWin = async () => {
    setIsCompleted(true);
    const canReward = await canPlayRewarded('match');
    if (canReward) {
      await addCoins(10);
      await markGamePlayed('match');
      setIsRewarded(false);
    }
  };

  const handleRestart = () => {
    setCards(createShuffledDeck());
    setSelectedIndices([]);
    setMovesUsed(0);
    setMatches(0);
    setIsCompleted(false);
    setIsFailed(false);
    setIsBusy(false);
  };

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
          <Text style={styles.headerTitle}>Tarot Kart Eşleştirme</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={GOLD} />
        </Pressable>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, movesLeft <= 3 && styles.statPillDanger]}>
          <Text style={[styles.statLabel, movesLeft <= 3 && { color: '#FCA5A5' }]}>Kalan Hamle:</Text>
          <Text style={[styles.statValue, movesLeft <= 3 && { color: '#EF4444' }]}>{movesLeft}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Eşleşen:</Text>
          <Text style={styles.statValue}>{matches}/6</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: isRewarded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)' }]}>
          <MaterialCommunityIcons name="star-crescent" size={14} color={GOLD} />
          <Text style={[styles.statValue, { color: isRewarded ? GOLD : TEXT_MUTED }]}>
            {isRewarded ? '+10 Coin' : 'Alındı'}
          </Text>
        </View>
      </View>

      {/* 4x3 KART IZGARASI */}
      <View style={styles.grid}>
        {cards.map((card, idx) => {
          const isOpen = card.isFlipped || card.isMatched;

          return (
            <Pressable
              key={card.id}
              onPress={() => handleCardPress(idx)}
              style={({ pressed }) => [
                styles.card,
                { width: cardWidth, height: cardHeight },
                isOpen && styles.cardOpen,
                card.isMatched && styles.cardMatched,
                pressed && !isOpen && styles.cardPressed,
              ]}
            >
              {isOpen ? (
                <View style={styles.cardContent}>
                  <MaterialCommunityIcons name={card.icon} size={28} color={card.color} />
                  <Text style={[styles.cardName, { color: card.color }]}>{card.name}</Text>
                </View>
              ) : (
                <View style={styles.cardBack}>
                  <MaterialCommunityIcons name="star-crescent" size={22} color="rgba(255, 201, 60, 0.4)" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* KAZANMA POPUP */}
      {isCompleted && (
        <View style={styles.winCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="trophy" size={32} color={GOLD} />
          <Text style={styles.winTitle}>Tebrikler! Mükemmel Sezgi!</Text>
          <Text style={styles.winDesc}>
            Tüm tarot kartlarını {movesUsed} hamlede başarıyla eşleştirdin.
          </Text>
          {isRewarded && (
            <Text style={styles.winRewardText}>+10 Coin Hesabına Eklendi!</Text>
          )}

          <Pressable onPress={handleRestart} style={styles.playAgainBtn}>
            <MaterialCommunityIcons name="refresh" size={18} color="#1A0D33" />
            <Text style={styles.playAgainBtnText}>Tekrar Oyna</Text>
          </Pressable>
        </View>
      )}

      {/* BAŞARISIZ (HAMLE BİTTİ) POPUP */}
      {isFailed && !isCompleted && (
        <View style={styles.failCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.failTitle}>Kozmik Enerji Tükendi!</Text>
          <Text style={styles.failDesc}>
            {MAX_ALLOWED_MOVES} hamle sınırına ulaştın ve tüm kartları eşleştiremedin. Kartların sırrını çözmek için daha dikkatli olmalısın.
          </Text>

          <Pressable onPress={handleRestart} style={styles.retryBtn}>
            <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Yeniden Dene</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8, 7, 8, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statPillDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 32, 0.9)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardOpen: {
    backgroundColor: 'rgba(8, 7, 8, 0.95)',
    borderColor: GOLD,
  },
  cardMatched: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
  },
  cardContent: {
    alignItems: 'center',
    gap: 4,
  },
  cardName: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardBack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCard: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 32, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 8,
  },
  winTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
  },
  winDesc: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  winRewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginVertical: 4,
  },
  playAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  playAgainBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A0D33',
  },
  failCard: {
    position: 'relative',
    backgroundColor: 'rgba(35, 12, 25, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 18,
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 8,
  },
  failTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  failDesc: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
