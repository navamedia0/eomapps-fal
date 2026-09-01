import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import ShareButton from '@/components/ShareButton';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { GOLD, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type HistoryFilter = ReadingHistoryType;

const TABS: Array<{ key: HistoryFilter; label: string; icon: string }> = [
  { key: 'all', label: 'Tümü', icon: 'sparkles' },
  { key: 'kahve', label: 'Kahve Falı', icon: 'cafe' },
  { key: 'tarot', label: 'Tarot', icon: 'cards-playing-outline' },
  { key: 'katina', label: 'Katina Aşk', icon: 'heart' },
  { key: 'el', label: 'El Falı', icon: 'hand-left' },
  { key: 'yuz', label: 'Yüz Falı', icon: 'person' },
  { key: 'ruya', label: 'Rüya Tabirleri', icon: 'moon' },
  { key: 'sufal', label: 'Su Falı', icon: 'water' },
  { key: 'wax', label: 'Balmumu Falı', icon: 'flame' },
  { key: 'iskambil', label: 'İskambil', icon: 'cards' },
  { key: 'angel', label: 'Melek Kartları', icon: 'flower' },
  { key: 'bakla', label: '41 Bakla', icon: 'grid' },
  { key: 'lenormand', label: 'Lenormand', icon: 'navigate' },
  { key: 'rune', label: 'Rün Falı', icon: 'diamond' },
  { key: 'iching', label: 'I Ching', icon: 'sync' },
  { key: 'osho_zen', label: 'Osho Zen', icon: 'leaf' },
  { key: 'thoth', label: 'Mısır Thoth', icon: 'book' },
  { key: 'sesli', label: 'Sesli Fal', icon: 'mic' },
  { key: 'dogumHaritasi', label: 'Doğum Haritası', icon: 'planet' },
];

const TYPE_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  kahve: { label: 'KAHVE ARŞİVİ', color: '#D97706', icon: 'cafe' },
  tarot: { label: 'TAROT DOSYASI', color: '#F59E0B', icon: 'cards-playing-outline' },
  katina: { label: 'KATİNA AŞK DOSYASI', color: '#E11D48', icon: 'heart' },
  el: { label: 'EL FALİ ARŞİVİ', color: '#EC4899', icon: 'hand-left' },
  yuz: { label: 'YÜZ ANALİZİ DOSYASI', color: '#8B5CF6', icon: 'person' },
  ruya: { label: 'RÜYA & BİLİNÇALTI', color: '#6366F1', icon: 'moon' },
  sufal: { label: 'SU FALI VİZYONU', color: '#38BDF8', icon: 'water' },
  wax: { label: 'BALMUMU & AŞK', color: '#F97316', icon: 'flame' },
  iskambil: { label: 'İSKAMBİL SARAYI', color: '#E11D48', icon: 'cards' },
  angel: { label: 'MELEK IŞIK KARTI', color: '#C084FC', icon: 'flower' },
  bakla: { label: '41 BAKLA REMİLİ', color: '#10B981', icon: 'grid' },
  lenormand: { label: 'LENORMAND DOSYASI', color: '#06B6D4', icon: 'navigate' },
  rune: { label: 'NORDİK RÜN DOSYASI', color: '#38BDF8', icon: 'diamond' },
  iching: { label: 'I CHING HEKSAGRAMI', color: '#EF4444', icon: 'sync' },
  osho_zen: { label: 'OSHO ZEN BİLGELİĞİ', color: '#14B8A6', icon: 'leaf' },
  thoth: { label: 'MISIR THOTH SİMYASI', color: '#EAB308', icon: 'book' },
  sesli: { label: 'CANLI SESLİ DANIŞMAN', color: '#F43F5E', icon: 'mic' },
  dogumHaritasi: { label: 'ASTROLOJİ DOĞUM HARİTASI', color: '#A855F7', icon: 'planet' },
  solitaire: { label: 'SOLITAIRE FALİ', color: '#3B82F6', icon: 'albums' },
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// GENEL ARŞİV DOSYASI DETAY MODALI
function ReadingDossierModal({
  entry,
  onClose,
}: {
  entry: ReadingHistoryEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  const badgeInfo = TYPE_BADGES[entry.type] || {
    label: 'KADİM FAL DOSYASI',
    color: GOLD,
    icon: 'folder-open',
  };

  const dreamMessages = entry.metadata?.messages as Array<{ role: string; text: string }> | undefined;

  return (
    <Modal visible={!!entry} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalTopBar}>
            <View style={[styles.modalBadge, { borderColor: badgeInfo.color }]}>
              <Ionicons name={badgeInfo.icon as any} size={14} color={badgeInfo.color} />
              <Text style={[styles.modalBadgeText, { color: badgeInfo.color }]}>{badgeInfo.label}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalCloseBtn} hitSlop={10}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>{entry.title}</Text>
            <Text style={styles.modalDate}>Arşiv Tarihi: {formatDate(entry.createdAt)}</Text>

            {/* Rüya Sohbet Geçmişi */}
            {dreamMessages && dreamMessages.length > 0 ? (
              <View style={styles.dreamChatBox}>
                <Text style={styles.dreamChatHeading}>Rüya & Sohbet Diyaloğu:</Text>
                {dreamMessages.map((msg, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.chatBubble,
                      msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleModel,
                    ]}
                  >
                    <Text style={styles.chatBubbleRole}>
                      {msg.role === 'user' ? '👤 Sen:' : '🌙 Rüya Rehberi:'}
                    </Text>
                    <Text style={styles.chatBubbleText}>{msg.text}</Text>
                  </View>
                ))}
              </View>
            ) : (
              /* Normal Fal Yorum Parşömeni */
              <View style={styles.parchmentContainer}>
                <Text style={styles.parchmentText}>{entry.result}</Text>
              </View>
            )}

            <View style={styles.modalShareWrap}>
              <ShareButton text={`Mistik Rehber - ${entry.title}\n\n${entry.result}`} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryFilter>('all');
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<ReadingHistoryEntry | null>(null);
  const [selectedBirthChart, setSelectedBirthChart] = useState<ReadingHistoryEntry | null>(null);

  const load = useCallback(() => {
    getReadingHistory(activeTab).then(setEntries);
  }, [activeTab]);

  useFocusEffect(load);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    await deleteReadingHistoryEntry(id);
  };

  const confirmClear = async () => {
    setConfirmClearAll(false);
    setEntries([]);
    await clearReadingHistory(activeTab);
  };

  const handleOpenDossier = (entry: ReadingHistoryEntry) => {
    if (entry.type === 'dogumHaritasi') {
      setSelectedBirthChart(entry);
    } else {
      setSelectedDossier(entry);
    }
  };

  return (
    <MysticTableBackground>
      {/* 1. ÜST KATEGORİ ÇUBUĞU (Yatay Filtre Hapları) */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={tab.icon as any} size={13} color={active ? '#000000' : GOLD} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={36} color={GOLD} />
            </View>
            <Text style={styles.emptyTitle}>Arşiv Dosyası Bulunamadı</Text>
            <Text style={styles.emptyText}>
              Seçilen kategoride henüz kaydedilmiş bir fal veya analiz kaydı bulunmuyor.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.toolbar}>
              <Text style={styles.toolbarCount}>{entries.length} Arşiv Kaydı</Text>
              <Pressable onPress={() => setConfirmClearAll(true)} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={13} color={TEXT_MUTED} />
                <Text style={styles.clearButtonText}>Temizle</Text>
              </Pressable>
            </View>

            {/* MİSTİK ARŞİV DOSYALARI (Dossier Card List) */}
            <View style={styles.list}>
              {entries.map((entry) => {
                const isBirthChart = entry.type === 'dogumHaritasi';
                const badgeInfo = TYPE_BADGES[entry.type] || {
                  label: 'KADİM FAL DOSYASI',
                  color: GOLD,
                  icon: 'folder-open',
                };
                const chart = entry.metadata?.detailedChart;

                return (
                  <View key={entry.id} style={styles.dossierCard}>
                    {/* Arşiv Klasör Üst Başlığı */}
                    <View style={styles.dossierHeaderRow}>
                      <View style={[styles.dossierBadge, { borderColor: badgeInfo.color + '66' }]}>
                        <Ionicons name={badgeInfo.icon as any} size={13} color={badgeInfo.color} />
                        <Text style={[styles.dossierBadgeText, { color: badgeInfo.color }]}>
                          {badgeInfo.label}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setPendingDeleteId(entry.id)}
                        hitSlop={10}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={16} color={TEXT_MUTED} />
                      </Pressable>
                    </View>

                    {/* Dosya Başlığı & Tarih */}
                    <Text style={styles.dossierTitle} numberOfLines={2}>
                      {entry.title}
                    </Text>
                    <Text style={styles.dossierDate}>{formatDate(entry.createdAt)}</Text>

                    {/* Doğum Haritası Etiketleri */}
                    {isBirthChart && chart && (
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
                      </View>
                    )}

                    {/* Fal Önizleme Metni */}
                    {!isBirthChart && entry.result && (
                      <Text style={styles.dossierPreview} numberOfLines={2}>
                        {entry.result.replace(/\n+/g, ' ')}
                      </Text>
                    )}

                    {/* Dosyayı Aç Aksiyon Butonu */}
                    <Pressable
                      onPress={() => handleOpenDossier(entry)}
                      style={({ pressed }) => [styles.dossierOpenBtn, pressed && styles.btnPressed]}
                    >
                      <Ionicons name="folder-open" size={15} color="#000000" />
                      <Text style={styles.dossierOpenBtnText}>Arşiv Dosyasını Aç & Oku</Text>
                      <Ionicons name="arrow-forward" size={14} color="#000000" style={{ marginLeft: 2 }} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* DETAY MODALLARI */}
      <ReadingDossierModal
        entry={selectedDossier}
        onClose={() => setSelectedDossier(null)}
      />

      <BirthChartDossierModal
        visible={!!selectedBirthChart}
        entry={selectedBirthChart}
        onClose={() => setSelectedBirthChart(null)}
      />

      <ConfirmModal
        visible={!!pendingDeleteId}
        title="Arşiv Kaydını Sil"
        message="Bu fal kaydını arşivden kalıcı olarak silmek istediğine emin misin?"
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmModal
        visible={confirmClearAll}
        title="Geçmişi Temizle"
        message="Bu kategorideki tüm arşiv kayıtlarını silmek istediğine emin misin?"
        confirmLabel="Tümünü Temizle"
        cancelLabel="Vazgeç"
        onConfirm={confirmClear}
        onCancel={() => setConfirmClearAll(false)}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabsRow: {
    paddingHorizontal: 12,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 48,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  toolbarCount: {
    fontSize: 11.5,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearButtonText: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  dossierCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 14,
  },
  dossierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dossierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.8,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dossierBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
  },
  dossierTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 19,
  },
  dossierDate: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  dossierPreview: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 17,
    marginBottom: 12,
  },
  dossierTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  dossierTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dossierTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
  },
  dossierOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 11,
    paddingVertical: 9,
  },
  dossierOpenBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#000000',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '88%',
    backgroundColor: '#0D0D10',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 24,
  },
  modalDate: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  parchmentContainer: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 18,
  },
  parchmentText: {
    fontSize: 14,
    lineHeight: 23,
    color: '#F4F4F5',
    fontWeight: '500',
  },
  dreamChatBox: {
    gap: 10,
    marginBottom: 18,
  },
  dreamChatHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 14,
  },
  chatBubbleUser: {
    backgroundColor: '#1E1B2E',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  chatBubbleModel: {
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    maxWidth: '96%',
  },
  chatBubbleRole: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
    marginBottom: 3,
  },
  chatBubbleText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  modalShareWrap: {
    alignItems: 'center',
  },
});
