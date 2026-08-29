import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getThread, sendMessage, type DMMessage } from '@/services/messages';
import { relativeTime } from '@/utils/relativeTime';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DMThread'>;

const MAX_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 4000;

export default function DMThreadScreen({ route }: Props) {
  const { userId } = route.params;
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    getThread(userId)
      .then((items) => {
        setMessages(items);
        setError(false);
      })
      .catch(() => {
        if (!silent) setError(true);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      const message = await sendMessage(userId, body);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      setText(body);
    } finally {
      setSending(false);
    }
  }, [userId, text]);

  if (loading) {
    return (
      <MysticTableBackground>
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      </MysticTableBackground>
    );
  }

  if (error) {
    return (
      <MysticTableBackground>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Sohbet yüklenemedi.</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      </MysticTableBackground>
    );
  }

  const lastMine = [...messages].reverse().find((m) => m.fromMe);

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
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && <Text style={styles.emptyText}>Henüz mesaj yok — ilk mesajı sen gönder.</Text>}
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.fromMe ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, m.fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, m.fromMe && styles.bubbleTextMine]}>{m.text}</Text>
              </View>
              <Text style={styles.bubbleMeta}>{relativeTime(m.createdAt)}</Text>
            </View>
          ))}
          {lastMine && (
            <Text style={styles.readReceipt}>{lastMine.read ? 'Görüldü' : 'İletildi'}</Text>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={(t) => setText(t.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Bir mesaj yaz..."
            placeholderTextColor={TEXT_MUTED}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !text.trim()}
            style={[styles.sendButton, (sending || !text.trim()) && styles.sendButtonDisabled]}
          >
            {sending ? <ActivityIndicator size="small" color="#1a0d33" /> : <Ionicons name="send" size={16} color="#1a0d33" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  retryText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, flexGrow: 1 },
  emptyText: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginTop: 30 },
  bubbleRow: { marginBottom: 10, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingVertical: 9, paddingHorizontal: 13 },
  bubbleMine: { backgroundColor: GOLD, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: NIGHT_CARD, borderWidth: 1, borderColor: GOLD_SOFT, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13.8, lineHeight: 19, color: TEXT_PRIMARY },
  bubbleTextMine: { color: '#1a0d33' },
  bubbleMeta: { fontSize: 10, color: TEXT_MUTED, marginTop: 3, marginHorizontal: 4 },
  readReceipt: { alignSelf: 'flex-end', fontSize: 10.5, color: TEXT_MUTED, marginRight: 4, marginTop: -4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: GOLD_SOFT,
    backgroundColor: NIGHT_MID,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: NIGHT_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
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
  sendButtonDisabled: { opacity: 0.45 },
});
