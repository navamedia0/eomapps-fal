import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { pickRandomKatinaCards, type KatinaCard } from '@/services/katina';
import { interpretSolitaireSpread } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { KATINA_SUIT_INFO } from '@/constants/katinaInfo';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Solitaire'>;

const CARD_COUNT = 7;

function CardFace({ card }: { card: KatinaCard }) {
  const info = KATINA_SUIT_INFO[card.suit];
  return (
    <View style={styles.cardFace}>
      <MaterialCommunityIcons name={info.icon as any} size={20} color={info.color} />
      <Text style={styles.cardFaceName}>{card.name}</Text>
    </View>
  );
}

export default function SolitaireScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<'wish' | 'loading' | 'result' | 'error' | 'blocked'>('wish');
  const [cards, setCards] = useState<KatinaCard[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const reveal = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const remaining = await getCredits();
      if (remaining < 1) {
        setPhase('blocked');
        return;
      }
      const drawn = pickRandomKatinaCards(CARD_COUNT);
      const interpretation = await interpretSolitaireSpread(drawn);
      await spendCredit();
      setCards(drawn);
      setResult(interpretation);
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kartlar açılırken bir sorun oluştu.');
      setPhase('error');
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('wish');
    setCards([]);
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {phase === 'wish' && (
          <View style={styles.wishWrap}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="cards-club-outline" size={36} color={GOLD} />
            </View>
            <Text style={styles.wishTitle}>Bir Dilek Tut</Text>
            <Text style={styles.wishText}>
              Gözlerini kapat, içinden geçen bir dileği ya da merak ettiğin bir konuyu net bir şekilde düşün.
              Hazır olduğunda kartları aç.
            </Text>
            <Pressable onPress={reveal} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
              <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
              <Text style={styles.actionButtonText}>Dilek Tuttum, Kartları Aç</Text>
            </Pressable>
          </View>
        )}

        {phase === 'loading' && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Kartlar açılıyor...</Animated.Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={reveal} style={styles.retryButton}>
              <Ionicons name="refresh" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {phase === 'blocked' && (
          <View style={styles.blockedBox}>
            <Ionicons name="moon" size={22} color={GOLD} />
            <Text style={styles.blockedText}>Bugünkü ücretsiz fal hakkın doldu. Yarın tekrar buradayız ✨</Text>
            <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
              <Ionicons name="home-outline" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
            </Pressable>
          </View>
        )}

        {phase === 'result' && result && (
          <View style={styles.resultWrap}>
            <View style={styles.cardsGrid}>
              {cards.map((card) => (
                <CardFace key={card.id} card={card} />
              ))}
            </View>

            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result}</Text>
            </View>

            <View style={styles.actionsRow}>
              <ShareButton text={`Mistik Rehber - Solitaire Falım\n\n${result}`} />
              <Pressable onPress={reset} style={({ pressed }) => [styles.newButton, pressed && styles.actionButtonPressed]}>
                <MaterialCommunityIcons name="cards-club-outline" size={18} color={GOLD} />
                <Text style={styles.newButtonText}>Yeni Dilek Tut</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  wishWrap: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wishTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 10,
  },
  wishText: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: GOLD,
    letterSpacing: 0.8,
    fontStyle: 'italic',
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  blockedBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: GOLD_SOFT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  blockedText: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  retryButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  resultWrap: {
    gap: 18,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  cardFace: {
    width: 76,
    height: 104,
    borderRadius: 12,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  cardFaceName: {
    fontSize: 9.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
    flex: 1.6,
  },
  newButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: GOLD,
  },
});
