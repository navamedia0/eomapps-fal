import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { calculateMoonPhase } from '@/services/moonPhase';
import { MOON_PHASE_ICONS, MOON_PHASE_INFO } from '@/constants/moonRituals';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function MoonCalendarScreen() {
  const moon = useMemo(() => calculateMoonPhase(), []);
  const info = MOON_PHASE_INFO[moon.phaseName];
  const iconName = MOON_PHASE_ICONS[moon.phaseName];
  const illuminationPct = Math.round(moon.illumination * 100);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={iconName as any} size={54} color={GOLD} />
          </View>
          <Text style={styles.phaseName}>{moon.phaseName}</Text>
          <Text style={styles.illumination}>Aydınlanma: %{illuminationPct}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.description}>{info.description}</Text>
        </View>

        <View style={styles.ritualCard}>
          <View style={styles.ritualHeader}>
            <MaterialCommunityIcons name="candle" size={18} color={GOLD} />
            <Text style={styles.ritualTitle}>Bu Evre İçin Ritüel Önerisi</Text>
          </View>
          <Text style={styles.ritualText}>{info.ritual}</Text>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateCard}>
            <MaterialCommunityIcons name="moon-new" size={22} color={GOLD} />
            <Text style={styles.dateLabel}>Sonraki Yeni Ay</Text>
            <Text style={styles.dateValue}>{formatDate(moon.nextNewMoon)}</Text>
          </View>
          <View style={styles.dateCard}>
            <MaterialCommunityIcons name="moon-full" size={22} color={GOLD} />
            <Text style={styles.dateLabel}>Sonraki Dolunay</Text>
            <Text style={styles.dateValue}>{formatDate(moon.nextFullMoon)}</Text>
          </View>
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  phaseName: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 4,
  },
  illumination: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  card: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  ritualCard: {
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 20,
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ritualTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  ritualText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCard: {
    flex: 1,
    flexBasis: 0,
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  dateValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
});
