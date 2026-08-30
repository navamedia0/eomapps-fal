import { useCallback, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import LenormandSpreadLayout from '@/components/LenormandSpreadLayout';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { getLenormandMeaning } from '@/services/lenormandMeanings';
import { interpretLenormandSpread } from '@/services/readings-ai';
import { parseSpreadReading } from '@/utils/parseSpreadReading';
import { addCoins } from '@/services/coins';
import { saveReadingHistory } from '@/services/readingHistory';
import { GOLD, TEXT_PRIMARY } from '@/theme/colors';
import { turkishUpperCase } from '@/utils/turkishCase';

// Anasayfa'daki fal sonuçlarıyla (Tarot, Rün...) AYNI parşömen/daktilo
// sunum sistemini kullanır — "kendi kartlarınla" ile tek fark kartların
// bizzat seçilerek gelmesi, sunum ve veritabanı aynı.
type Props = NativeStackScreenProps<RootStackParamList, 'LenormandResult'>;

const ACCENT = '#06B6D4';
// Lenormand'a özel bir parşömen dokusu henüz üretilmedi — en yakın avrupa
// kartomansi teması olan İskambil Falı'nın parşömenini ödünç alıyoruz.
const PARCHMENT_BG = FORTUNE_THEMES.solitaire.resultBg;

export default function LenormandResultScreen({ route, navigation }: Props) {
  const { picks, positions, readingTechnique } = route.params;

  const cards = useMemo(() => picks.map((pick) => ({ ...pick, meaning: getLenormandMeaning(pick.id) })), [picks]);

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lenormandCards = cards.map((c) => ({ id: c.id, name: c.meaning?.name ?? c.id, orientation: c.orientation }));
      const interpretation = await interpretLenormandSpread(lenormandCards, positions, readingTechnique, true);
      setResult(interpretation);
      await saveReadingHistory({ type: 'tarot', title: `Lenormand ${cards.length} Kart Açılımı`, result: interpretation });
    } catch (err) {
      // 50 coin CardDeckTableScreen'de zaten harcanmıştı.
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

  const sectionsWithSummary = useMemo(
    () => (result ? parseSpreadReading(result, [...positions, 'Genel Yorum & Kartların Birleşik Mesajı']) : null),
    [result, positions],
  );

  const parchmentSections = useMemo(() => {
    if (!sectionsWithSummary) return null;
    const cardSections = cards.map((card, idx) => ({
      title: `${turkishUpperCase(positions[idx] || `${idx + 1}. Kart`)}: ${card.meaning?.name ?? card.id}`,
      body: sectionsWithSummary[idx] ?? '',
      keywords: card.meaning?.keywords ?? [],
      posLabel: positions[idx],
    }));
    const summary = sectionsWithSummary[sectionsWithSummary.length - 1];
    return summary ? [...cardSections, { title: 'Kartların Birleşik Mesajı', body: summary }] : cardSections;
  }, [sectionsWithSummary, cards, positions]);

  return (
    <MysticTableBackground>
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GOLD} size="large" />
          <Text style={styles.loadingText}>Kartlar komşularıyla birlikte okunuyor...</Text>
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
          badge="Lenormand Kehanet Raporu"
          sections={parchmentSections}
          shareTextPrefix="Mistik Rehber - Lenormand Falım"
          parchmentBg={PARCHMENT_BG}
          accentColor={ACCENT}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={() => navigation.goBack()}
          spreadLayoutModalContent={<LenormandSpreadLayout cards={picks} positions={positions} accentColor={ACCENT} />}
        />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  loadingText: { fontSize: 13, color: GOLD, fontStyle: 'italic', textAlign: 'center' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  errorText: { color: '#E08A8A', fontSize: 13, textAlign: 'center' },
});
