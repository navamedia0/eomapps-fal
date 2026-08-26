import { useCallback, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import type { ChatTurn } from '@/services/gemini';
import { interpretDreamChat } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DreamChat'>;

const GREETING = 'Merhaba, ben rüya rehberinim. Bana gördüğün rüyayı anlatabilirsin; birlikte sembollerinin izini süreriz. 🌙';

export default function DreamChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<ChatTurn[]>([{ role: 'model', text: GREETING }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(
    async (overrideHistory?: ChatTurn[]) => {
      const trimmed = input.trim();
      const history = overrideHistory ?? [...messages, { role: 'user', text: trimmed } as ChatTurn];
      if (!overrideHistory) {
        if (!trimmed) return;
        setMessages(history);
        setInput('');
      }
      setError(null);
      setSending(true);
      try {
        const remaining = await getCredits();
        if (remaining < 1) {
          setBlocked('Bugünkü ücretsiz fal hakkın doldu. Yarın tekrar buradayız ✨');
          return;
        }
        const firstUserIndex = history.findIndex((turn) => turn.role === 'user');
        const apiHistory = firstUserIndex >= 0 ? history.slice(firstUserIndex) : history;
        const reply = await interpretDreamChat(apiHistory);
        await spendCredit();
        setMessages([...history, { role: 'model', text: reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rüya yorumlanırken bir sorun oluştu.');
      } finally {
        setSending(false);
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      }
    },
    [input, messages],
  );

  const retry = useCallback(() => {
    setError(null);
    send(messages);
  }, [messages, send]);

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
          {messages.map((message, index) => (
            <View
              key={index}
              style={[styles.bubble, message.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}
            >
              <Text style={message.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextModel}>
                {message.text}
              </Text>
            </View>
          ))}

          {sending && (
            <View style={[styles.bubble, styles.bubbleModel, styles.bubbleLoading]}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={styles.bubbleTextModel}>Rüyan yorumlanıyor...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#E08A8A" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={retry} style={styles.retryButton}>
                <MaterialCommunityIcons name="refresh" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </Pressable>
            </View>
          )}

          {blocked && (
            <View style={styles.blockedBox}>
              <Ionicons name="moon" size={20} color={GOLD} />
              <Text style={styles.blockedText}>{blocked}</Text>
              <Pressable onPress={() => navigation.navigate('Home')} style={styles.retryButton}>
                <Ionicons name="home-outline" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Ana Sayfaya Dön</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {!blocked && (
          <View style={styles.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Rüyanı anlat..."
              placeholderTextColor={TEXT_MUTED}
              style={styles.input}
              multiline
              editable={!sending}
            />
            <Pressable
              onPress={() => send()}
              disabled={sending || !input.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                (pressed || sending || !input.trim()) && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons name="send" size={18} color={NIGHT_CARD} />
            </Pressable>
          </View>
        )}
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
  bubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderColor: 'rgba(212, 175, 55, 0.55)',
    borderBottomRightRadius: 6,
  },
  bubbleModel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18, 22, 59, 0.92)',
    borderColor: GOLD_SOFT,
    borderBottomLeftRadius: 6,
  },
  bubbleLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bubbleTextUser: {
    fontSize: 14,
    lineHeight: 21,
    color: '#F5EED8',
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
  blockedBox: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: GOLD_SOFT,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  blockedText: {
    color: TEXT_PRIMARY,
    fontSize: 13.5,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
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
});
