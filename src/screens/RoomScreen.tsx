import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Room, RoomEvent } from 'livekit-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import {
  getRoom,
  takeSeat,
  leaveSeat,
  getRoomMessages,
  sendRoomMessage,
  getRoomVoiceToken,
  type RoomDetail,
  type RoomMessage,
} from '@/services/rooms';
import { avatarColor } from '@/utils/avatarColor';
import { relativeTime } from '@/utils/relativeTime';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Room'>;

const POLL_INTERVAL_MS = 4000;
const MAX_MESSAGE_LENGTH = 500;
type VoiceState = 'idle' | 'connecting' | 'connected' | 'error';

function Seat({ seat, isMe, onPress }: { seat: RoomDetail['seats'][number]; isMe: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.seat}>
      {seat ? (
        <>
          {seat.avatarUrl ? (
            <Image source={{ uri: seat.avatarUrl }} style={styles.seatAvatar} />
          ) : (
            <View style={[styles.seatAvatar, styles.seatAvatarFallback, { backgroundColor: avatarColor(seat.userId) }]}>
              <Text style={styles.seatAvatarText}>{seat.displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={[styles.seatName, isMe && styles.seatNameMine]} numberOfLines={1}>
            {isMe ? 'Sen' : seat.displayName}
          </Text>
        </>
      ) : (
        <View style={styles.seatEmpty}>
          <Ionicons name="add" size={20} color={TEXT_MUTED} />
        </View>
      )}
    </Pressable>
  );
}

export default function RoomScreen({ route }: Props) {
  const { roomId } = route.params;
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [seatBusy, setSeatBusy] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const wasSeatedRef = useRef(false);
  const voiceRoomRef = useRef<Room | null>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([getRoom(roomId), getRoomMessages(roomId)])
      .then(([roomDetail, msgs]) => {
        setDetail(roomDetail);
        setMessages(msgs);
        setError(false);
      })
      .catch(() => {
        if (!silent) setError(true);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [roomId]);

  useEffect(() => {
    getStoredSession().then((session) => setMeId(session?.user.id ?? null));
  }, []);

  const disconnectVoice = useCallback(() => {
    voiceRoomRef.current?.disconnect();
    voiceRoomRef.current = null;
    setVoiceState('idle');
    setMuted(false);
  }, []);

  const connectVoice = useCallback(async () => {
    setVoiceState('connecting');
    try {
      const token = await getRoomVoiceToken(roomId);
      const room = new Room();
      room.on(RoomEvent.Disconnected, () => {
        voiceRoomRef.current = null;
        setVoiceState('idle');
        setMuted(false);
      });
      await room.connect(env.livekitUrl(), token);
      await room.localParticipant.setMicrophoneEnabled(true);
      voiceRoomRef.current = room;
      setVoiceState('connected');
    } catch (err) {
      setVoiceState('error');
      Alert.alert('Sese bağlanılamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    }
  }, [roomId]);

  const toggleMute = useCallback(async () => {
    const room = voiceRoomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
      return () => {
        clearInterval(interval);
        disconnectVoice();
        if (wasSeatedRef.current) leaveSeat(roomId).catch(() => {});
      };
    }, [load, roomId, disconnectVoice]),
  );

  useEffect(() => {
    if (!detail || !meId) return;
    wasSeatedRef.current = detail.seats.some((s) => s?.userId === meId);
  }, [detail, meId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSeatPress = useCallback(
    async (seat: RoomDetail['seats'][number], index: number) => {
      if (seatBusy) return;
      setSeatBusy(true);
      try {
        if (seat?.userId === meId) {
          disconnectVoice();
          await leaveSeat(roomId);
        } else if (!seat) {
          await takeSeat(roomId, index);
        } else {
          return;
        }
        load(true);
      } catch (err) {
        Alert.alert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setSeatBusy(false);
      }
    },
    [roomId, meId, seatBusy, load, disconnectVoice],
  );

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      const message = await sendRoomMessage(roomId, body);
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      Alert.alert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      setText(body);
    } finally {
      setSending(false);
    }
  }, [roomId, text]);

  if (loading) {
    return (
      <MysticTableBackground>
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      </MysticTableBackground>
    );
  }

  if (error || !detail) {
    return (
      <MysticTableBackground>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Oda yüklenemedi — silinmiş olabilir.</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      </MysticTableBackground>
    );
  }

  const iAmSeated = detail.seats.some((s) => s?.userId === meId);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.roomName}>{detail.room.name}</Text>
          <Text style={styles.roomHost}>Kuran: {detail.room.hostName}</Text>

          <View style={styles.seatGrid}>
            {detail.seats.map((seat, index) => (
              <Seat key={index} seat={seat} isMe={seat?.userId === meId} onPress={() => handleSeatPress(seat, index)} />
            ))}
          </View>

          <View style={styles.voiceCallout}>
            {!iAmSeated ? (
              <Text style={styles.voiceCalloutText}>Bir koltuğa oturarak sesli sohbete katılabilirsin.</Text>
            ) : voiceState === 'idle' || voiceState === 'error' ? (
              <Pressable onPress={connectVoice} style={styles.voiceButton}>
                <Ionicons name="mic-outline" size={18} color="#1a0d33" />
                <Text style={styles.voiceButtonText}>Sese Katıl</Text>
              </Pressable>
            ) : voiceState === 'connecting' ? (
              <View style={styles.voiceStatusRow}>
                <ActivityIndicator color={GOLD} />
                <Text style={styles.voiceCalloutText}>Bağlanıyor...</Text>
              </View>
            ) : (
              <View style={styles.voiceConnectedRow}>
                <Pressable onPress={toggleMute} style={[styles.voiceIconButton, muted && styles.voiceIconButtonMuted]}>
                  <Ionicons name={muted ? 'mic-off-outline' : 'mic-outline'} size={18} color={muted ? TEXT_MUTED : GOLD} />
                </Pressable>
                <Text style={styles.voiceConnectedText}>{muted ? 'Mikrofon kapalı' : 'Sesli bağlısın'}</Text>
                <Pressable onPress={disconnectVoice} style={styles.voiceLeaveButton}>
                  <Text style={styles.voiceLeaveButtonText}>Ayrıl</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.chatDivider} />

          {messages.length === 0 && <Text style={styles.emptyText}>Henüz mesaj yok.</Text>}
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.senderId === meId ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              {m.senderId !== meId && <Text style={styles.bubbleSender}>{m.senderName}</Text>}
              <View style={[styles.bubble, m.senderId === meId ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, m.senderId === meId && styles.bubbleTextMine]}>{m.text}</Text>
              </View>
              <Text style={styles.bubbleMeta}>{relativeTime(m.createdAt)}</Text>
            </View>
          ))}
        </ScrollView>

        {iAmSeated ? (
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder="Odaya yaz..."
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
        ) : (
          <View style={styles.joinHint}>
            <Text style={styles.joinHintText}>Yazmak için önce bir koltuğa oturmalısın.</Text>
          </View>
        )}
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  roomName: { fontSize: 19, fontWeight: '800', color: GOLD, textAlign: 'center' },
  roomHost: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 18 },
  seat: { width: 62, alignItems: 'center' },
  seatAvatar: { width: 50, height: 50, borderRadius: 25, marginBottom: 5 },
  seatAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  seatAvatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  seatEmpty: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  seatName: { fontSize: 10.5, color: TEXT_MUTED, textAlign: 'center' },
  seatNameMine: { color: GOLD, fontWeight: '700' },
  voiceCallout: {
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceCalloutText: { fontSize: 12, lineHeight: 18, color: TEXT_PRIMARY, textAlign: 'center' },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  voiceButtonText: { fontSize: 13.5, fontWeight: '800', color: '#1a0d33' },
  voiceStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  voiceConnectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconButtonMuted: { borderColor: GOLD_SOFT },
  voiceConnectedText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: TEXT_PRIMARY },
  voiceLeaveButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  voiceLeaveButtonText: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
  chatDivider: { height: 1, backgroundColor: GOLD_SOFT, marginBottom: 16 },
  emptyText: { fontSize: 12.5, color: TEXT_MUTED, textAlign: 'center', marginTop: 10 },
  bubbleRow: { marginBottom: 10, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubbleSender: { fontSize: 10.5, color: TEXT_MUTED, marginBottom: 2, marginLeft: 4 },
  bubble: { borderRadius: 16, paddingVertical: 9, paddingHorizontal: 13 },
  bubbleMine: { backgroundColor: GOLD, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: NIGHT_CARD, borderWidth: 1, borderColor: GOLD_SOFT, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13.5, lineHeight: 19, color: TEXT_PRIMARY },
  bubbleTextMine: { color: '#1a0d33' },
  bubbleMeta: { fontSize: 10, color: TEXT_MUTED, marginTop: 3, marginHorizontal: 4 },
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
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.45 },
  joinHint: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: GOLD_SOFT, backgroundColor: NIGHT_MID, alignItems: 'center' },
  joinHintText: { fontSize: 12, color: TEXT_MUTED },
});
