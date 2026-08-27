import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = {
  visible: boolean;
  title: string;
  options: string[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export default function PickerModal({ visible, title, options, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const normalizedQuery = query.trim().toLocaleLowerCase('tr');
  const filtered = normalizedQuery
    ? options.filter((option) => option.toLocaleLowerCase('tr').includes(normalizedQuery))
    : options;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ara ya da yaz..."
            placeholderTextColor={TEXT_MUTED}
            style={styles.searchInput}
            autoFocus
          />

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
                style={[styles.optionRow, option === selected && styles.optionRowSelected]}
              >
                <Text style={[styles.optionText, option === selected && styles.optionTextSelected]}>{option}</Text>
                {option === selected && <Ionicons name="checkmark" size={16} color={GOLD} />}
              </Pressable>
            ))}
            {filtered.length === 0 && <Text style={styles.emptyText}>Sonuç bulunamadı</Text>}
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
    maxHeight: '75%',
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  searchInput: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  list: {
    maxHeight: 320,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
  },
  optionText: {
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  optionTextSelected: {
    color: GOLD,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
