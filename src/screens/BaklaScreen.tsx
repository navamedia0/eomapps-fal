import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { cast41Beans, type BaklaReading } from '@/services/baklaEngine';
import { interpretBaklaReading } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BaklaReading'>;

export default function BaklaScreen({ navigation }: Props) {
  const [reading, setReading] = useState<BaklaReading | null>(null);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCastBeans = () => {
    const res = cast41Beans();
    setReading(res);
    setResult(null);
    setError(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!reading) return;
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
      const interp = await interpretBaklaReading(reading, targetMode);
      setResult(interp);
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
          <MaterialCommunityIcons name="dots-hexagon" size={42} color={GOLD} />
          <Text style={styles.title}>41 Bakla Falı</Text>
          <Text style={styles.subtitle}>Osmanlı ve Anadolu Remil Geleneği ile 3 Ocak Kehaneti</Text>
        </View>

        {!reading ? (
          <View style={styles.setupCard}>
            <Text style={styles.cardTitle}>Niyetini Tut ve 41 Baklayı Dağıt</Text>
            <Text style={styles.cardDesc}>
              41 adet kutsal bakla; Hane Ocağı (iç dünya), Kalp Ocağı (aşk/sevda) ve Yol Ocağı (kısmet/iş) olmak üzere 3 meclise ayrılır. Çift ve tek dengesi kadersel gidişatı belirler.
            </Text>

            <Pressable onPress={handleCastBeans} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="hand-back-right" size={22} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Baklaları Ocaklara Saç</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.beansWrap}>
            <View style={styles.ocaklarRow}>
              {reading.ocaklar.map((ocak, idx) => (
                <View key={idx} style={styles.ocakCard}>
                  <Text style={styles.ocakName}>{ocak.name}</Text>
                  <View style={styles.beansHeapVisual}>
                    <Text style={styles.beansCountText}>{ocak.count}</Text>
                    <Text style={styles.beansLabel}>Bakla</Text>
                  </View>
                  <View style={[styles.ocakStatusBadge, ocak.isEven ? styles.badgeEven : styles.badgeOdd]}>
                    <Text style={styles.ocakStatusText}>{ocak.isEven ? 'ÇİFT (Denge & Açık)' : 'TEK (Hareket & Niyet)'}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.patternCard}>
              <Text style={styles.patternTitle}>🌿 Remil Deseni: {reading.patternName}</Text>
              <Text style={styles.patternMeaning}>{reading.meaning}</Text>
              <Text style={styles.patternOutcome}>✨ Müjde: {reading.outcome}</Text>
            </View>

            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Bakla Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>3 Ocak özeti ve müjde (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu remil & hane analizi (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Bakla Raporunu Al (20 Coin)' : 'Baklaları Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="dots-hexagon" size={36} color={GOLD} />
                <Text style={styles.loadingText}>41 Bakla dizilimi ve ocak düğümleri çözümleniyor...</Text>
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
                  <Text style={styles.badgeText}>41 Bakla Remil Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - 41 Bakla Falım\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={handleCastBeans} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Bakla Dağıt</Text>
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
  setupCard: {
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
  beansWrap: {
    width: '100%',
    gap: 16,
  },
  ocaklarRow: {
    gap: 10,
  },
  ocakCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  ocakName: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  beansHeapVisual: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  beansCountText: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  beansLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  ocakStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeEven: {
    backgroundColor: 'rgba(76, 175, 80, 0.18)',
  },
  badgeOdd: {
    backgroundColor: 'rgba(255, 152, 0, 0.18)',
  },
  ocakStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  patternCard: {
    backgroundColor: 'rgba(35, 20, 70, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
  },
  patternMeaning: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  patternOutcome: {
    fontSize: 12,
    color: '#F5C862',
    fontWeight: '700',
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
