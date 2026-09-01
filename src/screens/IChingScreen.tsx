import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReelRevealFX from '@/components/effects/ReelRevealFX';
import SparkleBurst from '@/components/effects/SparkleBurst';
import { tossCoins, getHexagramFromLines, getTransformedHexagram, type IChingLine, type Hexagram } from '@/services/ichingEngine';
import { interpretIChingReading } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { saveReadingHistory } from '@/services/readingHistory';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import ReadingCardStack from '@/components/ReadingCardStack';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import { GOLD, GOLD_SOFT, GOLD_DEEP, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'IChingReading'>;

const COIN_SPIN_POOL = ['Yazı', 'Tura'];

function CoinTossReveal({ line, onDone }: { line: IChingLine; onDone: () => void }) {
  const [settledCount, setSettledCount] = useState(0);
  const [barRevealed, setBarRevealed] = useState(false);
  const doneCalled = useRef(false);

  const handleCoinSettled = () => {
    setSettledCount((c) => {
      const next = c + 1;
      if (next === 3) {
        setTimeout(() => setBarRevealed(true), 150);
        setTimeout(() => {
          if (!doneCalled.current) {
            doneCalled.current = true;
            onDone();
          }
        }, 900);
      }
      return next;
    });
  };

  return (
    <View style={styles.tossRevealBox}>
      <View style={styles.coinsRow}>
        {line.coins.map((c, i) => (
          <ReelRevealFX
            key={i}
            finalSymbol={c === 3 ? 'Tura' : 'Yazı'}
            spinPool={COIN_SPIN_POOL}
            delay={i * 180}
            glowColor={GOLD}
            onSettled={handleCoinSettled}
            renderSymbol={(symbol, isSettled) => (
              <View style={styles.coinWrap}>
                <View style={[styles.coinCircle, isSettled && styles.coinCircleSettled]}>
                  <LinearGradient
                    colors={isSettled ? [GOLD, GOLD_DEEP] : ['rgba(184, 134, 46, 0.5)', 'rgba(120, 88, 30, 0.5)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {symbol === 'Tura' ? (
                    // Tura (ön yüz): kare delikli klasik Çin bronz sikkesi (方孔錢) motifi
                    <View style={styles.coinHole} />
                  ) : (
                    // Yazı (arka yüz): dairesel halka + yuvarlak delik motifi
                    <View style={styles.coinHoleRing}>
                      <View style={styles.coinHoleRound} />
                    </View>
                  )}
                </View>
                <Text style={styles.coinText}>{symbol}</Text>
              </View>
            )}
          />
        ))}
      </View>

      {barRevealed && (
        <View style={styles.revealedBarWrap}>
          <SparkleBurst active={barRevealed} color={line.isChanging ? '#F2A65A' : GOLD} />
          <View style={styles.lineVisualBig}>
            {line.isYang ? (
              <View style={[styles.yangSolid, line.isChanging && styles.lineChanging]} />
            ) : (
              <View style={styles.yinBrokenRow}>
                <View style={[styles.yinHalf, line.isChanging && styles.lineChanging]} />
                <View style={styles.yinGap} />
                <View style={[styles.yinHalf, line.isChanging && styles.lineChanging]} />
              </View>
            )}
          </View>
          <Text style={styles.revealedBarLabel}>
            {line.isYang ? 'Yang (—)' : 'Yin (- -)'} {line.isChanging ? '⚡ Değişen Çizgi' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function IChingScreen({ navigation }: Props) {
  const [lines, setLines] = useState<IChingLine[]>([]);
  const [tossingLine, setTossingLine] = useState<IChingLine | null>(null);
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [transformedHexagram, setTransformedHexagram] = useState<Hexagram | null>(null);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);

  const handleTossNextLine = () => {
    if (lines.length >= 6 || tossingLine) return;
    setTossingLine(tossCoins());
  };

  const handleTossSettled = () => {
    if (!tossingLine) return;
    const updated = [...lines, tossingLine];
    setLines(updated);
    setTossingLine(null);

    if (updated.length === 6) {
      const built = getHexagramFromLines(updated);
      setHexagram(built);
      setTransformedHexagram(getTransformedHexagram(updated));
    }
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!hexagram) return;
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
      const reading = await interpretIChingReading(hexagram, targetMode, transformedHexagram);
      setResult(reading);
      await saveReadingHistory({
        type: 'iching',
        title: `I Ching #${hexagram.number} ${hexagram.name}`,
        result: reading,
      });
    } catch {
      await addCoins(cost);
      setError(`Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin. (${cost} coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLines([]);
    setTossingLine(null);
    setHexagram(null);
    setTransformedHexagram(null);
    setResult(null);
    setError(null);
  };

  return (
    <MysticTableBackground customBackground={require('@/assets/ekoller/iching_screen_bg.jpg')}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="yin-yang" size={42} color={GOLD} />
          <Text style={styles.title}>Çin I Ching (Değişimler Kitabı)</Text>
          <Text style={styles.subtitle}>3 Kadim Bronz Sikke ile 64 Heksagram Kehaneti</Text>
        </View>

        {!hexagram ? (
          <View style={styles.tossCard}>
            <Text style={styles.tossTitle}>
              {lines.length === 0
                ? 'Sorunu veya Niyetini Düşün'
                : `${lines.length + 1}. Çizgi İçin Sikkeleri At (${lines.length}/6)`}
            </Text>
            <Text style={styles.tossDesc}>
              3000 yıllık Taoist geleneğe göre her atışta 3 bronz sikke havaya bırakılır. Yazı ve Turaların toplamı Yin veya Yang çizgisini oluşturur.
            </Text>

            {/* Mevcut Çizgiler */}
            {lines.length > 0 && (
              <View style={styles.linesStack}>
                {[...lines].reverse().map((l, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineIndex}>{6 - i}. Çizgi:</Text>
                    <View style={styles.lineVisual}>
                      {l.isYang ? (
                        <View style={styles.yangSolid} />
                      ) : (
                        <View style={styles.yinBrokenRow}>
                          <View style={styles.yinHalf} />
                          <View style={styles.yinGap} />
                          <View style={styles.yinHalf} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.lineType}>
                      {l.isYang ? 'Yang (—)' : 'Yin (- -)'} {l.isChanging ? '⚡' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {tossingLine ? (
              <CoinTossReveal line={tossingLine} onDone={handleTossSettled} />
            ) : (
              <Pressable onPress={handleTossNextLine} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
                <MaterialCommunityIcons name="circle-multiple-outline" size={22} color={NIGHT_CARD} />
                <Text style={styles.primaryBtnText}>
                  {lines.length === 0 ? 'İlk Çizgiyi At (1/6)' : `Sikkeleri Çevir (${lines.length + 1}/6)`}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.hexagramWrap}>
            <View style={styles.hexCard}>
              <Text style={styles.hexNumber}>Heksagram #{hexagram.number}</Text>
              <Text style={styles.hexName}>{hexagram.name}</Text>
              <Text style={styles.hexTrigrams}>Üst: {hexagram.upper} | Alt: {hexagram.lower}</Text>
              <View style={styles.hexDivider} />
              <Text style={styles.hexJudgment}>📜 {hexagram.judgment}</Text>
              <Text style={styles.hexWisdom}>💡 Bilgelik: {hexagram.wisdom}</Text>
            </View>

            {transformedHexagram && (
              <View style={styles.transformCard}>
                <View style={styles.transformHeader}>
                  <MaterialCommunityIcons name="autorenew" size={18} color="#F2A65A" />
                  <Text style={styles.transformTitle}>Dönüşen Gelecek Heksagramı</Text>
                </View>
                <Text style={styles.transformDesc}>
                  Değişen çizgilerin ⚡ sonucunda durum şuna evriliyor:
                </Text>
                <Text style={styles.transformHexName}>
                  #{transformedHexagram.number} — {transformedHexagram.name}
                </Text>
                <Text style={styles.transformHexJudgment}>{transformedHexagram.judgment}</Text>
              </View>
            )}

            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>I Ching Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Taoist bilgelik ve karar özeti (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu Yin/Yang dönüşüm analizi (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı I Ching Raporunu Al (20 Coin)' : 'Heksagramı Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="yin-yang" size={36} color={GOLD} />
                <Text style={styles.loadingText}>Kadim Taoist heksagram açılımı yorumlanıyor...</Text>
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
                  <Text style={styles.badgeText}>I Ching Değişimler Kitabı Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - I Ching Kehanetim\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Sikke At</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {result && resultSections ? (
        <ParchmentReadingResult
          visible={true}
          badge="I Ching Değişimler Kitabı Raporu"
          sections={resultSections}
          shareTextPrefix="Mistik Rehber - I Ching Kehanetim"
          parchmentBg={FORTUNE_THEMES.iching.resultBg}
          accentColor={FORTUNE_THEMES.iching.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={handleReset}
        />
      ) : null}
      {FORTUNE_THEMES.iching.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.iching.figure}
          title={FORTUNE_THEMES.iching.splashTitle}
          subtitle={FORTUNE_THEMES.iching.splashSubtitle}
          accentColor={FORTUNE_THEMES.iching.accentColor}
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
  tossCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 32, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  tossTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  tossDesc: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 18,
    textAlign: 'center',
  },
  linesStack: {
    gap: 8,
    backgroundColor: 'rgba(15, 8, 35, 0.75)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
  },
  tossRevealBox: {
    alignItems: 'center',
    gap: 18,
    paddingVertical: 8,
  },
  coinsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coinWrap: {
    alignItems: 'center',
    gap: 6,
  },
  coinCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCircleSettled: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  coinHole: {
    width: 15,
    height: 15,
    backgroundColor: NIGHT_DEEP,
    transform: [{ rotate: '45deg' }],
  },
  coinHoleRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: NIGHT_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinHoleRound: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NIGHT_DEEP,
  },
  coinText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  revealedBarWrap: {
    alignItems: 'center',
    gap: 8,
  },
  lineVisualBig: {
    width: 140,
    height: 14,
    justifyContent: 'center',
  },
  lineChanging: {
    backgroundColor: '#F2A65A',
  },
  revealedBarLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  transformCard: {
    width: '100%',
    backgroundColor: 'rgba(35, 20, 70, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 166, 90, 0.45)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  transformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transformTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F2A65A',
  },
  transformDesc: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  transformHexName: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 2,
  },
  transformHexJudgment: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineIndex: {
    fontSize: 11,
    color: TEXT_MUTED,
    width: 60,
  },
  lineVisual: {
    flex: 1,
    height: 10,
    justifyContent: 'center',
  },
  yangSolid: {
    height: 6,
    backgroundColor: GOLD,
    borderRadius: 3,
  },
  yinBrokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 6,
  },
  yinHalf: {
    flex: 1,
    height: 6,
    backgroundColor: '#9E9D24',
    borderRadius: 3,
  },
  yinGap: {
    width: 14,
  },
  lineType: {
    fontSize: 11,
    color: GOLD_SOFT,
    width: 70,
    textAlign: 'right',
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
  hexagramWrap: {
    width: '100%',
    gap: 16,
  },
  hexCard: {
    backgroundColor: 'rgba(18, 18, 24, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.45)',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  hexNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  hexName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hexTrigrams: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  hexDivider: {
    height: 1,
    backgroundColor: 'rgba(229, 169, 60, 0.25)',
    marginVertical: 4,
  },
  hexJudgment: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 19,
  },
  hexWisdom: {
    fontSize: 12.5,
    color: GOLD,
    lineHeight: 18,
    fontWeight: '600',
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
    fontWeight: '800',
    color: GOLD,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 23,
    color: '#FFFFFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: 'rgba(18, 18, 24, 0.90)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.45)',
    marginTop: 8,
  },
  resetBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
