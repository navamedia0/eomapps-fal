import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import RuneSpreadLayout from '@/components/RuneSpreadLayout';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import { getRuneById, RUNE_SPREAD_POSITIONS, type Rune } from '@/services/runeEngine';
import { interpretRuneReading } from '@/services/readings-ai';
import { addCoins } from '@/services/coins';
import { GOLD, TEXT_PRIMARY } from '@/theme/colors';

// "Kendi Kartlarınla Fal Bak" tarafındaki Rün falı — Anasayfa'daki Rün
// Falı'yla (RuneScreen.tsx) BİREBİR aynı veritabanını (runeEngine.ts),
// yorumlama motorunu (interpretRuneReading) ve parşömen sonuç ekranını
// paylaşır. Tek fark: rünler kapalı usülle değil kullanıcı tarafından bizzat
// seçilerek buraya geliyor — bu yüzden burada "çekme" adımı yok, doğrudan
// yorum isteniyor.
type Props = NativeStackScreenProps<RootStackParamList, 'RuneResult'>;

export default function RuneResultScreen({ route, navigation }: Props) {
  const { picks, spreadType } = route.params;

  const runes = useMemo<Rune[]>(
    () =>
      picks
        .map((pick): Rune | null => {
          const meaning = getRuneById(pick.id);
          if (!meaning) return null;
          return { ...meaning, isReversed: pick.orientation === 'reversed' };
        })
        .filter((r): r is Rune => r !== null),
    [picks],
  );
  const positions = RUNE_SPREAD_POSITIONS[spreadType];

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reading = await interpretRuneReading(runes, spreadType, 'deep');
      setResult(reading);
    } catch (err) {
      // 50 coin CardDeckTableScreen'de zaten harcanmıştı.
      await addCoins(50);
      const message = err instanceof Error ? err.message : 'Rünler okunurken bir sorun oluştu.';
      setError(`${message} (50 coin iade edildi.)`);
    } finally {
      setLoading(false);
    }
  }, [runes, spreadType]);

  useEffect(() => {
    fetchReading();
  }, [fetchReading]);

  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);

  const runePicks = picks;

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.rune.background}>
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GOLD} size="large" />
          <Text style={styles.loadingText}>Kadim Futhark glifleri ve Norn kehaneti okunuyor...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#E08A8A" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && result && resultSections && (
        <ParchmentReadingResult
          visible={true}
          badge="Nordik Rün Kehaneti Raporu"
          sections={resultSections}
          shareTextPrefix="Mistik Rehber - Runik Taş Kehanetim"
          parchmentBg={FORTUNE_THEMES.rune.resultBg}
          accentColor={FORTUNE_THEMES.rune.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={() => navigation.goBack()}
          spreadLayoutModalContent={
            <RuneSpreadLayout runes={runePicks} positions={positions} accentColor={FORTUNE_THEMES.rune.accentColor} />
          }
        />
      )}

      {!loading && !error && result && !resultSections && (
        <View style={styles.plainResultWrap}>
          <Text style={styles.plainResultText}>{result}</Text>
        </View>
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  loadingText: { fontSize: 13, color: GOLD, fontStyle: 'italic', textAlign: 'center' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  errorText: { color: '#E08A8A', fontSize: 13, textAlign: 'center' },
  plainResultWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  plainResultText: { fontSize: 15, lineHeight: 24, color: TEXT_PRIMARY },
});
