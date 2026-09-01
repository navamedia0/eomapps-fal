import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import RuneSpreadLayout from '@/components/RuneSpreadLayout';
import RunePouchExperience from '@/components/runes/RunePouchExperience';
import RuneInspectModal from '@/components/runes/RuneInspectModal';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import {
  drawRandomRunes,
  RUNE_SPREAD_TYPES,
  RUNE_SPREAD_POSITIONS,
  RUNE_SPREAD_INFO,
  type Rune,
  type RuneSpreadType,
} from '@/services/runeEngine';
import { interpretRuneReading } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RuneReading'>;
type SpreadType = RuneSpreadType;

const SPREADS: Record<
  SpreadType,
  { count: number; label: string; desc: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; positions: string[] }
> = Object.fromEntries(
  RUNE_SPREAD_TYPES.map((type) => [
    type,
    {
      count: RUNE_SPREAD_POSITIONS[type].length,
      label: RUNE_SPREAD_INFO[type].label,
      desc: RUNE_SPREAD_INFO[type].desc,
      icon: RUNE_SPREAD_INFO[type].icon as keyof typeof MaterialCommunityIcons.glyphMap,
      positions: RUNE_SPREAD_POSITIONS[type],
    },
  ]),
) as Record<
  SpreadType,
  { count: number; label: string; desc: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; positions: string[] }
>;

export default function RuneScreen({ navigation }: Props) {
  const [spreadType, setSpreadType] = useState<SpreadType>('norn');
  const [runes, setRunes] = useState<Rune[]>([]);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Inspect Modal State
  const [inspectModal, setInspectModal] = useState<{ rune: Rune; label: string } | null>(null);

  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);

  const handleStartDraw = () => {
    const drawn = drawRandomRunes(SPREADS[spreadType].count);
    setRunes(drawn);
    setResult(null);
    setError(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (runes.length === 0) return;
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
      const reading = await interpretRuneReading(runes, spreadType, targetMode);
      setResult(reading);
    } catch {
      await addCoins(cost);
      setError(`Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin. (${cost} coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.rune.background}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.runeBigSymbol}>ᚱ</Text>
          <Text style={styles.title}>Nordik Runik Taş Falı</Text>
          <Text style={styles.subtitle}>Odin'in ve Nornların Kadim Viking Kehanet Taşları</Text>
        </View>

        {/* Initial Setup: Açılım Türü Seçimi */}
        {runes.length === 0 ? (
          <View style={styles.setupCard}>
            <View style={styles.setupBadgeHeader}>
              <MaterialCommunityIcons name="bag-personal-outline" size={20} color="#38BDF8" />
              <Text style={styles.setupBadgeTitle}>Kutsal Kese Dökümü</Text>
            </View>
            <Text style={styles.cardTitle}>Açılım Türünü Seç</Text>

            <View style={styles.spreadTypeRow}>
              {(Object.keys(SPREADS) as SpreadType[]).map((key) => {
                const spread = SPREADS[key];
                const active = spreadType === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setSpreadType(key)}
                    style={[styles.spreadTypeBtn, active && styles.spreadTypeBtnActive]}
                  >
                    <MaterialCommunityIcons
                      name={spread.icon}
                      size={20}
                      color={active ? '#38BDF8' : TEXT_MUTED}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.spreadTypeBtnText, active && styles.spreadTypeBtnTextActive]}>
                        {spread.label} ({spread.count} Taş)
                      </Text>
                      <Text style={styles.spreadTypeBtnDesc}>{spread.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleStartDraw}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            >
              <MaterialCommunityIcons name="bag-personal-outline" size={22} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Kutsal Keseden Taşları Çek</Text>
            </Pressable>
          </View>
        ) : (
          /* Active Experience: Kutsal Kese Dökümü ve Açılım */
          <View style={styles.runesWrap}>
            <RunePouchExperience
              runes={runes}
              positions={SPREADS[spreadType].positions}
              onInspectRune={(rune, label) => setInspectModal({ rune, label })}
            />

            {/* Interpretation Mode Selection */}
            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Rün Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons
                      name="star-crescent"
                      size={18}
                      color={selectedMode === 'standard' ? '#38BDF8' : TEXT_MUTED}
                    />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Rün özeti ve rehberliği (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color="#38BDF8" />
                    <Text style={[styles.modeCardTitle, { color: '#7DD3FC' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu derin kehanet (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    selectedMode === 'deep' && styles.btnDeep,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={selectedMode === 'deep' ? 'crown' : 'star-crescent'}
                    size={20}
                    color={NIGHT_CARD}
                  />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep'
                      ? 'Kapsamlı Rün Raporunu Çözümle (20 Coin)'
                      : 'Rünleri Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="shield-sword-outline" size={36} color="#38BDF8" />
                <Text style={styles.loadingText}>Kadim Futhark glifleri ve Norn kehaneti okunuyor...</Text>
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
                  <MaterialCommunityIcons name="crown" size={16} color="#38BDF8" />
                  <Text style={styles.badgeText}>Nordik Rün Kehaneti Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Runik Taş Kehanetim\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={() => setRunes([])} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color="#7DD3FC" />
              <Text style={styles.resetBtnText}>Yeniden Rün Çek</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Result Parchment Sheet */}
      {runes.length > 0 && result && resultSections ? (
        <ParchmentReadingResult
          visible={true}
          badge="Nordik Rün Kehaneti Raporu"
          sections={resultSections}
          shareTextPrefix="Mistik Rehber - Runik Taş Kehanetim"
          parchmentBg={FORTUNE_THEMES.rune.resultBg}
          accentColor="#38BDF8"
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={() => setRunes([])}
          spreadLayoutModalContent={
            <RuneSpreadLayout
              runes={runes.map((r) => ({ id: r.id, orientation: r.isReversed ? 'reversed' : 'upright' }))}
              positions={SPREADS[spreadType].positions}
              accentColor="#38BDF8"
              onInspectRune={(rune, label) => setInspectModal({ rune, label })}
            />
          }
        />
      ) : null}

      {/* Splash Modal */}
      {FORTUNE_THEMES.rune.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.rune.figure}
          title={FORTUNE_THEMES.rune.splashTitle}
          subtitle={FORTUNE_THEMES.rune.splashSubtitle}
          accentColor="#38BDF8"
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Rune Detail Inspection Modal */}
      <RuneInspectModal
        visible={!!inspectModal}
        rune={inspectModal?.rune ?? null}
        positionLabel={inspectModal?.label}
        onClose={() => setInspectModal(null)}
      />
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
    gap: 4,
  },
  runeBigSymbol: {
    fontSize: 42,
    color: '#38BDF8',
    fontWeight: '700',
    textShadowColor: '#38BDF8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F0F9FF',
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
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  setupBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  setupBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#E0F2FE',
    textAlign: 'center',
  },
  spreadTypeRow: {
    gap: 10,
  },
  spreadTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(18, 18, 24, 0.90)',
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    padding: 14,
  },
  spreadTypeBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  spreadTypeBtnText: {
    fontSize: 13.5,
    color: '#E4E4E7',
    fontWeight: '700',
    flex: 1,
  },
  spreadTypeBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '900',
  },
  spreadTypeBtnDesc: {
    fontSize: 10.5,
    color: '#A1A1AA',
    marginTop: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDeep: {
    backgroundColor: '#7DD3FC',
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
  runesWrap: {
    width: '100%',
    gap: 16,
  },
  modeSection: {
    gap: 10,
    marginTop: 6,
  },
  modeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#7DD3FC',
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
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  modeCardDeep: {
    backgroundColor: 'rgba(14, 30, 56, 0.90)',
    borderColor: 'rgba(125, 211, 252, 0.35)',
  },
  modeCardDeepActive: {
    borderColor: '#7DD3FC',
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
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
    color: '#7DD3FC',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(18, 18, 24, 0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.45)',
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
    color: '#38BDF8',
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
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginTop: 8,
  },
  resetBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
