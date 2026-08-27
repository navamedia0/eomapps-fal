import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import waxData from '@/data/balmumu_fali_sembolleri.json';
import { interpretWaxReading } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'WaxReading'>;

export default function WaxReadingScreen({ navigation }: Props) {
  const [flameSignal, setFlameSignal] = useState<string | null>(null);
  const [waxShapes, setWaxShapes] = useState<Array<{ name: string; meaning: string; focus: string }>>([]);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDripWax = () => {
    const randomFlame = waxData.flameSignals[Math.floor(Math.random() * waxData.flameSignals.length)];
    setFlameSignal(`${randomFlame.type} (${randomFlame.meaning})`);

    const pool = [...waxData.waxShapes];
    const picked: Array<{ name: string; meaning: string; focus: string }> = [];
    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    setWaxShapes(picked);
    setResult(null);
    setError(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!flameSignal || waxShapes.length === 0) return;
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
      const interp = await interpretWaxReading(flameSignal, waxShapes, targetMode);
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
          <MaterialCommunityIcons name="candle" size={42} color={GOLD} />
          <Text style={styles.title}>Mum & Balmumu Falı (Keromansi)</Text>
          <Text style={styles.subtitle}>Alevin Dansı ve Suya Damlayan Balmumunun Aşk Sırları</Text>
        </View>

        {waxShapes.length === 0 ? (
          <View style={styles.setupCard}>
            <Text style={styles.cardTitle}>Aşk veya Gönül Niyetini Tut</Text>
            <Text style={styles.cardDesc}>
              Özellikle aşk, evlilik, sevdiğin kişinin duyguları veya kilitlenmiş bir ilişki konusu için niyetini odakla. Yanan balmumu damlacıkları suya düşerek şekil alacaktır.
            </Text>

            <Pressable onPress={handleDripWax} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="candle" size={22} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Mumu Yak & Suya Damlat</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.waxWrap}>
            {flameSignal && (
              <View style={styles.flameBox}>
                <MaterialCommunityIcons name="fire" size={20} color="#FF9800" />
                <Text style={styles.flameText}>{flameSignal}</Text>
              </View>
            )}

            <View style={styles.shapesList}>
              {waxShapes.map((shape, i) => (
                <View key={i} style={styles.shapeCard}>
                  <View style={styles.shapeHeader}>
                    <MaterialCommunityIcons name="heart-pulse" size={18} color={GOLD} />
                    <Text style={styles.shapeName}>{shape.name}</Text>
                    <Text style={styles.shapeFocus}>[{shape.focus}]</Text>
                  </View>
                  <Text style={styles.shapeMeaning}>{shape.meaning}</Text>
                </View>
              ))}
            </View>

            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Balmumu Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Aşk ve niyet özeti (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu kadersel bağ analizi (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Aşk Raporunu Al (20 Coin)' : 'Balmumunu Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="candle" size={36} color={GOLD} />
                <Text style={styles.loadingText}>Balmumu silüetleri ve kadersel aşk bağları inceleniyor...</Text>
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
                  <Text style={styles.badgeText}>Balmumu Falı & Aşk Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Balmumu Falım\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={handleDripWax} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Balmumu Damlat</Text>
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
  waxWrap: {
    width: '100%',
    gap: 14,
  },
  flameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  flameText: {
    fontSize: 12.5,
    color: GOLD_SOFT,
    fontWeight: '600',
    flex: 1,
  },
  shapesList: {
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
  shapeFocus: {
    fontSize: 11,
    color: GOLD_SOFT,
    fontWeight: '600',
  },
  shapeMeaning: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 18,
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
