import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReelRevealFX from '@/components/effects/ReelRevealFX';
import SparkleBurst from '@/components/effects/SparkleBurst';
import ReadingCardStack from '@/components/ReadingCardStack';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import { cast41Beans, type BaklaOcak, type BaklaReading } from '@/services/baklaEngine';
import { interpretBaklaReading } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { saveReadingHistory } from '@/services/readingHistory';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BaklaReading'>;

// 41 baklanın tek ocakta gerçekçi şekilde alabileceği aralık (9-17) — sayı
// "sayılırken" bu havuzdan rastgele değerler yanıp söner, gerçek bir bakla
// dökümü izlenimi verir.
const COUNT_SPIN_POOL = Array.from({ length: 17 }, (_, i) => String(i + 1));

const OCAK_META: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; accent: string }> = {
  hane: { icon: 'home-heart', accent: '#8BC24A' },
  kalp: { icon: 'heart', accent: '#E08A8A' },
  yol: { icon: 'road-variant', accent: '#6FD8E8' },
};

function BaklaOcakCard({ ocak, delay, onSettled }: { ocak: BaklaOcak; delay: number; onSettled: () => void }) {
  const [settled, setSettled] = useState(false);
  const meta = OCAK_META[ocak.key] ?? { icon: 'circle-outline' as const, accent: GOLD };

  return (
    <View style={styles.ocakCard}>
      <View style={styles.ocakHeaderRow}>
        <MaterialCommunityIcons name={meta.icon} size={16} color={meta.accent} />
        <Text style={styles.ocakName}>{ocak.name}</Text>
      </View>

      <View style={styles.reelStage}>
        <SparkleBurst active={settled} color={meta.accent} count={8} radius={34} />
        <ReelRevealFX
          finalSymbol={String(ocak.count)}
          spinPool={COUNT_SPIN_POOL}
          delay={delay}
          glowColor={meta.accent}
          onSettled={() => {
            setSettled(true);
            onSettled();
          }}
          renderSymbol={(symbol, isSettled) => (
            <View style={styles.beansHeapVisual}>
              <Text style={[styles.beansCountText, isSettled && { color: meta.accent }]}>{symbol}</Text>
              <Text style={styles.beansLabel}>Bakla</Text>
            </View>
          )}
        />
      </View>

      <View style={[styles.ocakStatusBadge, !settled && styles.ocakStatusBadgeHidden, ocak.isEven ? styles.badgeEven : styles.badgeOdd]}>
        <Text style={styles.ocakStatusText}>{ocak.isEven ? 'ÇİFT (Denge & Açık)' : 'TEK (Hareket & Niyet)'}</Text>
      </View>
    </View>
  );
}

export default function BaklaScreen({ navigation }: Props) {
  const [reading, setReading] = useState<BaklaReading | null>(null);
  const [settledCount, setSettledCount] = useState(0);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);
  const castKey = useRef(0);

  const allSettled = reading !== null && settledCount >= reading.ocaklar.length;

  const handleCastBeans = () => {
    castKey.current += 1;
    const res = cast41Beans();
    setReading(res);
    setSettledCount(0);
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
      await saveReadingHistory({
        type: 'bakla',
        title: '41 Bakla Remil Falı',
        result: interp,
      });
    } catch {
      await addCoins(cost);
      setError(`Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin. (${cost} coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReading(null);
    setSettledCount(0);
    setResult(null);
    setError(null);
    setCoinFallback(null);
  };

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.bakla.background}>
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
                <BaklaOcakCard
                  key={`${castKey.current}-${ocak.key}`}
                  ocak={ocak}
                  delay={idx * 220}
                  onSettled={() => setSettledCount((c) => c + 1)}
                />
              ))}
            </View>

            {/* Baklalar sayılır sayılmaz erişilebilir — sonuca kadar aşağı
                kaydırmaya gerek kalmadan hemen yeniden dağıtılabilir. */}
            <Pressable onPress={handleCastBeans} style={styles.resetBtnTop}>
              <Ionicons name="refresh" size={15} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Bakla Dağıt</Text>
            </Pressable>

            {allSettled && (
              <View style={styles.patternCard}>
                <Text style={styles.patternTitle}>🌿 Remil Deseni: {reading.patternName}</Text>
                <Text style={styles.patternMeaning}>{reading.meaning}</Text>
                <Text style={styles.patternOutcome}>✨ Müjde: {reading.outcome}</Text>
              </View>
            )}

            {allSettled && !result && !loading && (
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

            {result && !resultSections && (
              <View style={styles.resultCard}>
                <View style={styles.badgeRow}>
                  <MaterialCommunityIcons name="crown" size={16} color={GOLD} />
                  <Text style={styles.badgeText}>41 Bakla Remil Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - 41 Bakla Falım\n\n${result}`} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {reading && result && resultSections ? (
        <ParchmentReadingResult
          visible={true}
          badge="41 Bakla Remil Raporu"
          sections={resultSections}
          shareTextPrefix="Mistik Rehber - 41 Bakla Falım"
          parchmentBg={FORTUNE_THEMES.bakla.resultBg}
          accentColor={FORTUNE_THEMES.bakla.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={handleReset}
        />
      ) : null}
      {FORTUNE_THEMES.bakla.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.bakla.figure}
          title={FORTUNE_THEMES.bakla.splashTitle}
          subtitle={FORTUNE_THEMES.bakla.splashSubtitle}
          accentColor={FORTUNE_THEMES.bakla.accentColor}
          onFinish={() => setShowSplash(false)}
        />
      )}
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
    backgroundColor: 'rgba(18, 18, 24, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.45)',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDeep: {
    backgroundColor: '#F5C862',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#000000',
  },
  beansWrap: {
    width: '100%',
    gap: 16,
  },
  ocaklarRow: {
    gap: 10,
  },
  ocakCard: {
    backgroundColor: 'rgba(18, 18, 24, 0.90)',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.35)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  ocakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ocakName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: GOLD,
  },
  reelStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
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
    color: '#FFFFFF',
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
  ocakStatusBadgeHidden: {
    opacity: 0,
  },
  badgeEven: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  badgeOdd: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  ocakStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resetBtnTop: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.45)',
    backgroundColor: 'rgba(18, 18, 24, 0.90)',
  },
  resetBtnText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  patternCard: {
    backgroundColor: 'rgba(35, 20, 70, 0.90)',
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
    color: '#E4E4E7',
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
    fontWeight: '800',
    color: GOLD,
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 24, 0.90)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  modeCardActive: {
    borderColor: GOLD,
    backgroundColor: '#201A10',
  },
  modeCardDeep: {
    backgroundColor: 'rgba(35, 20, 70, 0.90)',
    borderColor: 'rgba(192, 132, 252, 0.35)',
  },
  modeCardDeepActive: {
    borderColor: '#C084FC',
    backgroundColor: '#25173B',
  },
  modeCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeCardDesc: {
    fontSize: 10.5,
    color: '#A1A1AA',
    lineHeight: 14,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: GOLD,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(18, 18, 24, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.45)',
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
});
