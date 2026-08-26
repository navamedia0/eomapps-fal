import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ZODIACS, type Zodiac } from '@/services/zodiac';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { ZODIAC_TRAITS } from '@/constants/zodiacTraits';
import { interpretDailyZodiac } from '@/services/readings-ai';
import { getCachedZodiacReading, setCachedZodiacReading } from '@/services/dailyZodiacCache';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Zodiac'>;

const todayLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ZodiacScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<Zodiac | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const load = useCallback(async (sign: Zodiac, payWithCoins = false) => {
    setLoading(true);
    setError(null);
    setCoinFallback(null);
    setResult(null);
    try {
      if (!payWithCoins) {
        const cached = await getCachedZodiacReading(sign);
        if (cached) {
          setResult(cached);
          return;
        }
      }
      if (payWithCoins) {
        const spent = await spendCoins(READING_COIN_COST);
        if (!spent) {
          setCoinFallback({ coins: await getCoins() });
          return;
        }
      } else {
        const remaining = await getCredits();
        if (remaining < 1) {
          setCoinFallback({ coins: await getCoins() });
          return;
        }
      }
      const reading = await interpretDailyZodiac(ZODIAC_INFO[sign].name);
      if (!payWithCoins) await spendCredit();
      await setCachedZodiacReading(sign, reading);
      setResult(reading);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Burç yorumu alınırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSign = useCallback(
    (sign: Zodiac) => {
      setSelected(sign);
      load(sign);
    },
    [load],
  );

  const goBack = useCallback(() => {
    setSelected(null);
    setResult(null);
    setError(null);
    setCoinFallback(null);
  }, []);

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

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  if (!selected) {
    return (
      <MysticTableBackground>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
          <Text style={styles.instruction}>Burcunu seç, yıldızların bugün sana ne söylediğini keşfet.</Text>
          <View style={styles.grid}>
            {ZODIACS.map((sign) => {
              const info = ZODIAC_INFO[sign];
              return (
                <Pressable
                  key={sign}
                  onPress={() => selectSign(sign)}
                  style={({ pressed }) => [styles.signCard, pressed && styles.signCardPressed]}
                >
                  <MaterialCommunityIcons name={info.icon as any} size={30} color={GOLD} />
                  <Text style={styles.signName}>{info.name}</Text>
                  <Text style={styles.signRange}>{info.dateRange}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </MysticTableBackground>
    );
  }

  const info = ZODIAC_INFO[selected];
  const traits = ZODIAC_TRAITS[selected];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={info.icon as any} size={40} color={GOLD} />
          </View>
          <Text style={styles.detailSign}>{info.name}</Text>
          <Text style={styles.dateLabel}>{info.dateRange}</Text>
        </View>

        <View style={styles.traitsCard}>
          <View style={styles.traitsRow}>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Element</Text>
              <Text style={styles.traitValue}>{traits.element}</Text>
            </View>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Nitelik</Text>
              <Text style={styles.traitValue}>{traits.quality}</Text>
            </View>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Kutup</Text>
              <Text style={styles.traitValue}>{traits.polarity}</Text>
            </View>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Yönetici</Text>
              <Text style={styles.traitValue}>{traits.rulingPlanet}</Text>
            </View>
          </View>
          <View style={styles.keyTraitsRow}>
            {traits.keyTraits.map((trait) => (
              <View key={trait} style={styles.keyTraitChip}>
                <Text style={styles.keyTraitText}>{trait}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.polarityNote}>
            "Kutup" burcun geleneksel astrolojideki enerji polaritesidir (eril: dışa dönük, dişil: içe dönük) — kişinin cinsiyetiyle ilgisi yoktur.
          </Text>
        </View>

        <Text style={styles.todayLabel}>{todayLabel} için günlük yorum</Text>

        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Yıldızlar okunuyor...</Animated.Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load(selected)} style={styles.retryButton}>
              <MaterialCommunityIcons name="refresh" size={16} color={GOLD} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {coinFallback && (
          <CoinFallbackBox
            cost={READING_COIN_COST}
            coins={coinFallback.coins}
            onContinue={() => selected && load(selected, true)}
            onBuyCoins={() => navigation.navigate('CoinShop')}
            onDismiss={() => navigation.navigate('Home')}
          />
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        {!loading && (
          <View style={styles.actionsRow}>
            {result && <ShareButton text={`Mistik Rehber - Günlük Burç (${info.name})\n\n${result}`} />}
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [styles.actionButtonSecondary, styles.backButton, pressed && styles.actionButtonPressed]}
            >
              <Ionicons name="arrow-back" size={18} color={GOLD} />
              <Text style={styles.actionButtonSecondaryText}>Başka Burç Seç</Text>
            </Pressable>
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
  dateLabel: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  signCard: {
    width: '31%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  signCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  signName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  signRange: {
    fontSize: 9.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  detailHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detailSign: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  traitsCard: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  traitItem: {
    flexBasis: '23%',
    alignItems: 'center',
    gap: 2,
  },
  traitLabel: {
    fontSize: 9.5,
    color: TEXT_MUTED,
  },
  traitValue: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  keyTraitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  keyTraitChip: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  keyTraitText: {
    fontSize: 11,
    color: TEXT_PRIMARY,
  },
  polarityNote: {
    fontSize: 10,
    color: TEXT_MUTED,
    lineHeight: 14,
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
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
    marginBottom: 20,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
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
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 20,
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
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  backButton: {
    flex: 1.6,
    flexBasis: 0,
    width: undefined,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
});
