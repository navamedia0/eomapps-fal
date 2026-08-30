import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, ImageBackground, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { POPULAR_CARD_DECKS } from '@/constants/cardDecksData';
import { getRuneMeaning, isSymmetricRune } from '@/services/runeMeanings';
import { interpretRuneSpread } from '@/services/readings-ai';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { addCoins } from '@/services/coins';
import { saveReadingHistory } from '@/services/readingHistory';
import ShareButton from '@/components/ShareButton';
import CornerTicks from '@/components/CornerTicks';
import RuneSpreadLayout from '@/components/RuneSpreadLayout';
import { GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RuneResult'>;

const RUNE_DECK = POPULAR_CARD_DECKS.find((d) => d.id === 'rune');
const ACCENT = RUNE_DECK?.accent ?? '#38BDF8';

export default function RuneResultScreen({ route, navigation }: Props) {
  const { picks, positions, readingTechnique } = route.params;

  const runes = useMemo(
    () =>
      picks.map((pick) => ({
        ...pick,
        meaning: getRuneMeaning(pick.id),
        symmetric: isSymmetricRune(pick.id),
      })),
    [picks],
  );

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  const fetchReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const runeCards = runes.map((r) => ({ id: r.id, orientation: r.orientation }));
      const interpretation = await interpretRuneSpread(runeCards, positions, readingTechnique, true);
      setResult(interpretation);
      await saveReadingHistory({ type: 'tarot', title: `Rün ${runes.length} Taş Açılımı`, result: interpretation });
    } catch (err) {
      await addCoins(50);
      const message = err instanceof Error ? err.message : 'Rünler okunurken bir sorun oluştu.';
      setError(`${message} (50 coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  }, [runes, positions, readingTechnique]);

  useEffect(() => {
    fetchReading();
  }, [fetchReading]);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, pulse]);

  const sectionsWithSummary = useMemo(
    () => (result ? parseSpreadReading(result, [...positions, 'Genel Yorum & Rünlerin Ortak Kehaneti']) : null),
    [result, positions],
  );
  const sections = sectionsWithSummary ? sectionsWithSummary.slice(0, positions.length) : null;
  const generalSummary = sectionsWithSummary ? sectionsWithSummary[sectionsWithSummary.length - 1] : null;
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <ImageBackground source={RUNE_DECK?.sectionBg} style={styles.bg} resizeMode="cover">
      <View style={styles.scrim} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={ACCENT} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: ACCENT }]}>Rün Falı</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity }}>
              <MaterialCommunityIcons name="shield-star-outline" size={32} color={ACCENT} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity, color: ACCENT }]}>
              Taşlar Odin'in bilgeliğiyle okunuyor...
            </Animated.Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchReading} style={[styles.retryButton, { borderColor: ACCENT }]}>
              <MaterialCommunityIcons name="refresh" size={16} color={ACCENT} />
              <Text style={[styles.retryButtonText, { color: ACCENT }]}>Tekrar Dene</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.cardsList}>
            <RuneSpreadLayout runes={picks} positions={positions} accentColor={ACCENT} />

            {runes.map((rune, index) => (
              <View key={`${rune.id}-${index}`} style={styles.cardBlock}>
                <CornerTicks />
                <View style={styles.cardBlockHeader}>
                  <View style={[styles.symbolBadge, { borderColor: ACCENT }]}>
                    <Text style={[styles.symbolBadgeText, { color: ACCENT }]}>{rune.meaning?.symbol ?? '?'}</Text>
                  </View>
                  <View style={styles.cardBlockInfo}>
                    <Text style={[styles.positionLabel, { color: ACCENT }]}>{positions[index]?.toLocaleUpperCase('tr-TR')}</Text>
                    <Text style={styles.cardName}>{rune.meaning?.name ?? rune.id}</Text>
                    <Text style={styles.orientationLabel}>
                      {rune.orientation === 'reversed' ? (rune.symmetric ? 'Düz (bu rün simetriktir)' : 'Ters') : 'Düz'}
                      {rune.meaning?.element ? ` · ${rune.meaning.element}` : ''}
                    </Text>
                  </View>
                </View>
                {sections && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.interpretationText}>{sections[index]}</Text>
                  </>
                )}
              </View>
            ))}

            {generalSummary && (
              <View style={[styles.summaryBlock, { borderColor: `${ACCENT}55`, backgroundColor: `${ACCENT}14` }]}>
                <CornerTicks />
                <View style={styles.resultHeader}>
                  <MaterialCommunityIcons name="shield-star-outline" size={18} color={ACCENT} />
                  <Text style={[styles.resultHeaderText, { color: ACCENT }]}>Rünlerin Ortak Kehaneti</Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.interpretationText}>{generalSummary}</Text>
              </View>
            )}

            {result && (
              <View style={styles.actionsRow}>
                <ShareButton text={`Mistik Rehber - Rün Falım\n\n${result}`} />
                <Pressable onPress={() => navigation.goBack()} style={[styles.newReadingButton, { borderColor: ACCENT }]}>
                  <MaterialCommunityIcons name="shield-star-outline" size={18} color={ACCENT} />
                  <Text style={[styles.newReadingButtonText, { color: ACCENT }]}>Yeni Fal Bak</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6, 4, 16, 0.82)' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 48 },
  header: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 12, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
    width: '100%',
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  errorText: { color: '#E08A8A', fontSize: 13, textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14 },
  retryButtonText: { fontSize: 12.5, fontWeight: '600' },
  cardsList: { gap: 18 },
  cardBlock: {
    position: 'relative',
    backgroundColor: NIGHT_CARD,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 20,
  },
  cardBlockHeader: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  symbolBadge: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  symbolBadgeText: { fontSize: 24, fontWeight: '900' },
  cardBlockInfo: { flex: 1, justifyContent: 'center' },
  positionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4, fontWeight: '700' },
  cardName: { fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  orientationLabel: { fontSize: 12, color: TEXT_MUTED },
  divider: { height: 1, backgroundColor: GOLD_SOFT, opacity: 0.6, marginVertical: 14 },
  interpretationText: { fontSize: 15.5, lineHeight: 25.5, color: TEXT_PRIMARY },
  summaryBlock: { position: 'relative', borderRadius: 26, borderWidth: 1, padding: 20 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultHeaderText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  newReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    flex: 1.6,
    flexBasis: 0,
  },
  newReadingButtonText: { fontSize: 13.5, fontWeight: '600' },
});
