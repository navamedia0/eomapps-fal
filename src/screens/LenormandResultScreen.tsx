import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, ImageBackground, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { POPULAR_CARD_DECKS } from '@/constants/cardDecksData';
import { getLenormandMeaning } from '@/services/lenormandMeanings';
import { interpretLenormandSpread } from '@/services/readings-ai';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { addCoins } from '@/services/coins';
import { saveReadingHistory } from '@/services/readingHistory';
import ShareButton from '@/components/ShareButton';
import CornerTicks from '@/components/CornerTicks';
import LenormandSpreadLayout from '@/components/LenormandSpreadLayout';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'LenormandResult'>;

const LENORMAND_DECK = POPULAR_CARD_DECKS.find((d) => d.id === 'lenormand');
const ACCENT = LENORMAND_DECK?.accent ?? '#06B6D4';

export default function LenormandResultScreen({ route, navigation }: Props) {
  const { picks, positions, readingTechnique } = route.params;

  const cards = useMemo(
    () =>
      picks.map((pick) => ({
        ...pick,
        meaning: getLenormandMeaning(pick.id),
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
      const lenormandCards = cards.map((c) => ({ id: c.id, name: c.meaning?.name ?? c.id, orientation: c.orientation }));
      const interpretation = await interpretLenormandSpread(lenormandCards, positions, readingTechnique, true);
      setResult(interpretation);
      await saveReadingHistory({ type: 'tarot', title: `Lenormand ${cards.length} Kart Açılımı`, result: interpretation });
    } catch (err) {
      // 50 coin CardDeckTableScreen'de zaten harcanmıştı — yorum teslim
      // edilemezse kullanıcı hem parasını hem falını kaybetmesin diye iade et.
      await addCoins(50);
      const message = err instanceof Error ? err.message : 'Kartlar okunurken bir sorun oluştu.';
      setError(`${message} (50 coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  }, [cards, positions, readingTechnique]);

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
    () => (result ? parseSpreadReading(result, [...positions, 'Genel Yorum & Kartların Birleşik Mesajı']) : null),
    [result, positions],
  );
  const sections = sectionsWithSummary ? sectionsWithSummary.slice(0, positions.length) : null;
  const generalSummary = sectionsWithSummary ? sectionsWithSummary[sectionsWithSummary.length - 1] : null;
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <ImageBackground source={LENORMAND_DECK?.sectionBg} style={styles.bg} resizeMode="cover">
      <View style={styles.scrim} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={ACCENT} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: ACCENT }]}>Lenormand Falı</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity }}>
              <MaterialCommunityIcons name="cards-outline" size={32} color={ACCENT} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity, color: ACCENT }]}>
              Kartlar komşularıyla birlikte okunuyor...
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
            <LenormandSpreadLayout cards={picks} positions={positions} accentColor={ACCENT} />

            {cards.map((card, index) => (
              <View key={`${card.id}-${index}`} style={styles.cardBlock}>
                <CornerTicks />
                <View style={styles.cardBlockHeader}>
                  <View style={[styles.numberBadge, { borderColor: ACCENT }]}>
                    <Text style={[styles.numberBadgeText, { color: ACCENT }]}>{card.meaning?.number ?? '?'}</Text>
                  </View>
                  <View style={styles.cardBlockInfo}>
                    <Text style={[styles.positionLabel, { color: ACCENT }]}>{positions[index]?.toLocaleUpperCase('tr-TR')}</Text>
                    <Text style={styles.cardName}>{card.meaning?.name ?? card.id}</Text>
                    <Text style={styles.orientationLabel}>{card.orientation === 'reversed' ? 'Ters (gecikmiş/zayıf)' : 'Düz'}</Text>
                    <View style={styles.conceptTagsRow}>
                      {(card.meaning?.keywords ?? []).map((kw, i) => (
                        <View key={i} style={[styles.conceptChip, { borderColor: `${ACCENT}55` }]}>
                          <Text style={[styles.conceptChipText, { color: ACCENT }]}>{kw}</Text>
                        </View>
                      ))}
                    </View>
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
                  <MaterialCommunityIcons name="cards" size={18} color={ACCENT} />
                  <Text style={[styles.resultHeaderText, { color: ACCENT }]}>Kartların Birleşik Mesajı</Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.interpretationText}>{generalSummary}</Text>
              </View>
            )}

            {result && (
              <View style={styles.actionsRow}>
                <ShareButton text={`Mistik Rehber - Lenormand Falım\n\n${result}`} />
                <Pressable onPress={() => navigation.goBack()} style={[styles.newReadingButton, { borderColor: ACCENT }]}>
                  <MaterialCommunityIcons name="cards" size={18} color={ACCENT} />
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
  numberBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  numberBadgeText: { fontSize: 18, fontWeight: '900' },
  cardBlockInfo: { flex: 1, justifyContent: 'center' },
  positionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4, fontWeight: '700' },
  cardName: { fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  orientationLabel: { fontSize: 12, color: TEXT_MUTED, marginBottom: 8 },
  conceptTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  conceptChip: { backgroundColor: 'rgba(20, 12, 38, 0.95)', borderWidth: 1, borderRadius: 8, paddingVertical: 3.5, paddingHorizontal: 8 },
  conceptChipText: { fontSize: 11, fontWeight: '600' },
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
