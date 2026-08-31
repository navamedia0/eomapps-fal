import { useCallback, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { calculateBirthChart, type BirthChart } from '@/services/astrology';
import { resolveBirthDate } from '@/utils/resolveBirthDate';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { TURKISH_CITIES } from '@/constants/turkishCities';
import { interpretBirthChart } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import BirthDataForm, { EMPTY_BIRTH_FORM, type BirthFormValue } from '@/components/BirthDataForm';
import NatalChartWheel from '@/components/NatalChartWheel';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import ShareButton from '@/components/ShareButton';
import CornerTicks from '@/components/CornerTicks';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RisingSign'>;

export default function RisingSignScreen({ navigation }: Props) {
  const [form, setForm] = useState<BirthFormValue>(EMPTY_BIRTH_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);

  const calculate = useCallback(() => {
    setFormError(null);
    setAiReading(null);
    setAiError(null);
    setCoinFallback(null);
    const resolved = resolveBirthDate(form);
    if (!resolved.date) {
      setFormError(resolved.error);
      return;
    }
    const city = TURKISH_CITIES[form.cityIndex!];
    setChart(calculateBirthChart({ date: resolved.date, latitude: city.latitude, longitude: city.longitude }));
  }, [form]);

  const reset = useCallback(() => {
    setChart(null);
    setAiReading(null);
    setAiError(null);
    setCoinFallback(null);
  }, []);

  const handleGetDetailedReading = useCallback(async () => {
    if (!chart || loadingAi) return;
    setAiError(null);
    setCoinFallback(null);

    const spent = await spendCoins(15);
    if (!spent) {
      setCoinFallback({ coins: await getCoins() });
      return;
    }

    setLoadingAi(true);
    try {
      const reading = await interpretBirthChart(
        ZODIAC_INFO[chart.sunSign].name,
        ZODIAC_INFO[chart.moonSign].name,
        ZODIAC_INFO[chart.risingSign].name,
      );
      setAiReading(reading);
    } catch (err) {
      await addCoins(15);
      const base = err instanceof Error ? err.message : 'Analiz alınırken bir sorun oluştu. Lütfen tekrar deneyin.';
      setAiError(`${base} (15 coin iade edildi.)`);
    } finally {
      setLoadingAi(false);
    }
  }, [chart, loadingAi]);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!chart && (
            <View style={styles.formWrap}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="flash-outline" size={36} color={GOLD} />
              </View>
              <Text style={styles.instruction}>
                Doğum tarihini, saatini ve yerini gir; Güneş, Ay ve Yükselen burcunu ücretsiz hesaplayalım.
              </Text>
              <Text style={styles.hint}>
                Kişisel bir yorum istiyorsan Doğum Haritası bölümüne bakabilirsin.
              </Text>

              <BirthDataForm value={form} onChange={setForm} />

              {formError && <Text style={styles.formErrorText}>{formError}</Text>}

              <Pressable onPress={calculate} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <Ionicons name="flash" size={18} color={NIGHT_CARD} />
                <Text style={styles.actionButtonText}>Burçlarımı Hesapla</Text>
              </Pressable>
            </View>
          )}

          {chart && (
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

              {/* YETERSİZ COIN KUTUSU */}
              {coinFallback && (
                <CoinFallbackBox
                  cost={15}
                  coins={coinFallback.coins}
                  onContinue={handleGetDetailedReading}
                  onBuyCoins={() => navigation.navigate('CoinShop')}
                  onDismiss={() => setCoinFallback(null)}
                  dismissLabel="Kapat"
                />
              )}

              {/* HATA MESAJI */}
              {aiError && <Text style={styles.formErrorText}>{aiError}</Text>}

              {/* YAPAY ZEKA RAPORU */}
              {aiReading ? (
                <View style={styles.readingCard}>
                  <CornerTicks />
                  <View style={styles.readingCardHeader}>
                    <MaterialCommunityIcons name="star-crescent" size={22} color={GOLD} />
                    <Text style={styles.readingCardTitle}>BÜYÜK ÜÇLÜ DETAYLI ANALİZİ</Text>
                  </View>

                  <Text style={styles.readingCardText}>{aiReading}</Text>

                  <View style={styles.readingCardActions}>
                    <ShareButton text={aiReading} label="Yorumu Paylaş" />
                  </View>
                </View>
              ) : (
                /* DETAYLI YORUM BUTONU (15 COIN) */
                <Pressable
                  onPress={handleGetDetailedReading}
                  disabled={loadingAi}
                  style={({ pressed }) => [
                    styles.actionButton,
                    loadingAi && { opacity: 0.7 },
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
                  <Text style={styles.actionButtonText}>
                    {loadingAi ? 'Detaylı Analiz Yapılıyor...' : 'Detaylı Yorum Al (15 Coin)'}
                  </Text>
                </Pressable>
              )}

              {/* DOĞUM HARİTASINA GEÇİŞ VE YENİ HESAPLAMA */}
              <Pressable
                onPress={() => navigation.navigate('BirthChart')}
                style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.actionButtonPressed]}
              >
                <MaterialCommunityIcons name="compass-rose" size={16} color={GOLD} />
                <Text style={styles.actionButtonSecondaryText}>Tam Doğum Haritasına Git</Text>
              </Pressable>

              <Pressable onPress={reset} style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.actionButtonPressed]}>
                <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
                <Text style={[styles.actionButtonSecondaryText, { color: GOLD_SOFT }]}>Yeni Hesaplama</Text>
              </Pressable>
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
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
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
    marginTop: 12,
  },
  actionButtonSecondaryText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: GOLD,
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
  readingCard: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 32, 0.92)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    padding: 18,
    gap: 12,
    marginTop: 6,
  },
  readingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 201, 60, 0.2)',
    paddingBottom: 10,
  },
  readingCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  readingCardText: {
    fontSize: 15.5,
    lineHeight: 25,
    color: TEXT_PRIMARY,
  },
  readingCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
});
