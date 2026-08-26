import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { calculateBirthChart, type BirthChart } from '@/services/astrology';
import { interpretBirthChart } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { resolveBirthDate } from '@/utils/resolveBirthDate';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { TURKISH_CITIES } from '@/constants/turkishCities';
import BirthDataForm, { EMPTY_BIRTH_FORM, type BirthFormValue } from '@/components/BirthDataForm';
import NatalChartWheel from '@/components/NatalChartWheel';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BirthChart'>;

export default function BirthChartScreen({ navigation }: Props) {
  const [form, setForm] = useState<BirthFormValue>(EMPTY_BIRTH_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const calculate = useCallback(async (payWithCoins = false) => {
    setFormError(null);
    setError(null);
    setCoinFallback(null);

    const resolved = resolveBirthDate(form);
    if (!resolved.date) {
      setFormError(resolved.error);
      return;
    }
    const city = TURKISH_CITIES[form.cityIndex!];

    setLoading(true);
    setChart(null);
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
      const birthChart = calculateBirthChart({ date: resolved.date, latitude: city.latitude, longitude: city.longitude });
      const text = await interpretBirthChart(
        ZODIAC_INFO[birthChart.sunSign].name,
        ZODIAC_INFO[birthChart.moonSign].name,
        ZODIAC_INFO[birthChart.risingSign].name,
      );
      if (!payWithCoins) await spendCredit();
      setChart(birthChart);
      setResult(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğum haritası oluşturulurken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, [form]);

  const reset = useCallback(() => {
    setChart(null);
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

  const showForm = !chart && !loading && !coinFallback && !error;

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {showForm && (
            <View style={styles.formWrap}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="chart-donut" size={36} color={GOLD} />
              </View>
              <Text style={styles.instruction}>
                Doğum tarihini, saatini ve yerini gir; Güneş, Ay ve Yükselen burcunu keşfet.
              </Text>

              <BirthDataForm value={form} onChange={setForm} />

              {formError && <Text style={styles.formErrorText}>{formError}</Text>}

              <Pressable onPress={() => calculate()} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
                <Text style={styles.actionButtonText}>Haritamı Çıkar</Text>
              </Pressable>
            </View>
          )}

          {loading && (
            <View style={styles.loadingWrap}>
              <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
                <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
              </Animated.View>
              <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Gökyüzü okunuyor...</Animated.Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => calculate()} style={styles.retryButton}>
                <Ionicons name="refresh" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </Pressable>
            </View>
          )}

          {coinFallback && (
            <CoinFallbackBox
              cost={READING_COIN_COST}
              coins={coinFallback.coins}
              onContinue={() => calculate(true)}
              onBuyCoins={() => navigation.navigate('CoinShop')}
              onDismiss={() => navigation.navigate('Home')}
            />
          )}

          {chart && result && (
            <View style={styles.resultWrap}>
              <View style={styles.wheelWrap}>
                <NatalChartWheel
                  sunLongitude={chart.sunLongitude}
                  moonLongitude={chart.moonLongitude}
                  risingLongitude={chart.risingLongitude}
                />
              </View>

              <View style={styles.signRow}>
                <View style={styles.signCard}>
                  <MaterialCommunityIcons name={ZODIAC_INFO[chart.sunSign].icon as any} size={26} color={GOLD} />
                  <Text style={styles.signCardLabel}>Güneş</Text>
                  <Text style={styles.signCardValue}>{ZODIAC_INFO[chart.sunSign].name}</Text>
                </View>
                <View style={styles.signCard}>
                  <MaterialCommunityIcons name={ZODIAC_INFO[chart.moonSign].icon as any} size={26} color={GOLD} />
                  <Text style={styles.signCardLabel}>Ay</Text>
                  <Text style={styles.signCardValue}>{ZODIAC_INFO[chart.moonSign].name}</Text>
                </View>
                <View style={styles.signCard}>
                  <MaterialCommunityIcons name={ZODIAC_INFO[chart.risingSign].icon as any} size={26} color={GOLD} />
                  <Text style={styles.signCardLabel}>Yükselen</Text>
                  <Text style={styles.signCardValue}>{ZODIAC_INFO[chart.risingSign].name}</Text>
                </View>
              </View>

              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{result}</Text>
              </View>

              <View style={styles.actionsRow}>
                <ShareButton
                  text={`Mistik Rehber - Doğum Haritam\nGüneş: ${ZODIAC_INFO[chart.sunSign].name} · Ay: ${ZODIAC_INFO[chart.moonSign].name} · Yükselen: ${ZODIAC_INFO[chart.risingSign].name}\n\n${result}`}
                />
                <Pressable onPress={reset} style={({ pressed }) => [styles.actionButton, styles.resetButton, pressed && styles.actionButtonPressed]}>
                  <Ionicons name="refresh" size={18} color={NIGHT_CARD} />
                  <Text style={styles.actionButtonText}>Yeni Hesaplama</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  formWrap: {
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  formErrorText: {
    color: '#E08A8A',
    fontSize: 12.5,
    marginTop: 14,
    textAlign: 'center',
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
    marginTop: 22,
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
    gap: 16,
  },
  wheelWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  signRow: {
    flexDirection: 'row',
    gap: 10,
  },
  signCard: {
    flex: 1,
    flexBasis: 0,
    alignItems: 'center',
    gap: 4,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  signCardLabel: {
    fontSize: 10.5,
    color: TEXT_MUTED,
  },
  signCardValue: {
    fontSize: 12.5,
    fontWeight: '700',
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
  resetButton: {
    flex: 1.6,
    flexBasis: 0,
    marginTop: 0,
  },
});
