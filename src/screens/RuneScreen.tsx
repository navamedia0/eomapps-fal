import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReelRevealFX from '@/components/effects/ReelRevealFX';
import SparkleBurst from '@/components/effects/SparkleBurst';
import { drawRandomRunes, getAllRunes, type Rune } from '@/services/runeEngine';
import { interpretRuneReading } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const ALL_RUNE_SYMBOLS = getAllRunes().map((r) => r.symbol);

type Props = NativeStackScreenProps<RootStackParamList, 'RuneReading'>;
type SpreadType = 'single' | 'norn' | 'cross';

const SPREADS: Record<SpreadType, { count: number; label: string; desc: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; positions: string[] }> = {
  single: {
    count: 1,
    label: 'Tek Rün (Günün Rehberi)',
    desc: 'Gününe yön veren tek bir kadim işaret',
    icon: 'star-outline',
    positions: ['Günün Rehber Rünü'],
  },
  norn: {
    count: 3,
    label: '3 Taşlı Norn Açılımı',
    desc: 'Geçmiş - Şimdi - Gelecek akışı',
    icon: 'triangle-outline',
    positions: ['1. Urd (Geçmiş / Kökler)', '2. Verdandi (Şimdi / Ateş)', '3. Skuld (Gelecek / Kehanet)'],
  },
  cross: {
    count: 5,
    label: '5 Taşlı Norse Haçı',
    desc: 'Durumun özü, gizli etkenler ve olası sonuç',
    icon: 'compass-outline',
    positions: [
      '1. Merkez (Durumun Özü)',
      '2. Üst (Görünen Etken)',
      '3. Alt (Gizli / Bilinçaltı Etken)',
      '4. Sol (Geçmişten Gelen Kök)',
      '5. Sağ (Olası Yol / Sonuç)',
    ],
  },
};

const ELEMENT_COLORS: Array<{ match: string; color: string }> = [
  { match: 'Ateş', color: '#FF7A4D' },
  { match: 'Buz', color: '#6FD8E8' },
  { match: 'Su', color: '#4FA8E0' },
  { match: 'Toprak', color: '#8BC24A' },
  { match: 'Hava', color: '#B9A6F2' },
  { match: 'Tüm Elementler', color: GOLD },
];

function elementColor(element: string): string {
  const found = ELEMENT_COLORS.find((e) => element.includes(e.match));
  return found ? found.color : GOLD;
}

function RuneStoneCard({ rune, positionLabel, delay }: { rune: Rune; positionLabel: string; delay: number }) {
  const [settled, setSettled] = useState(false);
  const accent = elementColor(rune.element);
  const glyphColor = rune.isReversed ? '#F2A65A' : accent;

  return (
    <View style={styles.stoneCard}>
      <Text style={styles.stonePosition}>{positionLabel}</Text>

      <View style={styles.reelStage}>
        <SparkleBurst active={settled} color={accent} />
        <ReelRevealFX
          finalSymbol={rune.symbol}
          spinPool={ALL_RUNE_SYMBOLS}
          delay={delay}
          glowColor={accent}
          onSettled={() => setSettled(true)}
          renderSymbol={(symbol, isSettled) => (
            <View
              style={[
                styles.runeStoneVisual,
                { borderColor: isSettled ? accent : 'rgba(242, 200, 121, 0.4)' },
              ]}
            >
              <Text
                style={[
                  styles.runeRuneGlyph,
                  isSettled && rune.isReversed && styles.runeGlyphReversed,
                  { color: isSettled ? glyphColor : GOLD_SOFT },
                ]}
              >
                {symbol}
              </Text>
            </View>
          )}
        />
      </View>

      {settled && (
        <>
          <Text style={styles.runeStoneName}>
            {rune.name} {rune.isReversed ? '(TERS)' : ''}
          </Text>
          <Text style={styles.runeStoneElement}>Element: {rune.element}</Text>
          <Text style={styles.runeStoneMeaning}>{rune.isReversed ? rune.reversed : rune.upright}</Text>
        </>
      )}
    </View>
  );
}

export default function RuneScreen({ navigation }: Props) {
  const [spreadType, setSpreadType] = useState<SpreadType>('norn');
  const [runes, setRunes] = useState<Rune[]>([]);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrawRunes = () => {
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
      setError('Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const renderStone = (rune: Rune | undefined, i: number) => {
    if (!rune) return null;
    return (
      <RuneStoneCard key={i} rune={rune} positionLabel={SPREADS[spreadType].positions[i]} delay={i * 220} />
    );
  };

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.runeBigSymbol}>ᚱ</Text>
          <Text style={styles.title}>Nordik Runik Taş Falı</Text>
          <Text style={styles.subtitle}>Odin'in ve Nornların Kadim Viking Kehanet Taşları</Text>
        </View>

        {runes.length === 0 ? (
          <View style={styles.setupCard}>
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
                    <MaterialCommunityIcons name={spread.icon} size={20} color={active ? GOLD : TEXT_MUTED} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.spreadTypeBtnText, active && styles.spreadTypeBtnTextActive]}>
                        {spread.label}
                      </Text>
                      <Text style={styles.spreadTypeBtnDesc}>{spread.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={handleDrawRunes} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="hand-back-left" size={22} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Kutsal Keseden Taşları Çek</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.runesWrap}>
            {spreadType === 'cross' ? (
              <View style={styles.crossGrid}>
                <View style={styles.crossRow}>
                  <View style={styles.crossSlot} />
                  <View style={styles.crossSlot}>{renderStone(runes[1], 1)}</View>
                  <View style={styles.crossSlot} />
                </View>
                <View style={styles.crossRow}>
                  <View style={styles.crossSlot}>{renderStone(runes[3], 3)}</View>
                  <View style={styles.crossSlot}>{renderStone(runes[0], 0)}</View>
                  <View style={styles.crossSlot}>{renderStone(runes[4], 4)}</View>
                </View>
                <View style={styles.crossRow}>
                  <View style={styles.crossSlot} />
                  <View style={styles.crossSlot}>{renderStone(runes[2], 2)}</View>
                  <View style={styles.crossSlot} />
                </View>
              </View>
            ) : (
              <View style={styles.stonesRow}>{runes.map((rune, i) => renderStone(rune, i))}</View>
            )}

            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Rün Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Rün özeti ve rehberliği (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu derin kehanet (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Rün Raporunu Çözümle (20 Coin)' : 'Rünleri Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="shield-sword-outline" size={36} color={GOLD} />
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

            {result && (
              <View style={styles.resultCard}>
                <View style={styles.badgeRow}>
                  <MaterialCommunityIcons name="crown" size={16} color={GOLD} />
                  <Text style={styles.badgeText}>Nordik Rün Kehaneti Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Runik Taş Kehanetim\n\n${result}`} />
              </View>
            )}

            <Pressable onPress={() => setRunes([])} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Yeniden Rün Çek</Text>
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
    gap: 4,
  },
  runeBigSymbol: {
    fontSize: 42,
    color: GOLD,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '700',
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  spreadTypeRow: {
    gap: 10,
  },
  spreadTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 8, 35, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 14,
    padding: 14,
  },
  spreadTypeBtnActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
  },
  spreadTypeBtnText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
    flex: 1,
  },
  spreadTypeBtnTextActive: {
    color: GOLD,
    fontWeight: '700',
  },
  spreadTypeBtnDesc: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  crossGrid: {
    width: '100%',
    gap: 10,
  },
  crossRow: {
    flexDirection: 'row',
    gap: 10,
  },
  crossSlot: {
    flex: 1,
    alignItems: 'center',
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
  runesWrap: {
    width: '100%',
    gap: 16,
  },
  stonesRow: {
    gap: 12,
  },
  stoneCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  stonePosition: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  reelStage: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  runeStoneVisual: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(38, 22, 75, 0.95)',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runeRuneGlyph: {
    fontSize: 32,
    color: GOLD,
    fontWeight: '700',
  },
  runeGlyphReversed: {
    transform: [{ rotate: '180deg' }],
    color: '#F2A65A',
  },
  runeStoneName: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  runeStoneElement: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  runeStoneMeaning: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    textAlign: 'center',
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
