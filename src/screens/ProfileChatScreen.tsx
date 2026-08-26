import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  getProfileEntries,
  addProfileEntry,
  deleteProfileEntry,
  clearProfile,
  type ProfileEntry,
} from '@/services/profile';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileChat'>;

const INTRO =
  'Merhaba! Burada kendinle ilgili istediğin her şeyi paylaşabilirsin — ilgi alanların, şu anki ruh halin, hayatındaki bir mesele, ne olursa. Bu bilgiler yalnızca bu cihazda saklanır ve tarot ile rüya yorumlarında sana daha kişisel bir okuma sunmak için kullanılır. 🌙';

const ACKNOWLEDGEMENTS = [
  'Bunu not aldım, teşekkürler.',
  'Anladım, bunu aklımda tutacağım.',
  'Kaydedildi — bundan sonraki yorumlarında bunu göz önünde bulunduracağım.',
  'Teşekkürler, seni biraz daha tanıdım.',
  'Not edildi. Paylaştığın için teşekkürler.',
];

export default function ProfileChatScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<ProfileEntry[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getProfileEntries()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearProfile();
      setEntries([]);
    } catch {
      // sessizce yok say
    } finally {
      setConfirmingClear(false);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        entries.length > 0 ? (
          <Pressable onPress={() => setConfirmingClear(true)} style={styles.headerButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={GOLD} />
            <Text style={styles.headerButtonText}>Temizle</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, entries.length]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setError(null);
    setSaving(true);
    try {
      const next = await addProfileEntry(trimmed);
      setEntries(next);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [input]);

  const remove = useCallback(async (id: string) => {
    try {
      const next = await deleteProfileEntry(id);
      setEntries(next);
    } catch {
      // sessizce yok say; kullanıcı tekrar deneyebilir
    }
  }, []);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={[styles.bubble, styles.bubbleModel]}>
            <Text style={styles.bubbleTextModel}>{INTRO}</Text>
          </View>

          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={GOLD} />
            </View>
          )}

          {entries.map((entry, index) => (
            <View key={entry.id}>
              <View style={styles.userRow}>
                <Pressable onPress={() => remove(entry.id)} style={styles.deleteButton} hitSlop={8}>
                  <Ionicons name="trash-outline" size={14} color={TEXT_MUTED} />
                </Pressable>
                <View style={[styles.bubble, styles.bubbleUser]}>
                  <Text style={styles.bubbleTextUser}>{entry.text}</Text>
                </View>
              </View>
              <View style={[styles.bubble, styles.bubbleModel, styles.ackBubble]}>
                <Text style={styles.bubbleTextModel}>{ACKNOWLEDGEMENTS[index % ACKNOWLEDGEMENTS.length]}</Text>
              </View>
            </View>
          ))}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#E08A8A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {confirmingClear && (
            <View style={styles.confirmBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#E08A8A" />
              <Text style={styles.confirmText}>
                Tüm bilgilerin kalıcı olarak silinecek. Emin misin?
              </Text>
              <View style={styles.confirmActions}>
                <Pressable onPress={clearAll} style={[styles.confirmButton, styles.confirmYes]}>
                  <Text style={styles.confirmYesText}>Evet, sil</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmingClear(false)} style={styles.confirmButton}>
                  <Text style={styles.confirmNoText}>Hayır</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Kendinden bahset..."
            placeholderTextColor={TEXT_MUTED}
            style={styles.input}
            multiline
            editable={!saving}
          />
          <Pressable
            onPress={send}
            disabled={saving || !input.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              (pressed || saving || !input.trim()) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons name="send" size={18} color={NIGHT_CARD} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: GOLD,
    borderBottomRightRadius: 4,
  },
  bubbleModel: {
    alignSelf: 'flex-start',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderBottomLeftRadius: 4,
  },
  ackBubble: {
    marginTop: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  deleteButton: {
    padding: 4,
  },
  bubbleTextUser: {
    fontSize: 14,
    lineHeight: 21,
    color: NIGHT_CARD,
    fontWeight: '500',
  },
  bubbleTextModel: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: GOLD_SOFT,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  headerButtonText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },
  confirmBox: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  confirmText: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  confirmYes: {
    backgroundColor: '#E08A8A',
    borderColor: '#E08A8A',
  },
  confirmYesText: {
    fontSize: 12.5,
    color: NIGHT_CARD,
    fontWeight: '700',
  },
  confirmNoText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
});
