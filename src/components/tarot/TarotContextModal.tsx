import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addProfileEntry } from '@/services/profile';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const QUESTIONS = [
  'Bugün nasıl hissediyorsun?',
  'Hayatında yolunda gitmeyen bir şey var mı?',
  'Olmasını çok istediğin bir şey var mı?',
  'Şu anda en çok neyi merak ediyorsun?',
  'İçinden atamadığın bir duygu var mı?',
  'Hayatında değişmesini istediğin bir şey var mı?',
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Optional, skippable pre-reading check-in. Answers are saved as ordinary
// profile entries (same store ProfileChatScreen writes to) so every future
// reading's buildProfileBlock() picks them up automatically — the AI is told
// to weave them in without ever naming this as its source.
export default function TarotContextModal({ visible, onClose }: Props) {
  const [freeform, setFreeform] = useState('');
  const [answers, setAnswers] = useState<string[]>(QUESTIONS.map(() => ''));
  const [saving, setSaving] = useState(false);

  const setAnswer = (index: number, value: string) => {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const trimmedFreeform = freeform.trim();
      if (trimmedFreeform) await addProfileEntry(trimmedFreeform);
      for (let i = 0; i < QUESTIONS.length; i += 1) {
        const trimmed = answers[i].trim();
        if (trimmed) await addProfileEntry(`${QUESTIONS[i]} — ${trimmed}`);
      }
    } finally {
      setSaving(false);
      setFreeform('');
      setAnswers(QUESTIONS.map(() => ''));
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={GOLD} />
            <Text style={styles.title}>Kendinden Bahsetmek İster misin?</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={TEXT_MUTED} />
            </Pressable>
          </View>
          <Text style={styles.hint}>
            İstersen birkaç soruya cevap ver — falın, senin şu anki halini sessizce göz önünde bulundurarak yorumlanır.
            Tamamen isteğe bağlı, boş bırakabilirsin.
          </Text>

          <View style={styles.storageNotice}>
            <Ionicons name="information-circle-outline" size={15} color={GOLD} />
            <Text style={styles.storageNoticeText}>
              Buradaki bilgiler Profil &gt; Kendinden Bahsetmek İster misin bölümünde saklanır, dilediğin zaman silebilirsin.
            </Text>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.freeformBlock}>
              <Text style={styles.freeformLabel}>Aklından geçeni özgürce yaz</Text>
              <TextInput
                value={freeform}
                onChangeText={setFreeform}
                placeholder="Ne hissediyorsun, ne düşünüyorsun... istediğin gibi yaz"
                placeholderTextColor={TEXT_MUTED}
                style={[styles.input, styles.freeformInput]}
                multiline
              />
            </View>

            <Text style={styles.sectionDivider}>İstersen aşağıdaki sorulara da cevap verebilirsin</Text>

            {QUESTIONS.map((question, index) => (
              <View key={question} style={styles.questionBlock}>
                <Text style={styles.question}>{question}</Text>
                <TextInput
                  value={answers[index]}
                  onChangeText={(value) => setAnswer(index, value)}
                  placeholder="Yazmak istersen..."
                  placeholderTextColor={TEXT_MUTED}
                  style={styles.input}
                  multiline
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Atla</Text>
            </Pressable>
            <Pressable onPress={save} disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
              <Ionicons name="checkmark" size={16} color={NIGHT_CARD} />
              <Text style={styles.saveButtonText}>Kaydet ve Devam Et</Text>
            </Pressable>
          </View>
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
    maxHeight: '85%',
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
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  closeButton: {
    padding: 2,
  },
  hint: {
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
    marginBottom: 10,
  },
  storageNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  storageNoticeText: {
    flex: 1,
    fontSize: 11,
    color: GOLD,
    lineHeight: 15,
  },
  body: {
    maxHeight: 340,
  },
  freeformBlock: {
    marginBottom: 16,
  },
  freeformLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  freeformInput: {
    minHeight: 74,
  },
  sectionDivider: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  questionBlock: {
    marginBottom: 14,
  },
  question: {
    fontSize: 12.5,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 6,
  },
  input: {
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: TEXT_PRIMARY,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
});
