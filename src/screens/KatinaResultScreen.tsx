import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { getKatinaMeaning, getKatinaCardDetail } from '@/services/katinaMeanings';
import { interpretKatinaSpread, type KatinaPickItem } from '@/services/readings-ai';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { addCoins } from '@/services/coins';
import { saveReadingHistory } from '@/services/readingHistory';
import { GOLD } from '@/theme/colors';
import { turkishUpperCase } from '@/utils/turkishCase';

type Props = NativeStackScreenProps<RootStackParamList, 'KatinaResult'>;

const ACCENT = '#E11D48';
const PARCHMENT_BG = FORTUNE_THEMES.katina.resultBg || FORTUNE_THEMES.katina.background;

export default function KatinaResultScreen({ route, navigation }: Props) {
  const { picks, positions, isRelationship, p1Name, p2Name, relFocus, sealCard } = route.params;

  const cards = useMemo(
    () =>
      picks.map((pick) => {
        const detail = getKatinaCardDetail(pick.id);
        const meaning = getKatinaMeaning(pick.id);
        const isKupa = pick.id.startsWith('kupa');
        const isKaro = pick.id.startsWith('karo');
        const isSinek = pick.id.startsWith('sinek');
        const symbol = isKupa ? '♥' : isKaro ? '♦' : isSinek ? '♣' : '♠';
        const name = detail?.name || pick.id.replace('-', ' ').toUpperCase();
        return {
          id: pick.id,
          name,
          symbol,
          meaning,
          orientation: pick.orientation,
        };
      }),
    [picks],
  );

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const katinaPicks: KatinaPickItem[] = cards.map((c) => ({
        id: c.id,
        name: c.name,
        orientation: c.orientation,
      }));

      const relContext = isRelationship
        ? {
            p1Name: p1Name?.trim() || '1. Kişi',
            p2Name: p2Name?.trim() || '2. Kişi',
            relFocus: relFocus?.trim() || 'Aşk & Evlilik Uyumu',
            sealCard,
          }
        : sealCard
        ? { sealCard }
        : undefined;

      const interpretation = await interpretKatinaSpread(
        katinaPicks,
        positions,
        true,
        undefined,
        relContext,
      );

      setResult(interpretation);
      await saveReadingHistory({
        type: 'katina',
        title: isRelationship
          ? `Katina Çift Uyumu (${p1Name || '1. Kişi'} & ${p2Name || '2. Kişi'})`
          : `Katina ${cards.length} Kart Açılımı`,
        result: interpretation,
      });
    } catch (err) {
      await addCoins(50);
      const message = err instanceof Error ? err.message : 'Kartlar okunurken bir sorun oluştu.';
      setError(`${message} (50 coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  }, [cards, positions, isRelationship, p1Name, p2Name, relFocus, sealCard]);

  useEffect(() => {
    fetchReading();
  }, [fetchReading]);

  const sectionsWithSummary = useMemo(
    () => (result ? parseSpreadReading(result, [...positions, 'Genel Kadersel Sentez & Aşk Mührü']) : null),
    [result, positions],
  );

  const parchmentSections = useMemo(() => {
    if (!sectionsWithSummary) return null;
    const cardSections = cards.map((card, idx) => ({
      title: `${turkishUpperCase(positions[idx] || `${idx + 1}. Kart`)}: ${card.name}${card.orientation === 'reversed' ? ' (Ters Konum)' : ''}`,
      body: sectionsWithSummary[idx] ?? '',
      posLabel: positions[idx],
    }));
    const summary = sectionsWithSummary[sectionsWithSummary.length - 1];
    return summary
      ? [...cardSections, { title: 'Genel Kadersel Sentez & Aşk Mührü', body: summary }]
      : cardSections;
  }, [sectionsWithSummary, cards, positions]);

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.katina.background}>
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} size="large" />
          <Text style={styles.loadingText}>İzmir'in kadim aşk enerjileri kartları okuyor...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#E08A8A" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && result && parchmentSections && (
        <ParchmentReadingResult
          visible={true}
          badge={isRelationship ? 'Katina Çift & Aşk Kehaneti' : 'Katina Aşk & Kader Raporu'}
          sections={parchmentSections}
          shareTextPrefix="Mistik Rehber - Katina Aşk Falım"
          parchmentBg={PARCHMENT_BG}
          accentColor={ACCENT}
          onHomePress={() => navigation.navigate('Home')}
        />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#F87171',
    textAlign: 'center',
    lineHeight: 18,
  },
});
