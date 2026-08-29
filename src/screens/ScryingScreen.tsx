import { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReelRevealFX from '@/components/effects/ReelRevealFX';
import SparkleBurst from '@/components/effects/SparkleBurst';
import ReadingCardStack from '@/components/ReadingCardStack';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import visionData from '@/data/kara_ayna_vizyonlari.json';
import { gazeIntoMirror, type ScryingVision } from '@/services/scryingEngine';
import { interpretScryingReading } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ScryingReading'>;

const VISION_SPIN_POOL = visionData.visions.map((v) => v.symbol);

export default function ScryingScreen({ navigation }: Props) {
  const [focusText, setFocusText] = useState('');
  const [vision, setVision] = useState<ScryingVision | null>(null);
  const [visionSettled, setVisionSettled] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);
  const castKey = useRef(0);

  const mirrorGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mirrorGlow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(mirrorGlow, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [mirrorGlow]);

  const handleGaze = () => {
    castKey.current += 1;
    setVisionSettled(false);
    setVision(gazeIntoMirror());
    setResult(null);
    setError(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!vision) return;
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
      const interp = await interpretScryingReading(vision, focusText.trim(), targetMode);
      setResult(interp);
    } catch {
      await addCoins(cost);
      setError(`Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin. (${cost} coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = mirrorGlow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="mirror" size={42} color={GOLD} />
          <Text style={styles.title}>Kara Ayna & Kristal Durugörü</Text>
          <Text style={styles.subtitle}>Bilinçaltının Gizemli Aynası (Scrying) ile Sezgisel Vizyon</Text>
        </View>

        {/* Kara Ayna Görsel Meditasyon Kutusu */}
        <View style={styles.mirrorContainer}>
          <Animated.View style={[styles.mirrorGlowRing, { opacity: glowOpacity }]} />
          <View style={styles.blackMirror} key={castKey.current}>
            {!vision ? (
              <>
                <MaterialCommunityIcons name="eye-circle-outline" size={48} color="rgba(242, 200, 121, 0.4)" />
                <Text style={styles.mirrorHint}>Aynanın derinliğine odaklan ve zihnini boşalt...</Text>
              </>
            ) : (
              <>
                <SparkleBurst active={visionSettled} color={GOLD} count={10} radius={54} />
                <ReelRevealFX
                  finalSymbol={vision.symbol}
                  spinPool={VISION_SPIN_POOL}
                  delay={0}
                  glowColor={GOLD}
                  onSettled={() => setVisionSettled(true)}
                  renderSymbol={(symbol, isSettled) => (
                    <MaterialCommunityIcons
                      name={isSettled ? 'eye' : 'eye-circle-outline'}
                      size={40}
                      color={isSettled ? GOLD : 'rgba(242, 200, 121, 0.5)'}
                    />
                  )}
                />
                <Text style={styles.mirrorVisionText}>{vision.symbol}</Text>
                {visionSettled && <Text style={styles.mirrorClarityText}>{vision.clarityLabel}</Text>}
              </>
            )}
          </View>
        </View>

        {!vision ? (
          <View style={styles.inputCard}>
            <Text style={styles.inputTitle}>Zihnine Doğan Hissi veya Sorunu Yaz (İsteğe Bağlı)</Text>
            <TextInput
              value={focusText}
              onChangeText={setFocusText}
              placeholder="Örn: İçimde sebebini bilmediğim bir his var / Birinin niyetini görmek istiyorum..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />

            <Pressable onPress={handleGaze} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="eye-outline" size={20} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Aynaya Odaklan ve Vizyonu Gör</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resultWrap}>
            {visionSettled && vision.meaning && (
              <View style={styles.visionMeaningCard}>
                <Text style={styles.visionMeaningText}>🔮 İlk Sezgi: {vision.meaning}</Text>
              </View>
            )}

            <Pressable onPress={handleGaze} style={styles.resetBtnTop}>
              <Ionicons name="refresh" size={15} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Aynaya Odaklan</Text>
            </Pressable>

            {visionSettled && !result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Durugörü Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Sezgi</Text>
                    <Text style={styles.modeCardDesc}>Ayna vizyonu özeti (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu durugörü analizi (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Aynayı Çözümle (20 Coin)' : 'Vizyonu Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="eye-outline" size={36} color={GOLD} />
                <Text style={styles.loadingText}>Bilinçaltı vizyonları ve kadersel semboller okunuyor...</Text>
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
                  <Text style={styles.badgeText}>Kara Ayna Durugörü Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Kara Ayna Durugörü Yorumum\n\n${result}`} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {vision && result && resultSections && (
        <ReadingCardStack
          badge="Kara Ayna Durugörü Raporu"
          sections={resultSections}
          shareTextPrefix="Mistik Rehber - Kara Ayna Durugörü Yorumum"
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
  mirrorContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  mirrorGlowRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  blackMirror: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#0A0518',
    borderWidth: 2,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  mirrorHint: {
    fontSize: 10,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  mirrorVisionText: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  mirrorClarityText: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  visionMeaningCard: {
    width: '100%',
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    borderRadius: 14,
    padding: 14,
  },
  visionMeaningText: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  inputCard: {
    width: '100%',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: 'rgba(15, 8, 35, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    borderRadius: 14,
    padding: 12,
    color: TEXT_PRIMARY,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modeSection: {
    gap: 10,
    marginTop: 4,
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
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
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 12.5,
    color: GOLD_SOFT,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultWrap: {
    width: '100%',
    gap: 14,
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
    fontWeight: '600',
  },
});
