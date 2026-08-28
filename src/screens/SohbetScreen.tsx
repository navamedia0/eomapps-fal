import { useCallback, useState } from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getStoredSession, signInWithGoogle } from '@/services/auth';
import { getConversations, type Conversation } from '@/services/messages';
import { getRooms, createRoom, type RoomSummary } from '@/services/rooms';
import AppleSignInButton from '@/components/AppleSignInButton';
import { avatarColor } from '@/utils/avatarColor';
import { relativeTime } from '@/utils/relativeTime';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

function ConversationRow({ item, onPress }: { item: Conversation; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {item.partnerAvatarUrl ? (
        <Image source={{ uri: item.partnerAvatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor(item.partnerId) }]}>
          <Text style={styles.avatarFallbackText}>{item.partnerName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.partnerName}
        </Text>
        <Text style={[styles.rowPreview, item.unreadCount > 0 && styles.rowPreviewUnread]} numberOfLines={1}>
          {item.lastFromMe ? 'Sen: ' : ''}
          {item.lastText}
        </Text>
      </View>
      <View style={styles.rowMetaWrap}>
        <Text style={styles.rowTime}>{relativeTime(item.lastAt)}</Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function RoomRow({ item, onPress }: { item: RoomSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor(item.id) }]}>
        <Ionicons name="mic-outline" size={19} color="#fff" />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {item.hostName} kurdu
        </Text>
      </View>
      <Text style={styles.roomSeatCount}>
        {item.seatedCount}/{item.capacity}
      </Text>
    </Pressable>
  );
}

export default function SohbetScreen({ navigation }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  const refreshRooms = useCallback(() => {
    getRooms()
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  const refresh = useCallback(() => {
    getStoredSession().then((session) => {
      setSignedIn(!!session);
      if (!session) {
        setLoadingConversations(false);
        return;
      }
      getConversations()
        .then(setConversations)
        .catch(() => setConversations([]))
        .finally(() => setLoadingConversations(false));
    });
    refreshRooms();
  }, [refreshRooms]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      refresh();
    } catch (err) {
      Alert.alert('Giriş yapılamadı', err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setSigningIn(false);
    }
  }, [refresh]);

  const openThread = useCallback(
    (item: Conversation) => {
      navigation.navigate('DMThread', { userId: item.partnerId, displayName: item.partnerName, avatarUrl: item.partnerAvatarUrl });
    },
    [navigation],
  );

  const openRoom = useCallback(
    (item: RoomSummary) => {
      navigation.navigate('Room', { roomId: item.id, roomName: item.name });
    },
    [navigation],
  );

  const handleCreateRoom = useCallback(async () => {
    if (!roomName.trim()) return;
    setCreatingRoom(true);
    try {
      const room = await createRoom(roomName);
      setRoomName('');
      setComposerOpen(false);
      refreshRooms();
      navigation.navigate('Room', { roomId: room.id, roomName: room.name });
    } catch (err) {
      Alert.alert('Oluşturulamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setCreatingRoom(false);
    }
  }, [roomName, refreshRooms, navigation]);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Sohbet</Text>
        </View>

        {signedIn === false && (
          <View style={{ marginBottom: 20 }}>
            <Pressable
              onPress={handleSignIn}
              disabled={signingIn}
              style={({ pressed }) => [styles.signInCard, { marginBottom: 0 }, pressed && styles.rowPressed]}
            >
              <FontAwesome name="google" size={20} color={GOLD} />
              <Text style={styles.signInText}>{signingIn ? 'Giriş yapılıyor...' : 'Mesajlaşmak için Google ile giriş yap'}</Text>
              {signingIn && <ActivityIndicator color={GOLD} style={{ marginLeft: 6 }} />}
            </Pressable>
            <AppleSignInButton onSuccess={refresh} onError={(message) => Alert.alert('Giriş yapılamadı', message)} />
          </View>
        )}

        {signedIn && (
          <>
            <Text style={styles.sectionLabel}>Mesajlar</Text>
            {loadingConversations ? (
              <ActivityIndicator color={GOLD} style={{ marginBottom: 20 }} />
            ) : (
              <View style={styles.list}>
                {conversations.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Henüz sohbetin yok. Keşfet'te bir gönderiye dokunup yazarın profiline gidince oradan mesaj gönderebilirsin.
                  </Text>
                ) : (
                  conversations.map((item) => <ConversationRow key={item.partnerId} item={item} onPress={() => openThread(item)} />)
                )}
              </View>
            )}
          </>
        )}

        <View style={styles.roomsHeaderRow}>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Sesli Odalar</Text>
          <Pressable onPress={() => setComposerOpen((v) => !v)} hitSlop={8} style={styles.newRoomButton}>
            <Ionicons name={composerOpen ? 'close' : 'add'} size={16} color={GOLD} />
            <Text style={styles.newRoomButtonText}>{composerOpen ? 'Vazgeç' : 'Yeni Oda'}</Text>
          </Pressable>
        </View>
        <Text style={styles.roomsHint}>Koltuğa oturup yazışabilirsin; sesli bağlantı LiveKit entegrasyonu tamamlanınca aktif olacak.</Text>

        {composerOpen && (
          <View style={styles.composer}>
            <TextInput
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Oda adı (örn. Gece Sohbeti)"
              placeholderTextColor={TEXT_MUTED}
              style={styles.composerInput}
              maxLength={60}
              autoFocus
            />
            <Pressable
              onPress={handleCreateRoom}
              disabled={creatingRoom || !roomName.trim()}
              style={[styles.composerSubmit, (creatingRoom || !roomName.trim()) && styles.composerSubmitDisabled]}
            >
              {creatingRoom ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.composerSubmitText}>Oluştur</Text>}
            </Pressable>
          </View>
        )}

        {loadingRooms ? (
          <ActivityIndicator color={GOLD} style={{ marginBottom: 20 }} />
        ) : (
          <View style={styles.list}>
            {rooms.length === 0 ? (
              <Text style={styles.emptyText}>Şu an açık oda yok — ilk odayı sen kur.</Text>
            ) : (
              rooms.map((item) => <RoomRow key={item.id} item={item} onPress={() => openRoom(item)} />)
            )}
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: GOLD },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 16,
    marginBottom: 20,
  },
  signInText: { fontSize: 13.5, fontWeight: '700', color: GOLD },
  rowPressed: { opacity: 0.85 },
  list: { gap: 10, marginBottom: 26 },
  emptyText: { fontSize: 12.5, lineHeight: 19, color: TEXT_MUTED, textAlign: 'center', paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  rowTextWrap: { flex: 1 },
  rowName: { fontSize: 13.5, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 2 },
  rowPreview: { fontSize: 12, color: TEXT_MUTED },
  rowPreviewUnread: { color: TEXT_PRIMARY, fontWeight: '600' },
  rowMetaWrap: { alignItems: 'flex-end', gap: 6 },
  rowTime: { fontSize: 10.5, color: TEXT_MUTED },
  unreadBadge: {
    backgroundColor: GOLD,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#1a0d33' },
  roomSeatCount: { fontSize: 12, fontWeight: '700', color: GOLD },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  roomsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  newRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  newRoomButtonText: { fontSize: 11.5, fontWeight: '700', color: GOLD },
  roomsHint: { fontSize: 11, color: TEXT_MUTED, lineHeight: 16, marginBottom: 14 },
  composer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  composerInput: {
    flex: 1,
    backgroundColor: NIGHT_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  composerSubmit: { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  composerSubmitDisabled: { opacity: 0.45 },
  composerSubmitText: { fontSize: 12.5, fontWeight: '800', color: '#1a0d33' },
});
