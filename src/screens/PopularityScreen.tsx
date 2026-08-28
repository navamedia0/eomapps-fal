import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getLeaderboard, type LeaderboardEntry } from '@/services/popularity';
import { avatarColor } from '@/utils/avatarColor';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const RANK_COLOR: Record<number, string> = { 1: '#F2C879', 2: '#C4B8E8', 3: '#C98A4B' };

export default function PopularityScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getLeaderboard()
      .then(({ leaderboard }) => {
        setEntries(leaderboard);
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
        <Text style={styles.errorText}>Liste yüklenemedi.</Text>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Bu hafta harcamaya göre sıralanıyor, her Pazartesi sıfırlanır. İlk 10'a giren "Haftalık Yıldız" başarımını
          kazanır.
        </Text>
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>Bu hafta henüz kimse harcama yapmadı.</Text>
        ) : (
          <View style={styles.list}>
            {entries.map((entry) => (
              <View key={entry.userId} style={styles.row}>
                <Text style={[styles.rank, RANK_COLOR[entry.rank] && { color: RANK_COLOR[entry.rank] }]}>
                  {entry.rank}
                </Text>
                {entry.avatarUrl ? (
                  <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor(entry.userId) }]}>
                    <Text style={styles.avatarFallbackText}>{entry.displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.name} numberOfLines={1}>
                  {entry.displayName}
                </Text>
                <View style={styles.scoreWrap}>
                  <Ionicons name="flame" size={13} color={GOLD} />
                  <Text style={styles.scoreText}>{entry.score}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center', marginTop: 60 },
  hint: { fontSize: 11.5, lineHeight: 17, color: TEXT_MUTED, marginBottom: 16, textAlign: 'center' },
  emptyText: { fontSize: 12.5, color: TEXT_MUTED, textAlign: 'center', paddingVertical: 30 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 12,
  },
  rank: { width: 22, fontSize: 14, fontWeight: '800', color: TEXT_MUTED, textAlign: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  name: { flex: 1, fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
});
