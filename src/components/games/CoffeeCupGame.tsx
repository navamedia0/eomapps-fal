import React, { useState, useEffect, useRef } from 'react';
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

type CupSymbol = {
  id: string;
  name: string;
  meaning: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const SYMBOLS: CupSymbol[] = [
  { id: 'fish', name: 'Balık', meaning: 'Kısmet ve Bereket', icon: 'fish' },
  { id: 'bird', name: 'Kuş', meaning: 'Hayırlı Haber ve Müjde', icon: 'bird' },
  { id: 'eye', name: 'Göz', meaning: 'Nazar ve Güçlü Sezgi', icon: 'eye' },
  { id: 'key', name: 'Anahtar', meaning: 'Kilitli Kapıların Açılışı', icon: 'key' },
  { id: 'road', name: 'Yol', meaning: 'Aydınlık Seyahat ve Değişim', icon: 'road-variant' },
  { id: 'heart', name: 'Kalp', meaning: 'Büyük Sevgi ve Aşk', icon: 'heart' },
];

const TARGET_ROUNDS = 3;

export default function CoffeeCupGame({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const cardSize = Math.min((width - 64) / 2, 140);

  const [round, setRound] = useState(1);
  const [targetSymbol, setTargetSymbol] = useState<CupSymbol>(SYMBOLS[0]);
  const [options, setOptions] = useState<CupSymbol[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(7);
  const [isWon, setIsWon] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [canReward, setCanReward] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    canPlayRewarded('cup').then(setCanReward);
    generateNewRound(1);
  }, []);

  const generateNewRound = (newRoundNum: number) => {
    setSelectedId(null);
    setTimeLeft(7);

    // Rastgele 1 hedef sembol seç
    const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5);
    const chosenTarget = shuffledSymbols[0];
    setTargetSymbol(chosenTarget);

    // 4 şık oluştur (hedef sembol dahil)
    const otherThree = shuffledSymbols.slice(1, 4);
    const roundOptions = [chosenTarget, ...otherThree].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFailed(true);
  };

  const handleSelect = async (symbolId: string) => {
    if (selectedId !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedId(symbolId);

    if (symbolId === targetSymbol.id) {
      // Doğru seçim!
      if (round >= TARGET_ROUNDS) {
        // Oyun kazanıldı!
        setTimeout(async () => {
          setIsWon(true);
          if (canReward) {
            await addCoins(10);
            await markGamePlayed('cup');
            setCanReward(false);
          }
        }, 600);
      } else {
        setTimeout(() => {
          setRound((r) => r + 1);
          generateNewRound(round + 1);
        }, 800);
      }
    } else {
      // Yanlış seçim
      setTimeout(() => {
        setIsFailed(true);
      }, 700);
    }
  };

  const handleRestart = () => {
    setRound(1);
    setIsWon(false);
    setIsFailed(false);
    generateNewRound(1);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Üst Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
          <Text style={styles.headerTitle}>Kader Fincanı & Sırrı Bul</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={GOLD} />
        </Pressable>
      </View>

      {/* Tur ve Sayaç */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statLabel}>Tur:</Text>
          <Text style={styles.statValue}>
            {round} / {TARGET_ROUNDS}
          </Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="timer-outline" size={14} color={timeLeft <= 3 ? '#EF4444' : GOLD} />
          <Text style={[styles.statValue, timeLeft <= 3 && { color: '#EF4444' }]}>
            {timeLeft}s
          </Text>
        </View>
        <View style={styles.statPill}>
          <MaterialCommunityIcons name="star-crescent" size={14} color={GOLD} />
          <Text style={[styles.statValue, { color: canReward ? GOLD : TEXT_MUTED }]}>
            {canReward ? '+10 Coin' : 'Alındı'}
          </Text>
        </View>
      </View>

      {!isWon && !isFailed ? (
        <>
          {/* HEDEF SEMBOL BİLGİ KARTI */}
          <View style={styles.targetCard}>
            <CornerTicks />
            <Text style={styles.targetPrompt}>Fincanın dibinde aranan sembol:</Text>
            <View style={styles.targetBadge}>
              <MaterialCommunityIcons name={targetSymbol.icon} size={22} color="#1A0D33" />
              <Text style={styles.targetBadgeText}>{targetSymbol.name}</Text>
            </View>
            <Text style={styles.targetMeaning}>({targetSymbol.meaning})</Text>
          </View>

          {/* 4 FİNCAN SEÇENEĞİ */}
          <View style={styles.grid}>
            {options.map((item) => {
              const isChosen = selectedId === item.id;
              const isCorrect = item.id === targetSymbol.id;
              const isAnswered = selectedId !== null;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item.id)}
                  disabled={isAnswered}
                  style={({ pressed }) => [
                    styles.cupCard,
                    { width: cardSize, height: cardSize },
                    pressed && !isAnswered && styles.cupPressed,
                    isAnswered && isCorrect && styles.cupCorrect,
                    isAnswered && isChosen && !isCorrect && styles.cupWrong,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={36}
                    color={
                      isAnswered && isCorrect
                        ? '#10B981'
                        : isAnswered && isChosen
                        ? '#EF4444'
                        : GOLD
                    }
                  />
                  <Text
                    style={[
                      styles.cupName,
                      isAnswered && isCorrect && { color: '#10B981' },
                      isAnswered && isChosen && !isCorrect && { color: '#EF4444' },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : isWon ? (
        /* KAZANMA EKRANI */
        <View style={styles.resultCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="trophy" size={44} color={GOLD} />
          <Text style={styles.resultTitle}>Kahve Falının Sırrı Çözüldü!</Text>
          <Text style={styles.resultDesc}>
            Fincandaki tüm mistik sembolleri zamanında ve doğru buldun. Sezgilerin çok kuvvetli!
          </Text>
          {canReward && <Text style={styles.wonRewardText}>+10 Coin Hesabına Eklendi!</Text>}
          <Pressable onPress={handleRestart} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Tekrar Oyna</Text>
          </Pressable>
        </View>
      ) : (
        /* YENİLGİ EKRANI */
        <View style={styles.resultCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="coffee-outline" size={44} color="#EF4444" />
          <Text style={[styles.resultTitle, { color: '#EF4444' }]}>Fincan Soğudu!</Text>
          <Text style={styles.resultDesc}>
            Doğru sembolü zamanında bulamadın. Falın işaretlerini yakalamak için tekrar odaklan!
          </Text>
          <Pressable onPress={handleRestart} style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}>
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Yeniden Dene</Text>
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
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
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
  targetCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 14,
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  targetPrompt: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  targetBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0D33',
  },
  targetMeaning: {
    fontSize: 11.5,
    color: GOLD_SOFT,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  cupCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cupPressed: {
    transform: [{ scale: 0.96 }],
  },
  cupCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  cupWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  cupName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  resultCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 22,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
  },
  resultDesc: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 18,
  },
  wonRewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    marginVertical: 4,
  },
  actionBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A0D33',
  },
});
