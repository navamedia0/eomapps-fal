import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { IskambilCardDetail } from '@/services/katinaMeanings';
import PlayingCardFace from '@/components/PlayingCardFace';
import type { KatinaSuit } from '@/services/katina';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  cardId: string | null;
  detail: IskambilCardDetail | null;
  suit: KatinaSuit | null;
  rankSlug: string | null;
  onClose: () => void;
};

export default function IskambilStoryModal({ cardId, detail, suit, rankSlug, onClose }: Props) {
  if (!cardId || !detail || !suit || !rankSlug) return null;

  return (
    <Modal visible={!!cardId} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="book-outline" size={18} color={GOLD} />
              <Text style={styles.title}>{detail.name}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={TEXT_MUTED} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Kart Önizleme ve Karakter Bilgisi */}
            <View style={styles.cardPreviewRow}>
              <PlayingCardFace suit={suit} rankSlug={rankSlug} size={70} />
              <View style={styles.cardPreviewText}>
                <Text style={styles.figureTitle}>{detail.figure}</Text>
                <Text style={styles.elementBadge}>{detail.element}</Text>
              </View>
            </View>

            {/* Tarihsel ve Mitolojik Hikaye */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} />
                <Text style={styles.sectionTitle}>Tarihsel ve Efsanevi Hikayesi</Text>
              </View>
              <Text style={styles.storyText}>{detail.story}</Text>
            </View>

            {/* Fal Anlamı ve Mesajı */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={15} color={GOLD} />
                <Text style={styles.sectionTitle}>Kartın Fal Anlamı</Text>
              </View>
              <Text style={styles.meaningText}>{detail.meaning}</Text>
            </View>

            {/* Mistik Tavsiye */}
            <View style={[styles.sectionBox, styles.adviceBox]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={16} color={GOLD} />
                <Text style={styles.sectionTitle}>Mistik Tavsiye</Text>
              </View>
              <Text style={styles.adviceText}>{detail.advice}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 4, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '84%',
    backgroundColor: NIGHT_CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 20,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.15)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    marginTop: 14,
  },
  cardPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(15, 10, 32, 0.5)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
  },
  cardPreviewText: {
    flex: 1,
    gap: 4,
  },
  figureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  elementBadge: {
    fontSize: 11.5,
    fontWeight: '600',
    color: GOLD_SOFT,
  },
  sectionBox: {
    backgroundColor: 'rgba(20, 12, 42, 0.65)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.12)',
  },
  adviceBox: {
    backgroundColor: 'rgba(38, 22, 70, 0.7)',
    borderColor: 'rgba(242, 200, 121, 0.3)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.3,
  },
  storyText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  meaningText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  adviceText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: GOLD_SOFT,
    fontStyle: 'italic',
  },
});
