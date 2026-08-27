import { useCallback, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { calculateBiorhythm, biorhythmTone, type Biorhythm } from '@/services/biorhythm';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import DateFields from '@/components/DateFields';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const CYCLES: Array<{ key: keyof Biorhythm; label: string; icon: string }> = [
  { key: 'physical', label: 'Fiziksel', icon: 'run-fast' },
  { key: 'emotional', label: 'Duygusal', icon: 'heart-outline' },
  { key: 'intellectual', label: 'Zihinsel', icon: 'lightbulb-outline' },
];

function Bar({ value }: { value: number }) {
  const fillPct = Math.max(0, Math.min(100, (value + 100) / 2));
  return (
    <View style={styles.barTrack}>
      <View style={styles.barCenterTick} />
      <View style={[styles.barFill, { width: `${fillPct}%` }]} />
    </View>
  );
}

export default function BiorhythmScreen() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [result, setResult] = useState<Biorhythm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const calculate = useCallback(() => {
    setFormError(null);
    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(year);
    if (!dayNum || !monthNum || !yearNum || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setFormError('Lütfen geçerli bir doğum tarihi gir.');
      return;
    }
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
      setFormError('Lütfen geçerli bir doğum tarihi gir.');
      return;
    }
    setResult(calculateBiorhythm(date));
  }, [day, month, year]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!result && (
            <View style={styles.formWrap}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="waveform" size={36} color={GOLD} />
              </View>
              <Text style={styles.instruction}>
                Doğum tarihini gir; bugünkü fiziksel, duygusal ve zihinsel döngülerini keşfet.
              </Text>

              <Text style={styles.label}>Doğum Tarihi</Text>
              <DateFields day={day} month={month} year={year} onDayChange={setDay} onMonthChange={setMonth} onYearChange={setYear} />

              {formError && <Text style={styles.formErrorText}>{formError}</Text>}

              <Pressable onPress={calculate} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
                <Text style={styles.actionButtonText}>Döngülerimi Göster</Text>
              </Pressable>
            </View>
          )}

          {result && (
            <View style={styles.resultWrap}>
              {CYCLES.map((cycle) => {
                const value = result[cycle.key];
                return (
                  <View key={cycle.key} style={styles.cycleCard}>
                    <View style={styles.cycleHeader}>
                      <MaterialCommunityIcons name={cycle.icon as any} size={20} color={GOLD} />
                      <Text style={styles.cycleLabel}>{cycle.label}</Text>
                      <Text style={styles.cycleValue}>{value > 0 ? `+${value}` : value}%</Text>
                    </View>
                    <Bar value={value} />
                    <Text style={styles.cycleText}>{cycle.label} döngün {biorhythmTone(value)}.</Text>
                  </View>
                );
              })}

              <Pressable onPress={reset} style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.actionButtonPressed]}>
                <Ionicons name="refresh" size={18} color={GOLD} />
                <Text style={styles.actionButtonSecondaryText}>Yeni Hesaplama</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  formWrap: {
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  formErrorText: {
    color: '#E08A8A',
    fontSize: 12.5,
    marginTop: 10,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 22,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  resultWrap: {
    gap: 16,
  },
  cycleCard: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    gap: 10,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  cycleValue: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barCenterTick: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: '100%',
    backgroundColor: GOLD_SOFT,
  },
  barFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 4,
  },
  cycleText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_MUTED,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
});
