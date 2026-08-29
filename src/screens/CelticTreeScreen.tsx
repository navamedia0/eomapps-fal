import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReadingCardStack from '@/components/ReadingCardStack';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import { getCelticTreeByDate, type CelticTree } from '@/services/celticTreeEngine';
import { interpretCelticTreeReading } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import PickerModal from '@/components/PickerModal';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MONTH_NAMES = [
  '01 - Ocak',
  '02 - Şubat',
  '03 - Mart',
  '04 - Nisan',
  '05 - Mayıs',
  '06 - Haziran',
  '07 - Temmuz',
  '08 - Ağustos',
  '09 - Eylül',
  '10 - Ekim',
  '11 - Kasım',
  '12 - Aralık',
];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

type Props = NativeStackScreenProps<RootStackParamList, 'CelticTreeReading'>;

// Ağaç, kutsal ormandan "beliriyormuş" gibi hafif bir giriş animasyonu —
// deterministik bir sonuç olduğu için (rastgelelik yok) sahte bir "dönen
// sembol" animasyonu yerine sade bir materialize efekti kullanılır.
function TreeRevealCard({ tree }: { tree: CelticTree }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 480, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

  return (
    <Animated.View style={[styles.treeCard, animatedStyle]}>
      <Text style={styles.treeName}>{tree.name}</Text>
      <Text style={styles.treeDates}>{tree.dates}</Text>
      <View style={styles.treeDivider} />
      <Text style={styles.treeMeta}>Yönetici Gezegen: {tree.ruler} | Element: {tree.element}</Text>
      <Text style={styles.treeEssence}>🌿 Öz Değerler: {tree.essence}</Text>
      <Text style={styles.treeDesc}>{tree.desc}</Text>
    </Animated.View>
  );
}

export default function CelticTreeScreen({ navigation }: Props) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [modalType, setModalType] = useState<'day' | 'month' | null>(null);
  const [tree, setTree] = useState<CelticTree | null>(null);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);

  const handleCalculate = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);

    if (isNaN(d) || isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) {
      setError('Lütfen geçerli bir gün (1-31) ve ay (1-12) giriniz.');
      return;
    }
    setError(null);
    const calculated = getCelticTreeByDate(d, m);
    setTree(calculated);
    setResult(null);
  };

  const handleInterpret = async (targetMode: 'standard' | 'deep' = selectedMode) => {
    if (!tree) return;
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
      const interp = await interpretCelticTreeReading(tree, targetMode);
      setResult(interp);
    } catch {
      await addCoins(cost);
      setError(`Bağlantı yoğunluğu oluştu. Lütfen tekrar deneyin. (${cost} coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.celticTree.background}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="tree-outline" size={42} color={GOLD} />
          <Text style={styles.title}>Kelt Ağaç Takvimi (Ogham)</Text>
          <Text style={styles.subtitle}>Druidlerin Kutsal 13 Ağaç Astrolojisi ve Ruh Totemi</Text>
        </View>

        {!tree ? (
          <View style={styles.inputCard}>
            <Text style={styles.inputTitle}>Doğum Gününü ve Ayını Seçin</Text>
            <View style={styles.dateRow}>
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Gün</Text>
                <Pressable onPress={() => setModalType('day')} style={styles.pickerBtn}>
                  <Text style={[styles.pickerBtnText, !day && styles.pickerBtnPlaceholder]}>
                    {day ? day.padStart(2, '0') : 'Gün'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={GOLD} />
                </Pressable>
              </View>
              <View style={[styles.inputWrap, { flex: 1.4 }]}>
                <Text style={styles.label}>Ay</Text>
                <Pressable onPress={() => setModalType('month')} style={styles.pickerBtn}>
                  <Text style={[styles.pickerBtnText, !month && styles.pickerBtnPlaceholder]} numberOfLines={1}>
                    {month ? MONTH_NAMES.find((m) => m.startsWith(month.padStart(2, '0'))) || month : 'Ay'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={GOLD} />
                </Pressable>
              </View>
            </View>

            <PickerModal
              visible={modalType === 'day'}
              title="Doğum Günü Seç"
              options={DAY_OPTIONS}
              selected={day ? day.padStart(2, '0') : null}
              onSelect={(val) => {
                setDay(val);
                setModalType(null);
              }}
              onClose={() => setModalType(null)}
            />

            <PickerModal
              visible={modalType === 'month'}
              title="Doğum Ayı Seç"
              options={MONTH_NAMES}
              selected={month ? MONTH_NAMES.find((m) => m.startsWith(month.padStart(2, '0'))) : null}
              onSelect={(val) => {
                setMonth(val.slice(0, 2));
                setModalType(null);
              }}
              onClose={() => setModalType(null)}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable onPress={handleCalculate} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <MaterialCommunityIcons name="nature-people" size={20} color={NIGHT_CARD} />
              <Text style={styles.primaryBtnText}>Kutsal Ağaç Burcumu Bul</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.treeWrap}>
            <TreeRevealCard tree={tree} />

            {/* Sonuca kadar aşağı kaydırmaya gerek kalmadan hemen yeniden
                hesaplanabilir. */}
            <Pressable onPress={() => setTree(null)} style={styles.resetBtnTop}>
              <Ionicons name="refresh" size={15} color={GOLD_SOFT} />
              <Text style={styles.resetBtnText}>Farklı Bir Doğum Günü Hesapla</Text>
            </Pressable>

            {!result && !loading && (
              <View style={styles.modeSection}>
                <Text style={styles.modeTitle}>Kelt Ağaç Yorum Seviyesi:</Text>
                <View style={styles.modeCardsRow}>
                  <Pressable
                    onPress={() => setSelectedMode('standard')}
                    style={[styles.modeCard, selectedMode === 'standard' && styles.modeCardActive]}
                  >
                    <MaterialCommunityIcons name="star-crescent" size={18} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={styles.modeCardTitle}>Standart Yorum</Text>
                    <Text style={styles.modeCardDesc}>Ağaç totemi ve özeti (15 Coin)</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedMode('deep')}
                    style={[styles.modeCard, styles.modeCardDeep, selectedMode === 'deep' && styles.modeCardDeepActive]}
                  >
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, { color: '#F5C862' }]}>Kapsamlı Derin</Text>
                    <Text style={styles.modeCardDesc}>4 Boyutlu Druid rehberliği (20 Coin)</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => handleInterpret(selectedMode)}
                  style={({ pressed }) => [styles.primaryBtn, selectedMode === 'deep' && styles.btnDeep, pressed && styles.btnPressed]}
                >
                  <MaterialCommunityIcons name={selectedMode === 'deep' ? 'crown' : 'star-crescent'} size={20} color={NIGHT_CARD} />
                  <Text style={styles.primaryBtnText}>
                    {selectedMode === 'deep' ? 'Kapsamlı Druid Raporunu Al (20 Coin)' : 'Ağaç Burcunu Yorumla (15 Coin)'}
                  </Text>
                </Pressable>
              </View>
            )}

            {loading && (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="tree" size={36} color={GOLD} />
                <Text style={styles.loadingText}>Kadim Kelt ormanının bilgeliği fısıldanıyor...</Text>
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
                  <Text style={styles.badgeText}>Kelt Ağaç Astrolojisi Raporu</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
                <ShareButton text={`Mistik Rehber - Kelt Ağaç Burcum: ${tree.name}\n\n${result}`} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {tree && result && resultSections ? (
        <ParchmentReadingResult
          visible={true}
          badge="Kelt Ağaç Astrolojisi Raporu"
          sections={resultSections}
          shareTextPrefix={`Mistik Rehber - Kelt Ağaç Burcum: ${tree.name}`}
          parchmentBg={FORTUNE_THEMES.celticTree.resultBg}
          accentColor={FORTUNE_THEMES.celticTree.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={() => setTree(null)}
        />
      ) : null}
      {FORTUNE_THEMES.celticTree.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.celticTree.figure}
          title={FORTUNE_THEMES.celticTree.splashTitle}
          subtitle={FORTUNE_THEMES.celticTree.splashSubtitle}
          accentColor={FORTUNE_THEMES.celticTree.accentColor}
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
    gap: 12,
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
  treeWrap: {
    width: '100%',
    gap: 16,
  },
  treeCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD,
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  treeName: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  treeDates: {
    fontSize: 12.5,
    fontWeight: '600',
    color: GOLD_SOFT,
  },
  treeDivider: {
    height: 1,
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
    marginVertical: 4,
  },
  treeMeta: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  treeEssence: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  treeDesc: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
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
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerBtnText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  pickerBtnPlaceholder: {
    color: TEXT_MUTED,
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
