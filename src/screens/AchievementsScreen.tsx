import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getAchievements, type Achievement } from '@/services/achievements';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

function AchievementCard({ item }: { item: Achievement }) {
  const unlockedTierNumbers = new Set(item.unlockedTiers.map((t) => t.tier));
  const highestUnlocked = item.unlockedTiers.reduce((max, t) => Math.max(max, t.tier), 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={highestUnlocked > 0 ? 'trophy' : 'trophy-outline'} size={20} color={GOLD} />
        <Text style={styles.cardName}>{item.name}</Text>
      </View>
      {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
      <View style={styles.tierRow}>
        {item.tiers.map((tier) => {
          const unlocked = unlockedTierNumbers.has(tier.tier);
          return (
            <View key={tier.tier} style={[styles.tierPill, unlocked && styles.tierPillUnlocked]}>
              <Text style={[styles.tierPillText, unlocked && styles.tierPillTextUnlocked]}>{tier.label}</Text>
            </View>
          );
        })}
      </View>
      {item.progress !== null && <Text style={styles.progressText}>Şu anki değer: {item.progress}</Text>}
    </View>
  );
}

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAchievements()
      .then((items) => {
        setAchievements(items);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <MysticTableBackground>
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      </MysticTableBackground>
    );
  }

  if (error) {
    return (
      <MysticTableBackground>
        <Text style={styles.errorText}>Başarımlar yüklenemedi.</Text>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Şimdilik sadece Sosyallik kategorisi aktif — Fal/Oyun/Popülerlik kategorileri o sistemler kurulunca eklenecek.
        </Text>
        <View style={styles.list}>
          {achievements.map((item) => (
            <AchievementCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center', marginTop: 60 },
  hint: { fontSize: 11.5, lineHeight: 17, color: TEXT_MUTED, marginBottom: 16, textAlign: 'center' },
  list: { gap: 14 },
  card: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardName: { fontSize: 14.5, fontWeight: '700', color: TEXT_PRIMARY },
  cardDesc: { fontSize: 12, lineHeight: 17, color: TEXT_MUTED, marginBottom: 10 },
  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tierPill: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  tierPillUnlocked: { backgroundColor: GOLD, borderColor: GOLD },
  tierPillText: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED },
  tierPillTextUnlocked: { color: '#1a0d33' },
  progressText: { fontSize: 11, color: TEXT_MUTED, marginTop: 4 },
});
