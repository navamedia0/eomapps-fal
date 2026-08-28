import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { analyzeAuraEnergy, type AuraAnalysis } from '@/services/auraEngine';
import { interpretAuraReading } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AuraEnergy'>;

function DominantAuraReveal({ aura }: { aura: AuraAnalysis }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = {
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
  };

  return (
    <Animated.View style={[styles.dominantAuraCard, { borderColor: aura.dominantAuraColor }, animatedStyle]}>
      <View style={[styles.auraCircle, { backgroundColor: aura.dominantAuraColor }]} />
      <Text style={styles.dominantAuraTitle}>{aura.dominantAuraName}</Text>
      <Text style={styles.frequencyBadge}>⚡ Titreşim Frekansı: {aura.vibrationFrequency} Hz</Text>
      <Text style={styles.auraDesc}>{aura.auraDescription}</Text>
    </Animated.View>
  );
}

function ChakraBarRow({ chakra, delay }: { chakra: AuraAnalysis['chakras'][number]; delay: number }) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, { toValue: 1, duration: 700, delay, useNativeDriver: false }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.chakraRow}>
      <View style={styles.chakraLeft}>
        <Text style={styles.chakraName}>{chakra.name}</Text>
        <Text style={styles.chakraCrystal}>💎 {chakra.crystal}</Text>
      </View>
      <View style={styles.chakraBarContainer}>
        <Animated.View
          style={[
            styles.chakraBarFill,
            { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${chakra.percentage}%`] }), backgroundColor: chakra.colorHex },
          ]}
        />
      </View>
      <Text style={styles.chakraPercent}>%{chakra.percentage}</Text>
    </View>
  );
}

// Halkanın gerçek çevresine göre dolum oranı — parmağın ekranda kalış
// süresine göre ilerler, tıpkı gerçek bir parmak izi sensörü gibi.
const RING_SIZE = 132;
const RING_STROKE = 7;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const HOLD_DURATION_MS = 2600;
const TICK_MS = 40;

export default function AuraEnergyScreen({ navigation }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [aura, setAura] = useState<AuraAnalysis | null>(null);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanPulse = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const scanTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearScanTimer = () => {
    if (scanTimer.current) {
      clearInterval(scanTimer.current);
      scanTimer.current = null;
    }
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    scanPulse.setValue(1);
  };

  useEffect(() => () => {
    clearScanTimer();
    stopPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parmağın dokunmatik alanda kalış süresi kadar ilerleyen gerçek bir
  // "basılı tut" etkileşimi — tek dokunuşla anında sonuca geçen eski
  // davranışın yerini aldı. Erken çekilirse tarama sıfırlanır, tıpkı gerçek
  // bir parmak izi sensöründe olduğu gibi.
  const handlePressIn = () => {
    if (scanTimer.current) return;
    setScanning(true);
    setError(null);
    setResult(null);

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 1.12, duration: 320, useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();

    const step = 100 / (HOLD_DURATION_MS / TICK_MS);
    scanTimer.current = setInterval(() => {
      setScanProgress((prev) => {
        const next = Math.min(100, prev + step);
        if (next >= 100) {
          clearScanTimer();
          stopPulse();
          setScanning(false);
          const analyzed = analyzeAuraEnergy(Date.now());
          setAura(analyzed);
        }
        return next;
      });
    }, TICK_MS);
  };

  const handlePressOut = () => {
    // %100'e ulaşmadan parmak çekilirse temas kesilmiş sayılır ve tarama
    // baştan başlamak zorunda kalır.
    if (scanTimer.current) {
      clearScanTimer();
      stopPulse();
      setScanning(false);
      setScanProgress(0);
    }
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!aura) return;
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
      const interp = await interpretAuraReading(aura, targetMode);
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
          <MaterialCommunityIcons name="atom" size={42} color={GOLD} />
          <Text style={styles.title}>Aura & Çakra Enerji Falı</Text>
          <Text style={styles.subtitle}>Biyoenerjetik Rezonans ile 7 Çakra Dengesi ve Işıltılı Aura Haritası</Text>
        </View>

        {!aura ? (
          <View style={styles.scanCard}>
            <Text style={styles.cardTitle}>Parmağını Dokunmatik Alana Basılı Tut</Text>
            <Text style={styles.cardDesc}>
              Biyometrik frekansın taranarak 7 ana çakranın enerji seviyeleri ve auranın baskın rengi hesaplanacaktır. Parmağını halka dolana kadar kaldırma; erken çekersen tarama sıfırlanır.
            </Text>

            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.fingerprintBox}>
              <Svg width={RING_SIZE} height={RING_SIZE} style={styles.progressRing}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(242, 200, 121, 0.15)"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={scanning ? '#00E676' : GOLD}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - scanProgress / 100)}
                  rotation={-90}
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>
              <Animated.View style={{ transform: [{ scale: scanning ? scanPulse : 1 }] }}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={64}
                  color={scanning ? '#00E676' : GOLD}
                />
              </Animated.View>
              <Text style={styles.scanBtnText}>
                {scanning ? `Enerji Taranıyor... %${Math.round(scanProgress)}` : 'Basılı Tut ve Enerjini Tara'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.auraWrap}>
            {/* Baskın Aura Kartı */}
            <DominantAuraReveal aura={aura} />

            {/* Sonuca kadar aşağı kaydırmaya gerek kalmadan hemen yeniden
                taranabilir. */}
            <Pressable onPress={() => setAura(null)} style={styles.resetBtnTop}>
              <Ionicons name="refresh" size={15} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Enerji Tara</Text>
            </Pressable>

            {/* 7 Çakra Dağılımı */}
            <View style={styles.chakrasList}>
              <Text style={styles.chakrasTitle}>7 Çakra Denge Spektrumu:</Text>
              {aura.chakras.map((chakra, idx) => (
                <ChakraBarRow key={idx} chakra={chakra} delay={idx * 90} />
              ))}
            </View>

            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Aura & Çakra Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Aura ve çakra özeti (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu şifa reçetesi (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Enerji Raporunu Al (20 Coin)' : 'Aurayı Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="atom" size={36} color={GOLD} />
                <Text style={styles.loadingText}>Süptil beden ve çakra blokajları analiz ediliyor...</Text>
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
                  <Text style={styles.badgeText}>Aura & Çakra Enerji Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Aura Raporum: ${aura.dominantAuraName}\n\n${result}`} />
              </View>
            )}
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
  scanCard: {
    width: '100%',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    lineHeight: 18,
    textAlign: 'center',
  },
  fingerprintBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(15, 8, 35, 0.9)',
    borderWidth: 2,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 6,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    top: (140 - RING_SIZE) / 2,
    left: (140 - RING_SIZE) / 2,
  },
  scanBtnText: {
    fontSize: 10.5,
    color: GOLD_SOFT,
    fontWeight: '600',
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
    width: '100%',
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
  auraWrap: {
    width: '100%',
    gap: 16,
  },
  dominantAuraCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  auraCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  dominantAuraTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  frequencyBadge: {
    fontSize: 11.5,
    color: GOLD_SOFT,
    fontWeight: '700',
  },
  auraDesc: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
  chakrasList: {
    backgroundColor: 'rgba(26, 16, 52, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  chakrasTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD_SOFT,
    marginBottom: 4,
  },
  chakraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chakraLeft: {
    width: 105,
  },
  chakraName: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  chakraCrystal: {
    fontSize: 9.5,
    color: TEXT_MUTED,
  },
  chakraBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chakraBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chakraPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
    width: 32,
    textAlign: 'right',
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
  resetBtnTop: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
  },
  resetBtnText: {
    fontSize: 12.5,
    color: GOLD_SOFT,
  },
});
