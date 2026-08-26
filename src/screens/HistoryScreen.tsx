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
import ConfirmModal from '@/components/ConfirmModal';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const load = useCallback(() => {
    getReadingHistory(activeTab).then(setEntries);
    setExpandedId(null);
  }, [activeTab]);

  useFocusEffect(load);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (expandedId === id) setExpandedId(null);
    await deleteReadingHistoryEntry(id);
  };

  const confirmClear = async () => {
    setConfirmClearAll(false);
    setEntries([]);
    setExpandedId(null);
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
            <Pressable onPress={() => setConfirmClearAll(true)} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={14} color={TEXT_MUTED} />
              <Text style={styles.clearButtonText}>Bu geçmişi temizle</Text>
            </Pressable>

            <View style={styles.list}>
              {entries.map((entry) => {
                const expanded = expandedId === entry.id;
                return (
                  <View key={entry.id} style={styles.card}>
                    <Pressable
                      onPress={() => setExpandedId(expanded ? null : entry.id)}
                      style={styles.row}
                    >
                      <View style={styles.rowIconWrap}>
                        <Ionicons name="sparkles-outline" size={16} color={GOLD} />
                      </View>
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowTitle}>{entry.title}</Text>
                        <Text style={styles.rowDate}>{formatDate(entry.createdAt)}</Text>
                      </View>
                      <Pressable onPress={() => setPendingDeleteId(entry.id)} hitSlop={10} style={styles.deleteButton}>
                        <Ionicons name="close-circle-outline" size={18} color={TEXT_MUTED} />
                      </Pressable>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={GOLD}
                        style={styles.chevron}
                      />
                    </Pressable>
                    {expanded && (
                      <View style={styles.resultWrap}>
                        <View style={styles.divider} />
                        <Text style={styles.cardResult}>{entry.result}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={pendingDeleteId !== null}
        title="Bu falı silmek istediğine emin misin?"
        message="Bu fal geçmişten kalıcı olarak silinecek."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmModal
        visible={confirmClearAll}
        title="Tüm geçmişi temizlemek istediğine emin misin?"
        message={`${TABS.find((t) => t.key === activeTab)?.label} geçmişindeki tüm fallar kalıcı olarak silinecek.`}
        onConfirm={confirmClear}
        onCancel={() => setConfirmClearAll(false)}
      />
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
    gap: 12,
  },
  card: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  deleteButton: {
    padding: 2,
  },
  chevron: {
    marginLeft: 2,
  },
  resultWrap: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: GOLD_SOFT,
    opacity: 0.5,
    marginBottom: 12,
  },
  cardResult: {
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
});
