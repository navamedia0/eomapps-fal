import { useCallback, useState } from 'react';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Image, Pressable, RefreshControl, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getStoredSession, signInWithGoogle } from '@/services/auth';
import { getConversations, type Conversation } from '@/services/messages';
import { getRooms, type RoomSummary } from '@/services/rooms';
import { getGuides, getMyGuideApplication, applyForGuide, type Guide, type GuideApplication } from '@/services/guides';
import AppleSignInButton from '@/components/AppleSignInButton';
import CreateRoomModal from '@/components/CreateRoomModal';
import { avatarColor } from '@/utils/avatarColor';
import { relativeTime } from '@/utils/relativeTime';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;
type SohbetTab = 'mesajlar' | 'sesli' | 'yorumcular';

const APPLICATION_STATUS_LABEL: Record<GuideApplication['status'], string> = {
  pending: 'Başvurun inceleniyor.',
  approved: 'Yorumcusun — listede görünüyorsun.',
  rejected: 'Başvurun reddedildi. Tekrar başvurabilirsin.',
};

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
          {item.hostName} kurdu{item.topic ? ` · ${item.topic}` : ''}
        </Text>
      </View>
      <Text style={styles.roomSeatCount}>
        {item.seatedCount}/{item.capacity}
      </Text>
    </Pressable>
  );
}

function GuideRow({ item, onMessage }: { item: Guide; onMessage: () => void }) {
  return (
    <View style={styles.row}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor(item.id) }]}>
          <Text style={styles.avatarFallbackText}>{item.displayName.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.rowPreview} numberOfLines={2}>
          {item.bio}
        </Text>
      </View>
      <Pressable onPress={onMessage} style={styles.messageButton} hitSlop={8}>
        <Ionicons name="chatbubble-outline" size={18} color={GOLD} />
      </Pressable>
    </View>
  );
}

export default function SohbetScreen({ navigation }: Props) {
  const [tab, setTab] = useState<SohbetTab>('sesli');
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sesli Sohbet sekmesi
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [createRoomModalVisible, setCreateRoomModalVisible] = useState(false);

  // Fal Uzmanları sekmesi
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [application, setApplication] = useState<GuideApplication | null>(null);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const refreshRooms = useCallback(() => {
    getRooms()
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  const refreshGuides = useCallback((isSignedIn: boolean) => {
    getGuides()
      .then(setGuides)
      .catch(() => setGuides([]))
      .finally(() => setLoadingGuides(false));

    if (!isSignedIn) {
      setLoadingApplication(false);
      return;
    }
    getMyGuideApplication()
      .then(setApplication)
      .catch(() => setApplication(null))
      .finally(() => setLoadingApplication(false));
  }, []);

  const refresh = useCallback(() => {
    getStoredSession().then((session) => {
      const isSignedIn = !!session;
      setSignedIn(isSignedIn);
      if (isSignedIn) {
        getConversations()
          .then(setConversations)
          .catch(() => setConversations([]))
          .finally(() => setLoadingConversations(false));
      } else {
        setLoadingConversations(false);
      }
      refreshGuides(isSignedIn);
    });
    refreshRooms();
  }, [refreshRooms, refreshGuides]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Keşfet'teki gibi: aşağı çekince yenile, arka planda periyodik bir
  // zamanlayıcı yok, sadece bu jestte veya ekrana tekrar girildiğinde.
  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    const session = await getStoredSession();
    const isSignedIn = !!session;
    setSignedIn(isSignedIn);
    await Promise.allSettled([
      isSignedIn ? getConversations().then(setConversations).catch(() => setConversations([])) : Promise.resolve(),
      getRooms().then(setRooms).catch(() => setRooms([])),
      getGuides().then(setGuides).catch(() => setGuides([])),
      isSignedIn ? getMyGuideApplication().then(setApplication).catch(() => setApplication(null)) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, []);

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      refresh();
    } catch (err) {
      showAlert('Giriş yapılamadı', err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
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

  const handleRoomCreated = useCallback(
    (room: RoomSummary) => {
      setCreateRoomModalVisible(false);
      refreshRooms();
      navigation.navigate('Room', { roomId: room.id, roomName: room.name });
    },
    [refreshRooms, navigation],
  );

  const handleApply = useCallback(async () => {
    if (!applyMessage.trim()) return;
    setApplying(true);
    try {
      const app = await applyForGuide(applyMessage);
      setApplication(app);
      setApplyMessage('');
    } catch (err) {
      showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setApplying(false);
    }
  }, [applyMessage]);

  const openGuideMessage = useCallback(
    (guide: Guide) => {
      navigation.navigate('DMThread', { userId: guide.id, displayName: guide.displayName, avatarUrl: guide.avatarUrl });
    },
    [navigation],
  );

  const canApply = !application || application.status === 'rejected';

  return (
    <MysticTableBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} tintColor={GOLD} colors={[GOLD]} />}
      >
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
            <AppleSignInButton onSuccess={refresh} onError={(message) => showAlert('Giriş yapılamadı', message)} />
          </View>
        )}

        {/* Tab Switcher: Üstte 2 Buton, Altta Tam Satır Yorumcular Butonu */}
        <View style={styles.tabSwitchContainer}>
          <View style={styles.tabSwitchTopRow}>
            <Pressable
              onPress={() => setTab('mesajlar')}
              style={[styles.tabSwitchButton, tab === 'mesajlar' && styles.tabSwitchButtonActive]}
            >
              <Ionicons name="chatbubbles-outline" size={16} color={tab === 'mesajlar' ? '#1a0d33' : GOLD} />
              <Text style={[styles.tabSwitchText, tab === 'mesajlar' && styles.tabSwitchTextActive]}>
                Mesaj Kutum {conversations.some(c => c.unreadCount > 0) ? '•' : ''}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('sesli')}
              style={[styles.tabSwitchButton, tab === 'sesli' && styles.tabSwitchButtonActive]}
            >
              <Ionicons name="mic-outline" size={16} color={tab === 'sesli' ? '#1a0d33' : GOLD} />
              <Text style={[styles.tabSwitchText, tab === 'sesli' && styles.tabSwitchTextActive]}>
                Sesli Sohbet
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setTab('yorumcular')}
            style={[styles.tabSwitchFullRow, tab === 'yorumcular' && styles.tabSwitchButtonActive]}
          >
            <MaterialCommunityIcons name="crystal-ball" size={18} color={tab === 'yorumcular' ? '#1a0d33' : GOLD} />
            <Text style={[styles.tabSwitchText, tab === 'yorumcular' && styles.tabSwitchTextActive]}>
              Yorumcular
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: MESAJ KUTUM */}
        {tab === 'mesajlar' && (
          <>
            <View style={styles.securityHintBox}>
              <Ionicons name="shield-checkmark" size={14} color={GOLD} />
              <Text style={styles.securityHintText}>
                Birebir mesajlar 24 saat sonra her iki taraftan da otomatik silinir. Ekran görüntüsü alınamaz.
              </Text>
            </View>

            {signedIn ? (
              <>
                <Text style={styles.sectionLabel}>Özel Sohbetler</Text>
                {loadingConversations ? (
                  <ActivityIndicator color={GOLD} style={{ marginBottom: 20 }} />
                ) : (
                  <View style={styles.list}>
                    {conversations.length === 0 ? (
                      <Text style={styles.emptyText}>
                        Henüz sohbetin yok. Keşfet'te bir gönderiye dokunup yazarın profiline gidince oradan mesaj gönderebilirsin.
                      </Text>
                    ) : (
                      conversations.map((item) => (
                        <ConversationRow key={item.partnerId} item={item} onPress={() => openThread(item)} />
                      ))
                    )}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>Mesajlarını görmek ve sohbet etmek için yukarıdan giriş yap.</Text>
            )}
          </>
        )}

        {/* TAB 2: SESLİ SOHBET */}
        {tab === 'sesli' && (
          <>
            <View style={styles.roomsHeaderRow}>
              <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Sesli Odalar</Text>
              <Pressable onPress={() => setCreateRoomModalVisible(true)} hitSlop={8} style={styles.newRoomButton}>
                <Ionicons name="add" size={16} color={GOLD} />
                <Text style={styles.newRoomButtonText}>Yeni Oda</Text>
              </Pressable>
            </View>
            <Text style={styles.roomsHint}>Odaya girip yazışabilirsin; koltuğa oturan da sesli katılabilir.</Text>

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
          </>
        )}

        {/* TAB 3: YORUMCULAR */}
        {tab === 'yorumcular' && (
          <>
            {loadingGuides ? (
              <ActivityIndicator color={GOLD} style={{ marginBottom: 20 }} />
            ) : (
              <View style={styles.list}>
                {guides.length === 0 ? (
                  <Text style={styles.emptyText}>Henüz onaylanmış yorumcu yok.</Text>
                ) : (
                  guides.map((item) => <GuideRow key={item.id} item={item} onMessage={() => openGuideMessage(item)} />)
                )}
              </View>
            )}

            <Text style={styles.sectionLabel}>Yorumcu Ol</Text>

            {signedIn && loadingApplication && <ActivityIndicator color={GOLD} style={{ marginBottom: 10 }} />}

            {signedIn && !loadingApplication && (
              <>
                {application && (
                  <View style={[styles.statusCard, application.status === 'approved' && styles.statusCardApproved]}>
                    <Text style={styles.statusText}>{APPLICATION_STATUS_LABEL[application.status]}</Text>
                  </View>
                )}
                {canApply && (
                  <View style={styles.applyBox}>
                    <TextInput
                      value={applyMessage}
                      onChangeText={setApplyMessage}
                      placeholder="Kendinden ve uzmanlık alanından bahset (örn. tarot, kahve falı)..."
                      placeholderTextColor={TEXT_MUTED}
                      style={styles.applyInput}
                      multiline
                      maxLength={600}
                    />
                    <Pressable
                      onPress={handleApply}
                      disabled={applying || !applyMessage.trim()}
                      style={[styles.applyButton, (applying || !applyMessage.trim()) && styles.applyButtonDisabled]}
                    >
                      {applying ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.applyButtonText}>Başvur</Text>}
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {signedIn === false && (
              <Text style={styles.emptyText}>Başvurmak için yukarıdan Google veya Apple ile giriş yap.</Text>
            )}
          </>
        )}
      </ScrollView>

      <CreateRoomModal
        visible={createRoomModalVisible}
        onClose={() => setCreateRoomModalVisible(false)}
        onCreated={handleRoomCreated}
      />
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
  messageButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tabSwitchContainer: {
    backgroundColor: 'rgba(30, 30, 32, 0.9)',
    borderRadius: 18,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    gap: 6,
  },
  tabSwitchTopRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabSwitchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
  },
  tabSwitchFullRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    paddingVertical: 11,
  },
  tabSwitchButtonActive: {
    backgroundColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabSwitchText: { fontSize: 13, fontWeight: '700', color: GOLD_SOFT },
  tabSwitchTextActive: { color: '#1a0d33', fontWeight: '800' },
  securityHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 201, 60, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  securityHintText: {
    fontSize: 11,
    color: GOLD_SOFT,
    textAlign: 'center',
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
  statusCard: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
    marginBottom: 14,
  },
  statusCardApproved: { borderColor: GOLD },
  statusText: { fontSize: 13, color: TEXT_PRIMARY, textAlign: 'center' },
  applyBox: { gap: 10 },
  applyInput: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  applyButton: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  applyButtonDisabled: { opacity: 0.45 },
  applyButtonText: { fontSize: 13.5, fontWeight: '800', color: '#1a0d33' },
});
