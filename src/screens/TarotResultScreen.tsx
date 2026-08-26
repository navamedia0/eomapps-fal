import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { findTarotCard, type TarotOrientation } from '@/services/tarot';
import { findSpread } from '@/services/tarotSpreads';
import { interpretTarotSpread } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { turkishUpperCase } from '@/utils/turkishCase';
import TarotCardFace from '@/components/tarot/TarotCardFace';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CardStoryModal from '@/components/tarot/CardStoryModal';
import ShareButton from '@/components/ShareButton';
import type { TarotCardDef } from '@/services/tarot';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TarotResult'>;

export default function TarotResultScreen({ route, navigation }: Props) {
  const spread = findSpread(route.params.spreadId);

  const cards = useMemo(
    () => route.params.picks.map((pick) => ({ ...findTarotCard(pick.id), orientation: pick.orientation as TarotOrientation })),
    [route.params.picks],
  );

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [storyCard, setStoryCard] = useState<TarotCardDef | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const fetchReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBlocked(null);
    try {
      if (spread.priceCoins > 0) {
        const coins = await getCoins();
        if (coins < spread.priceCoins) {
          setBlocked(`Bu açılım için ${spread.priceCoins} coin gerekiyor. Bakiyen: ${coins} coin.`);
          return;
        }
        const interpretation = await interpretTarotSpread(cards, spread.positions);
        await spendCoins(spread.priceCoins);
        setResult(interpretation);
        return;
      }

      const remaining = await getCredits();
      if (remaining < 1) {
        setBlocked('Bugünkü ücretsiz fal hakkın doldu. Yarın tekrar buradayız ✨');
        return;
      }
      const interpretation = await interpretTarotSpread(cards, spread.positions);
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

  const sections = useMemo(
    () => (result ? parseSpreadReading(result, spread.positions) : null),
    [result, spread.positions],
  );
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <MysticTableBackground variant="tarot">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <Ionicons name="sparkles" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>
              Kartlar okunuyor...
            </Animated.Text>
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
            {spread.priceCoins > 0 ? (
              <Pressable onPress={() => navigation.navigate('CoinShop')} style={styles.retryButton}>
                <Ionicons name="disc-outline" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Coin Yükle</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
                <Ionicons name="home-outline" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
              </Pressable>
            )}
          </View>
        )}

        {!loading && !error && !blocked && (
          <View style={styles.cardsList}>
            {cards.map((card, index) => (
              <View key={card.id} style={styles.cardBlock}>
                <View style={styles.cardBlockHeader}>
                  <TarotCardFace card={card} orientation={card.orientation} />
                  <View style={styles.cardBlockInfo}>
                    <Text style={styles.positionLabel}>{turkishUpperCase(spread.positions[index])}</Text>
                    <Text style={styles.cardName}>{card.name}</Text>
                    <Text style={styles.orientationLabel}>
                      {card.orientation === 'reversed' ? 'Ters' : 'Düz'}
                    </Text>
                    <Pressable onPress={() => setStoryCard(card)} style={styles.storyButton}>
                      <Ionicons name="book-outline" size={13} color={GOLD} />
                      <Text style={styles.storyButtonText}>Kartın Hikayesi</Text>
                    </Pressable>
                  </View>
                </View>
                {sections && (
                  <Text style={styles.interpretationText}>{sections[index]}</Text>
                )}
              </View>
            ))}

            {!sections && result && (
              <View style={styles.cardBlock}>
                <View style={styles.resultHeader}>
                  <Ionicons name="moon" size={18} color={GOLD} />
                  <Text style={styles.resultHeaderText}>Fal Yorumu</Text>
                </View>
                <Text style={styles.interpretationText}>{result}</Text>
              </View>
            )}

            {result && (
              <View style={styles.actionsRow}>
                <ShareButton text={`Mistik Rehber - Tarot Falım\n\n${result}`} />
                <Pressable
                  onPress={() => navigation.navigate('TarotSpread')}
                  style={({ pressed }) => [styles.newReadingButton, pressed && styles.newReadingButtonPressed]}
                >
                  <MaterialCommunityIcons name="cards" size={18} color={GOLD} />
                  <Text style={styles.newReadingButtonText}>Yeni Fal Bak</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <CardStoryModal card={storyCard} onClose={() => setStoryCard(null)} />
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
  loadingWrap: {
    alignItems: 'center',
    marginTop: 60,
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
    marginTop: 40,
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
    marginTop: 40,
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
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  cardsList: {
    gap: 18,
  },
  cardBlock: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  cardBlockHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  cardBlockInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  positionLabel: {
    fontSize: 11,
    color: GOLD,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  orientationLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  storyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  storyButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
