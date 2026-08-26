import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import {
  getReadingHistory,
  deleteReadingHistoryEntry,
  clearReadingHistory,
  type ReadingHistoryEntry,
  type ReadingHistoryType,
} from '@/services/readingHistory';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const TABS: Array<{ key: ReadingHistoryType; label: string }> = [
  { key: 'kahve', label: 'Kahve Falı' },
  { key: 'tarot', label: 'Tarot Falı' },
  { key: 'el', label: 'El Falı' },
  { key: 'katina', label: 'Katina Falı' },
  { key: 'sesli', label: 'Sesli Fal' },
  { key: 'solitaire', label: 'Solitaire Falı' },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<ReadingHistoryType>('tarot');
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([]);

  const load = useCallback(() => {
    getReadingHistory(activeTab).then(setEntries);
  }, [activeTab]);

  useFocusEffect(load);

  const handleDelete = async (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    await deleteReadingHistoryEntry(id);
  };

  const handleClearTab = async () => {
    setEntries([]);
    await clearReadingHistory(activeTab);
  };

  return (
    <MysticTableBackground>
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="time-outline" size={36} color={GOLD_SOFT} />
            <Text style={styles.emptyText}>Bu fal türü için henüz geçmiş yok.</Text>
          </View>
        ) : (
          <>
            <Pressable onPress={handleClearTab} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={14} color={TEXT_MUTED} />
              <Text style={styles.clearButtonText}>Bu geçmişi temizle</Text>
            </Pressable>

            <View style={styles.list}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderTextWrap}>
                      <Text style={styles.cardTitle}>{entry.title}</Text>
                      <Text style={styles.cardDate}>{formatDate(entry.createdAt)}</Text>
                    </View>
                    <Pressable onPress={() => handleDelete(entry.id)} hitSlop={10} style={styles.deleteButton}>
                      <Ionicons name="close-circle-outline" size={18} color={TEXT_MUTED} />
                    </Pressable>
                  </View>
                  <Text style={styles.cardResult}>{entry.result}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD_SOFT,
    paddingVertical: 10,
  },
  tabsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabTextActive: {
    color: NIGHT_CARD,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 48,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginBottom: 14,
  },
  clearButtonText: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textDecorationLine: 'underline',
  },
  list: {
    gap: 14,
  },
  card: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  deleteButton: {
    padding: 2,
  },
  cardResult: {
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
});
