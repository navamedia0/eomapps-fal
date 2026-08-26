import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { pickRandomKatinaCards, type KatinaCard } from '@/services/katina';
import { interpretKatinaSpread } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { turkishUpperCase } from '@/utils/turkishCase';
import { KATINA_SUIT_INFO } from '@/constants/katinaInfo';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Katina'>;

const POSITIONS = ['Geçmiş', 'Şimdi', 'Gelecek'];

function CardFace({ card }: { card: KatinaCard }) {
  const info = KATINA_SUIT_INFO[card.suit];
  return (
    <View style={styles.cardFace}>
      <MaterialCommunityIcons name={info.icon as any} size={26} color={info.color} />
      <Text style={styles.cardFaceName}>{card.name}</Text>
    </View>
  );
}

export default function KatinaScreen({ navigation }: Props) {
  const cards = useMemo(() => pickRandomKatinaCards(3), []);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const fetchReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBlocked(null);
    try {
      const remaining = await getCredits();
      if (remaining < 1) {
        setBlocked('Bugünkü ücretsiz fal hakkın doldu. Yarın tekrar buradayız ✨');
        return;
      }
      const interpretation = await interpretKatinaSpread(cards, POSITIONS);
      await spendCredit();
      setResult(interpretation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kartlar okunurken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchReading();
  }, [fetchReading]);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, pulse]);

  const sections = useMemo(() => (result ? parseSpreadReading(result, POSITIONS) : null), [result]);
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsRow}>
          {cards.map((card) => (
            <CardFace key={card.id} card={card} />
          ))}
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Kartlar okunuyor...</Animated.Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchReading} style={styles.retryButton}>
              <MaterialCommunityIcons name="refresh" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {blocked && (
          <View style={styles.blockedBox}>
            <Ionicons name="moon" size={22} color={GOLD} />
            <Text style={styles.blockedText}>{blocked}</Text>
            <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
              <Ionicons name="home-outline" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && !blocked && result && (
          <View style={styles.resultList}>
            {POSITIONS.map((position, index) => (
              <View key={position} style={styles.resultBlock}>
                <Text style={styles.positionLabel}>{turkishUpperCase(position)}</Text>
                <Text style={styles.interpretationText}>{sections ? sections[index] : result}</Text>
              </View>
            ))}

            <View style={styles.actionsRow}>
              <ShareButton text={`Mistik Rehber - Katina Falım\n\n${result}`} />
              <Pressable
                onPress={() => navigation.replace('Katina')}
                style={({ pressed }) => [styles.newReadingButton, pressed && styles.newReadingButtonPressed]}
              >
                <MaterialCommunityIcons name="cards-playing-outline" size={18} color={GOLD} />
                <Text style={styles.newReadingButtonText}>Yeni Fal Bak</Text>
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
    paddingTop: 28,
    paddingBottom: 48,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  cardFace: {
    width: 88,
    height: 120,
    borderRadius: 14,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  cardFaceName: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
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
  resultList: {
    gap: 18,
  },
  resultBlock: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  positionLabel: {
    fontSize: 11,
    color: GOLD,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
    flex: 1.6,
    flexBasis: 0,
  },
  newReadingButtonPressed: {
    opacity: 0.8,
  },
  newReadingButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: GOLD,
  },
});
