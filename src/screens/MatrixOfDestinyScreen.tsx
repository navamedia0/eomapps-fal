import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { calculateDestinyMatrix, type DestinyMatrix } from '@/services/destinyMatrixEngine';
import { interpretDestinyMatrix } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MatrixOfDestiny'>;

export default function MatrixOfDestinyScreen({ navigation }: Props) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [matrix, setMatrix] = useState<DestinyMatrix | null>(null);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1920 || y > 2030) {
      setError('Lütfen geçerli bir gün (1-31), ay (1-12) ve yıl (1920-2030) giriniz.');
      return;
    }
    setError(null);
    const calculated = calculateDestinyMatrix(d, m, y);
    setMatrix(calculated);
    setResult(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!matrix) return;
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
      const reading = await interpretDestinyMatrix(matrix, targetMode);
      setResult(reading);
    } catch (err) {
      setError('Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="octagram-outline" size={44} color={GOLD} />
          <Text style={styles.title}>Kader Matrisi</Text>
          <Text style={styles.subtitle}>22 Arkana ve Pisagor Geometrisi ile Ruhunun Kadersel Haritası</Text>
        </View>

        {!matrix ? (
          <View style={styles.inputCard}>
            <Text style={styles.inputTitle}>Doğum Tarihini Girin</Text>
            <View style={styles.dateRow}>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Gün</Text>
                <TextInput
                  value={day}
                  onChangeText={setDay}
                  placeholder="GG"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Ay</Text>
                <TextInput
                  value={month}
                  onChangeText={setMonth}
                  placeholder="AA"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Yıl</Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="YYYY"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  maxLength={4}
                  style={styles.input}
                />
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable onPress={handleCalculate} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="compass-outline" size={20} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Kader Haritamı Çıkar</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.matrixWrap}>
            {/* Matris Düğümleri */}
            <View style={styles.nodesGrid}>
              <View style={[styles.nodeCard, styles.nodeCardHighlight]}>
                <Text style={styles.nodeLabel}>✨ 1. Ruh Kimliği (Kişilik)</Text>
                <Text style={styles.nodeArcana}>{matrix.dayArcana.id}. {matrix.dayArcana.name}</Text>
                <Text style={styles.nodeDesc}>{matrix.dayArcana.general}</Text>
              </View>

              <View style={styles.nodeCard}>
                <Text style={styles.nodeLabel}>💖 Aşk & Ruh Eşi Kapısı</Text>
                <Text style={styles.nodeArcana}>{matrix.loveArcana.id}. {matrix.loveArcana.name}</Text>
                <Text style={styles.nodeDesc}>{matrix.loveArcana.love}</Text>
              </View>

              <View style={styles.nodeCard}>
                <Text style={styles.nodeLabel}>💰 Zenginlik & Para Kanalı</Text>
                <Text style={styles.nodeArcana}>{matrix.moneyArcana.id}. {matrix.moneyArcana.name}</Text>
                <Text style={styles.nodeDesc}>{matrix.moneyArcana.money}</Text>
              </View>

              <View style={[styles.nodeCard, styles.nodeCardKarma]}>
                <Text style={styles.nodeLabel}>🗝️ Karmik Kuyruk (Geçmiş Borç)</Text>
                <Text style={styles.nodeArcana}>{matrix.bottomArcana.id}. {matrix.bottomArcana.name}</Text>
                <Text style={styles.nodeDesc}>{matrix.bottomArcana.shadow}</Text>
              </View>
            </View>

            {/* Analiz Modu Seçimi */}
            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Yapay Zeka Analiz Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Analiz</Text>
                    <Text style={styles.modeCardDesc}>Ruh kimliği ve genel özet (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu tüm akslar & karmik borçlar (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Derin Raporu Çözümle (20 Coin)' : 'Matrisi Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="octagram" size={36} color={GOLD} />
                <Text style={styles.loadingText}>22 Arkana sekizgen enerji hatları hesaplanıyor...</Text>
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
                  <Text style={styles.badgeText}>Kader Matrisi Analiz Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Kader Matrisi Raporum\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={() => setMatrix(null)} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Farklı Bir Doğum Tarihi Hesapla</Text>
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
  },
  subtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  inputCard: {
    width: '100%',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  inputTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(15, 8, 35, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    textAlign: 'center',
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
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
  matrixWrap: {
    width: '100%',
    gap: 16,
  },
  nodesGrid: {
    gap: 12,
  },
  nodeCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  nodeCardHighlight: {
    borderColor: GOLD,
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
  },
  nodeCardKarma: {
    borderColor: 'rgba(224, 138, 138, 0.4)',
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  nodeArcana: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  nodeDesc: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 17,
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
  errorText: {
    fontSize: 12,
    color: '#E08A8A',
    textAlign: 'center',
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
