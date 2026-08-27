import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import leadData from '@/data/kursun_dokme_sembolleri.json';
import { interpretLeadReading } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'KursunDokme'>;

export default function KursunDokmeScreen({ navigation }: Props) {
  const [step, setStep] = useState<'intro' | 'melting' | 'poured' | 'result'>('intro');
  const [pouredShapes, setPouredShapes] = useState<Array<{ name: string; meaning: string; relief: string }>>([]);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flameAnim = useRef(new Animated.Value(0)).current;
  const splashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'melting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(flameAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
      ).start();

      const timer = setTimeout(() => {
        // Kurşun suya dökülür ve rastgele 2-3 şekil oluşur
        const pool = [...leadData.shapes];
        const count = 3;
        const picked: Array<{ name: string; meaning: string; relief: string }> = [];
        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          picked.push(pool.splice(idx, 1)[0]);
        }
        setPouredShapes(picked);
        setStep('poured');
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [step, flameAnim]);

  const handleStartMelting = () => {
    setStep('melting');
    setError(null);
    setResult(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (pouredShapes.length === 0) return;
    setLoading(true);
    setError(null);
    setCoinFallback(null);

    const cost = targetMode === 'deep' ? DEEP_IMAGE_READING_COIN_COST : READING_COIN_COST;
    const spent = await spendCoins(cost);
    if (!spent) {
      setCoinFallback({ coins: await getCoins(), cost });
      setLoading(false);
      return;
    }

    try {
      const reading = await interpretLeadReading(pouredShapes, targetMode);
      setResult(reading);
      setStep('result');
    } catch {
      setError('Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="water-opacity" size={40} color={GOLD} />
          <Text style={styles.title}>Kurşun Dökme & Nazar Şifası</Text>
          <Text style={styles.subtitle}>Anadolu'nun Kadim Arınma Ritüeli ile Ağırlıklardan Kurtul</Text>
        </View>

        {step === 'intro' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Niyetini Tut ve Kurşunu Erit</Text>
            <Text style={styles.cardDesc}>
              Üzerindeki nazar, ağırlık, iç sıkıntısı veya kısmet tıkanıklığı için niyetini tut. Kurşun ateşte eriyecek ve soğuk suyla buluştuğunda tüm negatif enerjiyi üzerine çekip şekillere dökecektir.
            </Text>

            <Pressable onPress={handleStartMelting} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="fire" size={22} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Cezveyi Ateşe Koy & Başlat</Text>
            </Pressable>
          </View>
        )}

        {step === 'melting' && (
          <View style={styles.ritualBox}>
            <Animated.View
              style={{
                transform: [
                  {
                    scale: flameAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.15] }),
                  },
                ],
              }}
            >
              <MaterialCommunityIcons name="fire" size={64} color="#FF9800" />
            </Animated.View>
            <Text style={styles.ritualStatus}>Kurşun kor ateşte eriyor...</Text>
            <Text style={styles.ritualHint}>İçinden 3 İhlas 1 Fatiha oku veya niyetini tekrarla.</Text>
          </View>
        )}

        {(step === 'poured' || step === 'result') && (
          <View style={styles.pouredWrap}>
            <Text style={styles.pouredTitle}>🌊 Suya Dökülen Kurşunun Şekilleri</Text>

            <View style={styles.shapesGrid}>
              {pouredShapes.map((shape, i) => (
                <View key={i} style={styles.shapeCard}>
                  <View style={styles.shapeHeader}>
                    <MaterialCommunityIcons name="shield-star-outline" size={18} color={GOLD} />
                    <Text style={styles.shapeName}>{shape.name}</Text>
                  </View>
                  <Text style={styles.shapeMeaning}>{shape.meaning}</Text>
                  <Text style={styles.shapeRelief}>✨ {shape.relief}</Text>
                </View>
              ))}
            </View>

            {step === 'poured' && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Yorum Seviyesini Seç:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Nazar ve ferahlık özeti (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu şifa ve kilit çözümü (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Şifa Raporunu Çözümle (20 Coin)' : 'Kurşunu Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="water-sync" size={36} color={GOLD} />
                <Text style={styles.loadingText}>Kurşun kristalleri ve nazar kırılımları inceleniyor...</Text>
              </View>
            )}

            {coinFallback && (
              <CoinFallbackBox
                cost={coinFallback.cost}
                coins={coinFallback.coins}
                onContinue={() => handleInterpret(selectedMode)}
                onBuyCoins={() => navigation.navigate('CoinShop')}
                onDismiss={() => setCoinFallback(null)}
              />
            )}

            {result && (
              <View style={styles.resultCard}>
                <View style={styles.badgeRow}>
                  <MaterialCommunityIcons name="crown" size={16} color={GOLD} />
                  <Text style={styles.badgeText}>Kurşun Dökme & Arınma Yorumu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Kurşun Dökme Falım\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={() => setStep('intro')} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Kurşun Dök</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  btnDeep: {
    backgroundColor: '#F5C862',
  },
  btnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  ritualBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  ritualStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  ritualHint: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  pouredWrap: {
    width: '100%',
    gap: 16,
  },
  pouredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  shapesGrid: {
    gap: 10,
  },
  shapeCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  shapeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shapeName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  shapeMeaning: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  shapeRelief: {
    fontSize: 12,
    color: GOLD_SOFT,
    fontWeight: '600',
  },
  modeSection: {
    gap: 10,
    marginTop: 6,
  },
  modeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 52, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  modeCardActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
  },
  modeCardDeep: {
    backgroundColor: 'rgba(35, 20, 70, 0.85)',
  },
  modeCardDeepActive: {
    borderColor: '#F5C862',
    backgroundColor: 'rgba(245, 200, 98, 0.16)',
  },
  modeCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modeCardDesc: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    lineHeight: 14,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: GOLD_SOFT,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  resetBtnText: {
    fontSize: 12.5,
    color: GOLD_SOFT,
  },
});
