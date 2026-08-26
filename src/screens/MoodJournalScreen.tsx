import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { getMoodEntries, addMoodEntry, deleteMoodEntry, type MoodEntry } from '@/services/moodJournal';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MOODS = [
  { emoji: '😊', label: 'Mutlu' },
  { emoji: '😌', label: 'Huzurlu' },
  { emoji: '😐', label: 'Nötr' },
  { emoji: '😔', label: 'Üzgün' },
  { emoji: '😟', label: 'Kaygılı' },
  { emoji: '😡', label: 'Kızgın' },
  { emoji: '😴', label: 'Yorgun' },
  { emoji: '🥰', label: 'Sevgi Dolu' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function MoodJournalScreen() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMoodEntries().then(setEntries);
  }, []);

  const save = useCallback(async () => {
    if (!selectedMood) return;
    setSaving(true);
    try {
      const next = await addMoodEntry(selectedMood, note);
      setEntries(next);
      setSelectedMood(null);
      setNote('');
    } finally {
      setSaving(false);
    }
  }, [selectedMood, note]);

  const remove = useCallback(async (id: string) => {
    const next = await deleteMoodEntry(id);
    setEntries(next);
  }, []);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Bugün nasıl hissediyorsun?</Text>

          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const isSelected = selectedMood === mood.label;
              return (
                <Pressable
                  key={mood.label}
                  onPress={() => setSelectedMood(mood.label)}
                  style={[styles.moodChip, isSelected && styles.moodChipSelected]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>{mood.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="İstersen birkaç kelimeyle açıkla (isteğe bağlı)"
            placeholderTextColor={TEXT_MUTED}
            style={styles.input}
            multiline
          />

          <Pressable
            onPress={save}
            disabled={!selectedMood || saving}
            style={({ pressed }) => [
              styles.saveButton,
              (!selectedMood || saving || pressed) && styles.saveButtonDisabled,
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={NIGHT_CARD} />
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </Pressable>

          {entries.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Geçmiş Kayıtların</Text>
              {entries.map((entry) => {
                const mood = MOODS.find((m) => m.label === entry.mood);
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <Text style={styles.entryEmoji}>{mood?.emoji ?? '💭'}</Text>
                    <View style={styles.entryTextWrap}>
                      <Text style={styles.entryMood}>{entry.mood}</Text>
                      {!!entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
                      <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                    </View>
                    <Pressable onPress={() => remove(entry.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={TEXT_MUTED} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 18,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  moodChip: {
    alignItems: 'center',
    gap: 4,
    width: '22.5%',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 10,
  },
  moodChipSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 9.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: NIGHT_CARD,
    fontWeight: '700',
  },
  input: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 28,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  historySection: {
    gap: 10,
  },
  historyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    padding: 12,
  },
  entryEmoji: {
    fontSize: 20,
  },
  entryTextWrap: {
    flex: 1,
  },
  entryMood: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  entryNote: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    marginTop: 2,
  },
  entryDate: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    marginTop: 4,
  },
});
