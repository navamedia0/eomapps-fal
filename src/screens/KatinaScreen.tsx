import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { pickRandomKatinaCards, type KatinaCard } from '@/services/katina';
import { interpretKatinaSpread } from '@/services/readings-ai';
import { ApiRequestError } from '@/services/http';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import { saveReadingHistory } from '@/services/readingHistory';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { turkishUpperCase } from '@/utils/turkishCase';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import PlayingCardFace from '@/components/PlayingCardFace';
import TarotCardBack from '@/components/tarot/TarotCardBack';
import CornerTicks from '@/components/CornerTicks';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import ReadingCooldownNotice from '@/components/ReadingCooldownNotice';
import { useReadingCooldown } from '@/hooks/useReadingCooldown';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Katina'>;

const POSITIONS = ['Geçmiş', 'Şimdi', 'Gelecek'];
const DISPLAY_POSITIONS = ['Geçmiş', 'Şimdi', 'Gelecek', 'Genel Yorum'];

function CardFace({ card, position }: { card: KatinaCard; position: string }) {
  const rankSlug = card.id.slice(card.suit.length + 1);
  return (
    <View style={styles.cardFace}>
      <Text style={styles.cardPositionHeader}>{turkishUpperCase(position)}</Text>
      <PlayingCardFace suit={card.suit} rankSlug={rankSlug} size={98} />
      <Text style={styles.cardFaceName}>{card.name}</Text>
    </View>
  );
}

export default function KatinaScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<'ready' | 'loading' | 'result' | 'error' | 'blocked'>('ready');
  const [cards, setCards] = useState<KatinaCard[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const { remaining: cooldownRemaining, checked: cooldownChecked, notifyCongested } = useReadingCooldown('katina');

  const startReading = useCallback(
    async (payWithCoins = false) => {
      if (cooldownRemaining > 0) return;

      setPhase('loading');
      setError(null);
      setBlocked(null);
      setCoinFallback(null);

      try {
        if (payWithCoins) {
          const spent = await spendCoins(READING_COIN_COST);
          if (!spent) {
            setCoinFallback({ coins: await getCoins() });
            setPhase('blocked');
            return;
          }
        } else {
          const remaining = await getCredits();
          if (remaining < 1) {
            setCoinFallback({ coins: await getCoins() });
            setPhase('blocked');
            return;
          }
        }

        const drawn = pickRandomKatinaCards(3);
        setCards(drawn);

        const interpretation = await interpretKatinaSpread(drawn, POSITIONS, payWithCoins);

        if (!payWithCoins) {
          await spendCredit();
        }

        setResult(interpretation);
        setPhase('result');
        await saveReadingHistory({ type: 'katina', title: 'Katina Falı', result: interpretation });
      } catch (err) {
        if (err instanceof ApiRequestError && err.congestion) {
          notifyCongested(err.retryAfterSeconds ?? 30);
        }
        setError(err instanceof Error ? err.message : 'Kartlar okunurken bir sorun oluştu.');
        setPhase('error');
      }
    },
    [cooldownRemaining, notifyCongested],
  );

  const resetToReady = useCallback(() => {
    setPhase('ready');
    setCards([]);
    setResult(null);
    setError(null);
    setBlocked(null);
    setCoinFallback(null);
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

  const sections = useMemo(() => (result ? parseSpreadReading(result, DISPLAY_POSITIONS) : null), [result]);
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Üst Başlık */}
        <View style={styles.header}>
          <FeatureIcon
            source={FEATURE_ICONS.katina}
            fallback={<MaterialCommunityIcons name="cards-playing-outline" size={32} color={GOLD} />}
            size={68}
          />
          <Text style={styles.headerTitle}>Katina Falı</Text>
          <Text style={styles.headerSubtitle}>İzmir Deste Falı & Aşk Kehaneti</Text>
        </View>

        {/* 1. FAZ: HAZIRLIK VE "FALIMA BAK" EKRANI */}
        {phase === 'ready' && (
          <View style={styles.readyContainer}>
            {/* Açıklama Kutusu */}
            <View style={styles.introCard}>
              <CornerTicks />
              <View style={styles.introHeader}>
                <MaterialCommunityIcons name="star-crescent" size={18} color={GOLD} />
                <Text style={styles.introTitle}>Katina Destesi Seni Dinliyor</Text>
              </View>
              <Text style={styles.introText}>
                Katina falı; özellikle aşk, tutku, sırlar ve ikili ilişkilerin kadim kehanet aynasıdır. Zihnini niyetine
                veya merak ettiğin kişiye odakla, ardından 'Falıma Bak' butonuna basarak 3 kartlık kader açılımını başlat.
              </Text>
            </View>

            {/* Kapalı 3 Kart Önizlemesi */}
            <View style={styles.closedCardsRow}>
              {POSITIONS.map((pos) => (
                <View key={pos} style={styles.closedCardWrap}>
                  <Text style={styles.closedCardLabel}>{turkishUpperCase(pos)}</Text>
                  <TarotCardBack selected={false} onPress={() => {}} disabled />
                </View>
              ))}
            </View>

            {/* Bekleme Süresi Varsa Bildir */}
            {cooldownChecked && cooldownRemaining > 0 ? (
              <View style={styles.cooldownWrap}>
                <Ionicons name="hourglass-outline" size={24} color={GOLD} />
                <Text style={styles.cooldownText}>Yeni bir fal için bekleme süresi:</Text>
                <ReadingCooldownNotice remaining={cooldownRemaining} />
              </View>
            ) : (
              /* "FALIMA BAK" BUTONU */
              <Pressable
                onPress={() => startReading()}
                style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
              >
                <MaterialCommunityIcons name="star-crescent" size={20} color="#1a0d33" />
                <Text style={styles.startButtonText}>Falıma Bak</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* 2. FAZ: YÜKLENİYOR */}
        {phase === 'loading' && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <MaterialCommunityIcons name="star-crescent" size={44} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>
              Katina kartları açılıyor ve yorumlanıyor...
            </Animated.Text>
          </View>
        )}

        {/* HATA VEYA ENGEL DURUMLARI */}
        {phase === 'error' && error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => startReading()} style={styles.retryButton}>
              <MaterialCommunityIcons name="refresh" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {phase === 'blocked' && blocked && (
          <View style={styles.blockedBox}>
            <Ionicons name="moon" size={24} color={GOLD} />
            <Text style={styles.blockedText}>{blocked}</Text>
            <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
              <Ionicons name="home-outline" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
            </Pressable>
          </View>
        )}

        {coinFallback && (
          <CoinFallbackBox
            cost={READING_COIN_COST}
            coins={coinFallback.coins}
            onContinue={() => startReading(true)}
            onBuyCoins={() => navigation.navigate('CoinShop')}
            onDismiss={() => navigation.navigate('Home')}
          />
        )}

        {/* 3. FAZ: SONUÇ GÖSTERİMİ */}
        {phase === 'result' && result && (
          <View style={styles.resultContainer}>
            {/* Açılan 3 Kartın Sıralanması */}
            <View style={styles.cardsRow}>
              {cards.map((card, idx) => (
                <CardFace key={card.id} card={card} position={POSITIONS[idx]} />
              ))}
            </View>

            {/* Yorum Blokları */}
            <View style={styles.resultList}>
              {DISPLAY_POSITIONS.map((position, index) => (
                <View
                  key={position}
                  style={[styles.resultBlock, position === 'Genel Yorum' && styles.overallBlock]}
                >
                  <CornerTicks />
                  <View style={styles.resultBlockHeader}>
                    <MaterialCommunityIcons name="star-crescent" size={14} color={GOLD} />
                    <Text style={[styles.positionLabel, position === 'Genel Yorum' && styles.overallLabel]}>
                      {position === 'Genel Yorum' ? 'GENEL YORUM & HAYAT ÇIKARIMI' : turkishUpperCase(position)}
                    </Text>
                  </View>
                  <Text style={styles.interpretationText}>{sections ? sections[index] : result}</Text>
                </View>
              ))}

              {/* Alt Butonlar: Paylaş & Yeni Fal */}
              <View style={styles.actionsRow}>
                <ShareButton text={`Mistik Rehber - Katina Falım\n\n${result}`} />
                <Pressable
                  onPress={resetToReady}
                  style={({ pressed }) => [styles.newReadingButton, pressed && styles.newReadingButtonPressed]}
                >
                  <MaterialCommunityIcons name="cards-playing-outline" size={18} color={GOLD} />
                  <Text style={styles.newReadingButtonText}>Yeni Fal Bak</Text>
                </Pressable>
              </View>
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
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  readyContainer: {
    alignItems: 'center',
    width: '100%',
  },
  introCard: {
    position: 'relative',
    width: '100%',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.32)',
    padding: 16,
    marginBottom: 24,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: GOLD,
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  closedCardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },
  closedCardWrap: {
    alignItems: 'center',
    gap: 6,
  },
  closedCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
    letterSpacing: 0.5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a0d33',
    letterSpacing: 0.3,
  },
  cooldownWrap: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  cooldownText: {
    fontSize: 13,
    color: GOLD_SOFT,
  },
  resultContainer: {
    width: '100%',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  cardFace: {
    alignItems: 'center',
    gap: 6,
    width: 102,
  },
  cardPositionHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  cardFaceName: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 48,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: GOLD,
    letterSpacing: 0.5,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
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
    marginTop: 20,
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
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderColor: GOLD_SOFT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  retryButtonText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },
  resultList: {
    gap: 16,
  },
  resultBlock: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.32)',
    padding: 16,
  },
  overallBlock: {
    backgroundColor: 'rgba(38, 22, 70, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.45)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  overallLabel: {
    fontSize: 12.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 1,
  },
  resultBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.8,
  },
  interpretationText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  newReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    flex: 1.5,
    flexBasis: 0,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
  },
  newReadingButtonPressed: {
    opacity: 0.8,
  },
  newReadingButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
});
