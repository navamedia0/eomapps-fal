import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TarotCardDef } from '@/services/tarot';
import { getTarotMeaning } from '@/services/tarotMeanings';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  card: TarotCardDef | null;
  onClose: () => void;
};

export default function CardStoryModal({ card, onClose }: Props) {
  const meaning = card ? getTarotMeaning(card.id) : undefined;

  return (
    <Modal visible={!!card} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Ionicons name="book-outline" size={18} color={GOLD} />
            <Text style={styles.title}>{card?.name}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {meaning ? (
              <>
                <Text style={styles.story}>{meaning.story}</Text>

                <View style={styles.meaningRow}>
                  <Text style={styles.meaningLabel}>DÜZ</Text>
                  <Text style={styles.meaningText}>{meaning.upright}</Text>
                </View>
                <View style={styles.meaningRow}>
                  <Text style={styles.meaningLabel}>TERS</Text>
                  <Text style={styles.meaningText}>
                    {meaning.reversed || 'Bu kart için ayrı bir ters anlam kaydedilmemiş.'}
                  </Text>
                </View>

                <Text style={styles.sourceNote}>
                  Kaynak: A.E. Waite, The Pictorial Key to the Tarot (1910)
                </Text>
              </>
            ) : (
              <Text style={styles.story}>Bu kart için hikaye bulunamadı.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 12, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  closeButton: {
    padding: 2,
  },
  body: {
    maxHeight: 420,
  },
  story: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  meaningRow: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 12,
    marginBottom: 10,
  },
  meaningLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
    marginBottom: 5,
  },
  meaningText: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  sourceNote: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
