import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { calculateLifePath, calculateNameNumber } from '@/services/numerology';
import { interpretNumerology } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import DateFields from '@/components/DateFields';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Numerology'>;

export default function NumerologyScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ lifePath: number; nameNumber: number; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setCoinFallback(null);
    setFormError(null);
  }, []);

  const validate = useCallback((): Date | null => {
    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(year);
    if (!name.trim()) {
      setFormError('Lütfen adını ve soyadını gir.');
      return null;
    }
    if (!dayNum || !monthNum || !yearNum || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setFormError('Lütfen geçerli bir doğum tarihi gir.');
      return null;
    }
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
      setFormError('Lütfen geçerli bir doğum tarihi gir.');
      return null;
    }
    return date;
  }, [name, day, month, year]);

  const calculate = useCallback(async (payWithCoins = false) => {
    setFormError(null);
    setError(null);
    setCoinFallback(null);
    const date = validate();
    if (!date) return;

    setLoading(true);
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
      const lifePath = calculateLifePath(date);
      const nameNumber = calculateNameNumber(name.trim());
      const text = await interpretNumerology(name.trim(), lifePath, nameNumber);
      if (!payWithCoins) await spendCredit();
      setResult({ lifePath, nameNumber, text });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Numeroloji yorumu alınırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, [name, validate]);

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

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!result && !loading && !coinFallback && (
            <View style={styles.formWrap}>
              <View style={styles.iconCircle}>
                <Ionicons name="calculator-outline" size={36} color={GOLD} />
              </View>
              <Text style={styles.instruction}>
                Ad soyadını ve doğum tarihini gir; sayıların sende ne anlattığını keşfedelim.
              </Text>

              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ad Soyad"
                placeholderTextColor={TEXT_MUTED}
                style={styles.input}
              />

              <Text style={styles.label}>Doğum Tarihi</Text>
              <DateFields day={day} month={month} year={year} onDayChange={setDay} onMonthChange={setMonth} onYearChange={setYear} />

              {formError && <Text style={styles.formErrorText}>{formError}</Text>}

              <Pressable onPress={() => calculate()} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
                <Text style={styles.actionButtonText}>Sayılarımı Göster</Text>
              </Pressable>
            </View>
          )}

          {loading && (
            <View style={styles.loadingWrap}>
              <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
                <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
              </Animated.View>
              <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>Sayılar okunuyor...</Animated.Text>
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

          {result && (
            <View style={styles.resultWrap}>
              <View style={styles.numberRow}>
                <View style={styles.numberCard}>
                  <Text style={styles.numberValue}>{result.lifePath}</Text>
                  <Text style={styles.numberLabel}>Yaşam Yolu Sayısı</Text>
                </View>
                <View style={styles.numberCard}>
                  <Text style={styles.numberValue}>{result.nameNumber}</Text>
                  <Text style={styles.numberLabel}>İsim Sayısı</Text>
                </View>
              </View>
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{result.text}</Text>
              </View>
              <View style={styles.actionsRow}>
                <ShareButton
                  text={`Mistik Rehber - Numeroloji\n\nYaşam Yolu Sayısı: ${result.lifePath}\nİsim Sayısı: ${result.nameNumber}\n\n${result.text}`}
                />
                <Pressable
                  onPress={reset}
                  style={({ pressed }) => [styles.actionButton, styles.resetButton, pressed && styles.actionButtonPressed]}
                >
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
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: '100%',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  formErrorText: {
    color: '#E08A8A',
    fontSize: 12.5,
    marginTop: 10,
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
  numberRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numberCard: {
    flex: 1,
    flexBasis: 0,
    alignItems: 'center',
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 18,
  },
  numberValue: {
    fontSize: 32,
    fontWeight: '700',
    color: GOLD,
  },
  numberLabel: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginTop: 4,
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
