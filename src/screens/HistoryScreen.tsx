import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import BirthChartDossierModal from '@/components/BirthChartDossierModal';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const TABS: Array<{ key: ReadingHistoryType; label: string }> = [
  { key: 'dogumHaritasi', label: 'Doğum Haritası' },
  { key: 'kahve', label: 'Kahve Falı' },
  { key: 'tarot', label: 'Tarot Falı' },
  { key: 'el', label: 'El Falı' },
  { key: 'katina', label: 'Katina Falı' },
  { key: 'sesli', label: 'Sesli Fal' },
  { key: 'solitaire', label: 'Solitaire Falı' },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<ReadingHistoryType>('dogumHaritasi');
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<ReadingHistoryEntry | null>(null);

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
            <Text style={styles.emptyText}>Bu kategori için henüz arşivlenmiş bir analiz yok.</Text>
          </View>
        ) : (
          <>
            <Pressable onPress={() => setConfirmClearAll(true)} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={14} color={TEXT_MUTED} />
              <Text style={styles.clearButtonText}>Bu geçmişi temizle</Text>
            </Pressable>

            <View style={styles.list}>
              {entries.map((entry) => {
                const isBirthChart = entry.type === 'dogumHaritasi';

                // DOĞUM HARİTASI İÇİN KLASÖR / ARŞİV DOSYASI GÖRÜNÜMÜ
                if (isBirthChart) {
                  const chart = entry.metadata?.detailedChart;
                  return (
                    <View key={entry.id} style={styles.dossierCard}>
                      <View style={styles.dossierHeaderRow}>
                        <View style={styles.dossierBadge}>
                          <MaterialCommunityIcons name="folder-star" size={14} color="#1A0D33" />
                          <Text style={styles.dossierBadgeText}>ASTROLOJİ ARŞİV DOSYASI</Text>
                        </View>
                        <Pressable onPress={() => setPendingDeleteId(entry.id)} hitSlop={10} style={styles.deleteButton}>
                          <Ionicons name="trash-outline" size={16} color={TEXT_MUTED} />
                        </Pressable>
                      </View>

                      <Text style={styles.dossierTitle}>{entry.title}</Text>
                      <Text style={styles.dossierDate}>{formatDate(entry.createdAt)}</Text>

                      {chart && (
                        <View style={styles.dossierTagsRow}>
                          <View style={styles.dossierTag}>
                            <Text style={styles.dossierTagText}>
                              ☉ {ZODIAC_INFO[chart.sunSign as keyof typeof ZODIAC_INFO]?.name || ''}
                            </Text>
                          </View>
                          <View style={styles.dossierTag}>
                            <Text style={styles.dossierTagText}>
                              ☽ {ZODIAC_INFO[chart.moonSign as keyof typeof ZODIAC_INFO]?.name || ''}
                            </Text>
                          </View>
                          <View style={styles.dossierTag}>
                            <Text style={styles.dossierTagText}>
                              ASC {ZODIAC_INFO[chart.risingSign as keyof typeof ZODIAC_INFO]?.name || ''}
                            </Text>
                          </View>
                          {chart.advanced?.love?.soulmateSigns?.[0] && (
                            <View style={[styles.dossierTag, { backgroundColor: 'rgba(244, 114, 182, 0.2)' }]}>
                              <Text style={[styles.dossierTagText, { color: '#F472B6' }]}>
                                Ruh Eşi: %{chart.advanced.love.soulmateSigns[0].score}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      <Pressable
                        onPress={() => setSelectedDossier(entry)}
                        style={({ pressed }) => [styles.dossierOpenBtn, pressed && { opacity: 0.85 }]}
                      >
                        <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#1A0D33" />
                        <Text style={styles.dossierOpenBtnText}>Dosyayı Aç ve Bütün Detayı İncele</Text>
                        <MaterialCommunityIcons name="star-crescent" size={14} color="#1A0D33" />
                      </Pressable>
                    </View>
                  );
                }

                // DİĞER STANDART FALLAR İÇİN KART
                const expanded = expandedId === entry.id;
                return (
                  <View key={entry.id} style={styles.card}>
                    <Pressable
                      onPress={() => setExpandedId(expanded ? null : entry.id)}
                      style={styles.row}
                    >
                      <View style={styles.rowIconWrap}>
                        <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} />
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

      {/* DOĞUM HARİTASI DETAYLI ARŞİV DOSYASI MODALI */}
      <BirthChartDossierModal
        visible={selectedDossier !== null}
        onClose={() => setSelectedDossier(null)}
        entry={selectedDossier}
      />

      <ConfirmModal
        visible={pendingDeleteId !== null}
        title="Bu falı silmek istediğine emin misin?"
        message="Bu kayıt arşivden kalıcı olarak silinecek."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmModal
        visible={confirmClearAll}
        title="Tüm geçmişi temizlemek istediğine emin misin?"
        message={`${TABS.find((t) => t.key === activeTab)?.label} geçmişindeki tüm kayıtlar kalıcı olarak silinecek.`}
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
    paddingHorizontal: 14,
  },
  tabActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tabText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  rowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  rowDate: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  chevron: {
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
  resultWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: GOLD_SOFT,
    marginBottom: 12,
  },
  cardResult: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  // DOSYA / KLASÖR GÖRÜNÜM STİLLERİ
  dossierCard: {
    backgroundColor: 'rgba(30, 30, 32, 0.95)',
    borderWidth: 1.3,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dossierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dossierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  dossierBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A0D33',
    letterSpacing: 0.5,
  },
  dossierTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dossierDate: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '600',
  },
  dossierTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  dossierTag: {
    backgroundColor: 'rgba(8, 7, 8, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  dossierTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  dossierOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  dossierOpenBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A0D33',
    letterSpacing: 0.3,
  },
});
