import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ZODIACS, type Zodiac } from '@/services/zodiac';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { interpretZodiacCompatibility } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Compatibility'>;

function SignGrid({ selected, onSelect }: { selected: Zodiac | null; onSelect: (sign: Zodiac) => void }) {
  return (
    <View style={styles.grid}>
      {ZODIACS.map((sign) => {
        const info = ZODIAC_INFO[sign];
        const isSelected = selected === sign;
        return (
          <Pressable
            key={sign}
            onPress={() => onSelect(sign)}
            style={({ pressed }) => [
              styles.signCard,
              isSelected && styles.signCardSelected,
              pressed && styles.signCardPressed,
            ]}
          >
            <MaterialCommunityIcons name={info.icon as any} size={26} color={isSelected ? NIGHT_CARD : GOLD} />
            <Text style={[styles.signName, isSelected && styles.signNameSelected]}>{info.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CompatibilityScreen({ navigation }: Props) {
  const [signA, setSignA] = useState<Zodiac | null>(null);
  const [signB, setSignB] = useState<Zodiac | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    setSignA(null);
    setSignB(null);
    setResult(null);
    setError(null);
    setCoinFallback(null);
  }, []);

  const check = useCallback(async (a: Zodiac, b: Zodiac, payWithCoins = false) => {
    setLoading(true);
    setError(null);
    setCoinFallback(null);
    setResult(null);
    try {
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
      const reading = await interpretZodiacCompatibility(ZODIAC_INFO[a].name, ZODIAC_INFO[b].name);
      if (!payWithCoins) await spendCredit();
      setResult(reading);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uyum yorumu alınırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSignA = useCallback((sign: Zodiac) => setSignA(sign), []);

  const selectSignB = useCallback(
    (sign: Zodiac) => {
      if (!signA) return;
      setSignB(sign);
      check(signA, sign);
    },
    [signA, check],
  );

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

  if (result || loading || coinFallback || error) {
    return (
      <MysticTableBackground>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {(signA || signB) && (
            <View style={styles.pairHeader}>
              {signA && <MaterialCommunityIcons name={ZODIAC_INFO[signA].icon as any} size={30} color={GOLD} />}
              <Ionicons name="heart" size={18} color={GOLD} />
              {signB && <MaterialCommunityIcons name={ZODIAC_INFO[signB].icon as any} size={30} color={GOLD} />}
            </View>
          )}
          {signA && signB && (
            <Text style={styles.pairLabel}>
              {ZODIAC_INFO[signA].name} & {ZODIAC_INFO[signB].name}
            </Text>
          )}

          {loading && (
            <View style={styles.loadingWrap}>
              <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
                <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
              </Animated.View>
              <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Uyum okunuyor...</Animated.Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => signA && signB && check(signA, signB)} style={styles.retryButton}>
                <Ionicons name="refresh" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </Pressable>
            </View>
          )}

          {coinFallback && (
            <CoinFallbackBox
              cost={READING_COIN_COST}
              coins={coinFallback.coins}
              onContinue={() => signA && signB && check(signA, signB, true)}
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
              {result && signA && signB && (
                <ShareButton
                  text={`Mistik Rehber - Burç Uyumu\n${ZODIAC_INFO[signA].name} & ${ZODIAC_INFO[signB].name}\n\n${result}`}
                />
              )}
              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.actionButtonSecondary, styles.backButton, pressed && styles.actionButtonPressed]}
              >
                <Ionicons name="arrow-back" size={18} color={GOLD} />
                <Text style={styles.actionButtonSecondaryText}>Başka Çift Dene</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>{!signA ? 'Senin burcun' : 'Onun burcu'}</Text>
        <Text style={styles.instruction}>
          {!signA
            ? 'Önce kendi burcunu seç.'
            : `Şimdi de ${ZODIAC_INFO[signA].name} ile uyumunu merak ettiğin burcu seç.`}
        </Text>
        <SignGrid selected={!signA ? signA : signB} onSelect={!signA ? selectSignA : selectSignB} />
        {signA && (
          <Pressable onPress={() => setSignA(null)} style={styles.changeSignButton}>
            <Text style={styles.changeSignText}>Kendi burcunu değiştir: {ZODIAC_INFO[signA].name}</Text>
          </Pressable>
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
  stepLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    textAlign: 'center',
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
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  signCardSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  signCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  signName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  signNameSelected: {
    color: NIGHT_CARD,
  },
  changeSignButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  changeSignText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  pairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 8,
  },
  pairLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 24,
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
