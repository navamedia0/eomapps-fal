import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DreamLibraryEntry } from '@/services/dreamLibrary';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  entry: DreamLibraryEntry | null;
  onClose: () => void;
};

export default function DreamEntryModal({ entry, onClose }: Props) {
  return (
    <Modal visible={!!entry} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Ionicons name="moon" size={18} color={GOLD} />
            <Text style={styles.title}>{entry?.title}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </Pressable>
          </View>
          {entry && <Text style={styles.category}>{entry.category.toLocaleUpperCase('tr')}</Text>}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.content}>{entry?.content}</Text>
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
    marginBottom: 4,
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
  category: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
    marginBottom: 14,
  },
  body: {
    maxHeight: 420,
  },
  content: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
});
