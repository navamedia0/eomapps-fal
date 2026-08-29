import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import ConfirmModal from '@/components/ConfirmModal';
import { showAlert } from '@/services/themedAlert';
import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import {
  getRoom,
  takeSeat,
  leaveSeat,
  getRoomMessages,
  sendRoomMessage,
  getRoomVoiceToken,
  pingRoomViewer,
  leaveRoomViewer,
  updateRoom,
  closeRoom,
  clearRoomMessages,
  banRoomUser,
  muteRoomUser,
  ROOM_TOPICS,
  type RoomDetail,
  type RoomMessage,
} from '@/services/rooms';
import {
  subscribeVoiceSession,
  getVoiceSession,
  startVoiceSession,
  updateVoiceSession,
  endVoiceSession,
  type VoiceSession,
} from '@/services/voiceSession';
import { avatarColor } from '@/utils/avatarColor';
import { relativeTime } from '@/utils/relativeTime';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Room'>;

const POLL_INTERVAL_MS = 4000;
const MAX_MESSAGE_LENGTH = 500;
type AttemptState = 'idle' | 'connecting' | 'error';
type DisplayVoiceState = AttemptState | 'connected' | 'reconnecting';

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

export default function RoomScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [seatBusy, setSeatBusy] = useState(false);
  const [attemptState, setAttemptState] = useState<AttemptState>('idle');
  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(getVoiceSession());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'close' | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const wasSeatedRef = useRef(false);

  // Bu odaya ait aktif bir global sesli oturum varsa (bubble üzerinden geri
  // dönülmüş olabilir) her mount bunu doğrudan store'dan okur — bağlantının
  // kendisi ekran yaşam döngüsünden bağımsız, tek doğruluk kaynağı store.
  const mine = voiceSession?.roomId === roomId ? voiceSession : null;
  const displayVoiceState: DisplayVoiceState = mine ? mine.status : attemptState;
  const muted = mine?.muted ?? false;

  useEffect(() => subscribeVoiceSession(setVoiceSession), []);

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

  // Sesi VE koltuğu birlikte bırakır — "Ayrıl" butonu, kendi koltuğuna
  // dokunma ve geri-git onayındaki "Evet" hepsi bunu kullanır. Sadece sesi
  // kapatıp koltukta "hayalet" gibi oturmaya devam etmek istenen bir durum
  // yok, bu yüzden ikisi hep birlikte yürüyor.
  const leaveRoomCompletely = useCallback(async () => {
    endVoiceSession();
    try {
      await leaveSeat(roomId);
    } catch {
      // Koltukta değilsek zaten hata normal, sessizce geç.
    }
    load(true);
  }, [roomId, load]);

  const connectVoice = useCallback(async () => {
    setAttemptState('connecting');
    try {
      const token = await getRoomVoiceToken(roomId);
      const room = new Room();
      room.on(RoomEvent.Disconnected, () => {
        endVoiceSession();
      });
      // Ağ kısa süreliğine kesilirse (wifi/hücresel geçişi vb.) LiveKit
      // kendi kendine yeniden bağlanmayı dener — bunu kullanıcıya "hata"
      // gibi göstermek yerine geçici bir durum olarak belirtiyoruz.
      room.on(RoomEvent.Reconnecting, () => updateVoiceSession({ status: 'reconnecting' }));
      room.on(RoomEvent.Reconnected, () => updateVoiceSession({ status: 'connected' }));
      await room.connect(env.livekitUrl(), token);
      await room.localParticipant.setMicrophoneEnabled(true);
      startVoiceSession(roomId, detail?.room.name ?? route.params.roomName ?? 'Oda', room);
      setAttemptState('idle');
    } catch (err) {
      setAttemptState('error');
      showAlert('Sese bağlanılamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    }
  }, [roomId, detail, route.params.roomName]);

  // "Sese Katıl" tek dokunuşla çalışmalı: koltukta değilsen önce boş bir
  // koltuğa otur (görünür sırada ilk boşluk), sonra sese bağlan. Elle bir
  // koltuk seçmek isteyen yine "+" işaretine dokunabilir.
  const handleJoinVoice = useCallback(async () => {
    const alreadySeated = detail?.seats.some((s) => s?.userId === meId) ?? false;
    if (!alreadySeated) {
      const emptyIndex = detail?.seats.findIndex((s) => s === null) ?? -1;
      if (emptyIndex === -1) {
        showAlert('Oda dolu', 'Konuşmak için boş koltuk yok.');
        return;
      }
      try {
        await takeSeat(roomId, emptyIndex);
        load(true);
      } catch (err) {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
        return;
      }
    }
    await connectVoice();
  }, [detail, meId, roomId, load, connectVoice]);

  const toggleMute = useCallback(async () => {
    const session = getVoiceSession();
    if (!session || session.roomId !== roomId) return;
    const next = !session.muted;
    try {
      await session.livekitRoom.localParticipant.setMicrophoneEnabled(!next);
      updateVoiceSession({ muted: next });
    } catch (err) {
      showAlert('Olmadı', err instanceof Error ? err.message : 'Mikrofon değiştirilemedi.');
    }
  }, [roomId]);

  // Koltuğa oturmamış ama odayı açık tutanlar "dinleyici" olarak sayılıyor —
  // gerçek zamanlı bir bağlantı olmadığı için düzenli aralıklarla "hâlâ
  // buradayım" bildiriyoruz (heartbeat), ekrandan çıkınca kaydı siliyoruz.
  // Ekrandan çıkarken (blur) sesli bağlantı hâlâ bu oda için canlıysa —
  // yani kullanıcı "Arkaplanda Açık Kalsın" seçti — koltuğu/dinleyici
  // kaydını SİLMİYORUZ, bağlantı bubble üzerinden açık kalıyor.
  useFocusEffect(
    useCallback(() => {
      load();
      getStoredSession().then((session) => {
        if (session) pingRoomViewer(roomId).catch(() => {});
      });
      const interval = setInterval(() => {
        load(true);
        getStoredSession().then((session) => {
          if (session) pingRoomViewer(roomId).catch(() => {});
        });
      }, POLL_INTERVAL_MS);
      return () => {
        clearInterval(interval);
        const keepingInBackground = getVoiceSession()?.roomId === roomId;
        if (!keepingInBackground) {
          leaveRoomViewer(roomId).catch(() => {});
          if (wasSeatedRef.current) leaveSeat(roomId).catch(() => {});
        }
      };
    }, [load, roomId]),
  );

  // Geri gitme (header butonu, donanım geri tuşu, kaydırma jesti) — sesli
  // bağlıysan doğrudan çıkmak yerine soruyoruz: tamamen ayrıl, arkaplanda
  // açık bırak, ya da vazgeç.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const session = getVoiceSession();
      const isConnected = session?.roomId === roomId && (session.status === 'connected' || session.status === 'reconnecting');
      if (!isConnected) return;
      e.preventDefault();
      showAlert('Odadan ayrılmak istiyor musun?', 'Sesli bağlantın açık. Ne yapmak istersin?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Arkaplanda Açık Kalsın',
          onPress: () => navigation.dispatch(e.data.action),
        },
        {
          text: 'Evet, Ayrıl',
          style: 'destructive',
          onPress: async () => {
            await leaveRoomCompletely();
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsubscribe;
  }, [navigation, roomId, leaveRoomCompletely]);

  useEffect(() => {
    if (!detail || !meId) return;
    wasSeatedRef.current = detail.seats.some((s) => s?.userId === meId);
  }, [detail, meId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const isHost = !!detail && !!meId && detail.room.hostId === meId;

  const handleSeatPress = useCallback(
    async (seat: RoomDetail['seats'][number], index: number) => {
      if (seatBusy) return;
      if (seat && seat.userId !== meId) {
        // Host, dolu bir koltuğa (kendisi değil) dokununca moderasyon
        // seçenekleri çıkıyor.
        if (isHost) {
          showAlert(seat.displayName, 'Bu kişi için ne yapmak istersin?', [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Sustur',
              onPress: () =>
                muteRoomUser(roomId, seat.userId)
                  .then(() => load(true))
                  .catch((err) => showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.')),
            },
            {
              text: 'Yasakla',
              style: 'destructive',
              onPress: () =>
                banRoomUser(roomId, seat.userId)
                  .then(() => load(true))
                  .catch((err) => showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.')),
            },
          ]);
        }
        return;
      }
      setSeatBusy(true);
      try {
        if (seat?.userId === meId) {
          await leaveRoomCompletely();
        } else if (!seat) {
          await takeSeat(roomId, index);
          load(true);
        }
      } catch (err) {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setSeatBusy(false);
      }
    },
    [roomId, meId, seatBusy, isHost, load, leaveRoomCompletely],
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
      showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      setText(body);
    } finally {
      setSending(false);
    }
  }, [roomId, text]);

  const openSettings = useCallback(() => {
    if (!detail) return;
    setEditName(detail.room.name);
    setEditTopic(detail.room.topic);
    setSettingsOpen(true);
  }, [detail]);

  const handleSaveSettings = useCallback(async () => {
    if (!editName.trim()) return;
    setSavingSettings(true);
    try {
      await updateRoom(roomId, { name: editName.trim(), topic: editTopic });
      setSettingsOpen(false);
      load(true);
    } catch (err) {
      showAlert('Kaydedilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setSavingSettings(false);
    }
  }, [roomId, editName, editTopic, load]);

  const handleConfirmAction = useCallback(async () => {
    if (confirmAction === 'clear') {
      try {
        await clearRoomMessages(roomId);
        setMessages([]);
      } catch (err) {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setConfirmAction(null);
      }
      return;
    }
    if (confirmAction === 'close') {
      try {
        await closeRoom(roomId);
        setConfirmAction(null);
        setSettingsOpen(false);
        navigation.goBack();
      } catch (err) {
        setConfirmAction(null);
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      }
    }
  }, [confirmAction, roomId, navigation]);

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

  const canWrite = !!meId && !detail.isBanned && !detail.isMuted;

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
          <View style={styles.roomHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomName}>{detail.room.name}</Text>
              <Text style={styles.roomHost}>
                Kuran: {detail.room.hostName}
                {detail.room.topic ? ` · ${detail.room.topic}` : ''}
              </Text>
            </View>
            {isHost && (
              <Pressable onPress={openSettings} hitSlop={10} style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={20} color={GOLD} />
              </Pressable>
            )}
          </View>

          {detail.isBanned && (
            <View style={styles.banBanner}>
              <Ionicons name="ban-outline" size={16} color="#E08A8A" />
              <Text style={styles.banBannerText}>Bu odadan yasaklandın — koltuğa oturamaz, mesaj yazamazsın.</Text>
            </View>
          )}
          {!detail.isBanned && detail.isMuted && (
            <View style={styles.muteBanner}>
              <Ionicons name="mic-off-outline" size={16} color={GOLD_SOFT} />
              <Text style={styles.muteBannerText}>Bu odada susturuldun — sadece dinleyebilirsin.</Text>
            </View>
          )}

          <View style={styles.seatGrid}>
            {detail.seats.map((seat, index) => (
              <Seat key={index} seat={seat} isMe={seat?.userId === meId} onPress={() => handleSeatPress(seat, index)} />
            ))}
          </View>

          {!detail.isBanned && (
            <View style={styles.voiceCallout}>
              {displayVoiceState === 'idle' || displayVoiceState === 'error' ? (
                <Pressable onPress={handleJoinVoice} style={styles.voiceButton}>
                  <Ionicons name="mic-outline" size={18} color="#1a0d33" />
                  <Text style={styles.voiceButtonText}>Sese Katıl</Text>
                </Pressable>
              ) : displayVoiceState === 'connecting' ? (
                <View style={styles.voiceStatusRow}>
                  <ActivityIndicator color={GOLD} />
                  <Text style={styles.voiceCalloutText}>Bağlanıyor...</Text>
                </View>
              ) : displayVoiceState === 'reconnecting' ? (
                <View style={styles.voiceStatusRow}>
                  <ActivityIndicator color={GOLD} />
                  <Text style={styles.voiceCalloutText}>Bağlantı zayıfladı, yeniden bağlanıyor...</Text>
                </View>
              ) : (
                <View style={styles.voiceConnectedRow}>
                  <Pressable onPress={toggleMute} style={[styles.voiceIconButton, muted && styles.voiceIconButtonMuted]}>
                    <Ionicons name={muted ? 'mic-off-outline' : 'mic-outline'} size={18} color={muted ? TEXT_MUTED : GOLD} />
                  </Pressable>
                  <Text style={styles.voiceConnectedText}>{muted ? 'Mikrofon kapalı' : 'Sesli bağlısın'}</Text>
                  <Pressable onPress={leaveRoomCompletely} style={styles.voiceLeaveButton}>
                    <Text style={styles.voiceLeaveButtonText}>Ayrıl</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {detail.viewers.length > 0 && (
            <View style={styles.listenersSection}>
              <Text style={styles.listenersLabel}>Dinleyiciler ({detail.viewers.length})</Text>
              <View style={styles.listenersRow}>
                {detail.viewers.map((viewer) => (
                  <View key={viewer.userId} style={styles.listenerChip}>
                    {viewer.avatarUrl ? (
                      <Image source={{ uri: viewer.avatarUrl }} style={styles.listenerAvatar} />
                    ) : (
                      <View style={[styles.listenerAvatar, styles.listenerAvatarFallback, { backgroundColor: avatarColor(viewer.userId) }]}>
                        <Text style={styles.listenerAvatarText}>{viewer.displayName.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.listenerName} numberOfLines={1}>
                      {viewer.displayName}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

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

        {canWrite ? (
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
        ) : !meId ? (
          <View style={styles.joinHint}>
            <Text style={styles.joinHintText}>Yazmak için giriş yapmalısın.</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal visible={settingsOpen} animationType="fade" transparent onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.settingsBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSettingsOpen(false)} />
          <View style={styles.settingsSheet}>
            <Text style={styles.settingsTitle}>Oda Ayarları</Text>

            <Text style={styles.settingsFieldLabel}>Oda Adı</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Oda adı"
              placeholderTextColor={TEXT_MUTED}
              style={styles.settingsInput}
              maxLength={60}
            />

            <Text style={styles.settingsFieldLabel}>Oda Modu</Text>
            <View style={styles.chipRow}>
              {ROOM_TOPICS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setEditTopic(t)}
                  style={[styles.chip, editTopic === t && styles.chipActive]}
                >
                  <Text style={[styles.chipText, editTopic === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSaveSettings}
              disabled={savingSettings || !editName.trim()}
              style={[styles.settingsSaveButton, (savingSettings || !editName.trim()) && styles.settingsSaveButtonDisabled]}
            >
              {savingSettings ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.settingsSaveButtonText}>Kaydet</Text>}
            </Pressable>

            <View style={styles.settingsDivider} />

            <Pressable onPress={() => setConfirmAction('clear')} style={styles.dangerRow}>
              <Ionicons name="trash-outline" size={17} color={TEXT_MUTED} />
              <Text style={styles.dangerRowText}>Sohbeti Temizle</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmAction('close')} style={styles.dangerRow}>
              <Ionicons name="close-circle-outline" size={17} color="#E08A8A" />
              <Text style={[styles.dangerRowText, { color: '#E08A8A' }]}>Odayı Kalıcı Olarak Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={confirmAction !== null}
        title={confirmAction === 'close' ? 'Odayı kalıcı olarak kapat' : 'Sohbeti temizle'}
        message={
          confirmAction === 'close'
            ? 'Bu oda ve tüm mesajları kalıcı olarak silinecek. Bu işlem geri alınamaz.'
            : 'Odadaki tüm mesajlar silinecek. Bu işlem geri alınamaz.'
        }
        confirmLabel={confirmAction === 'close' ? 'Kapat' : 'Temizle'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
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
  roomHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
  roomName: { fontSize: 19, fontWeight: '800', color: GOLD, textAlign: 'center' },
  roomHost: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', marginTop: 4 },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(224, 138, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  banBannerText: { flex: 1, fontSize: 12, color: '#E08A8A', lineHeight: 17 },
  muteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  muteBannerText: { flex: 1, fontSize: 12, color: GOLD_SOFT, lineHeight: 17 },
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
  listenersSection: { marginBottom: 20 },
  listenersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  listenersRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  listenerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 5,
    paddingHorizontal: 10,
    maxWidth: 140,
  },
  listenerAvatar: { width: 22, height: 22, borderRadius: 11 },
  listenerAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  listenerAvatarText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  listenerName: { fontSize: 11, color: TEXT_PRIMARY, flexShrink: 1 },
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
  settingsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 12, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  settingsSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 22,
  },
  settingsTitle: { fontSize: 16, fontWeight: '800', color: GOLD, textAlign: 'center', marginBottom: 16 },
  settingsFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  settingsInput: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: GOLD, borderColor: GOLD },
  chipText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  chipTextActive: { color: '#1a0d33', fontWeight: '800' },
  settingsSaveButton: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  settingsSaveButtonDisabled: { opacity: 0.45 },
  settingsSaveButtonText: { fontSize: 13, fontWeight: '800', color: '#1a0d33' },
  settingsDivider: { height: 1, backgroundColor: GOLD_SOFT, marginVertical: 16, opacity: 0.4 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  dangerRowText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
});
