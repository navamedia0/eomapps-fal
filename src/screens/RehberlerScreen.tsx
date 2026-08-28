import { useCallback, useState } from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { View, Text, Image, Pressable, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getStoredSession, signInWithGoogle } from '@/services/auth';
import { getGuides, getMyGuideApplication, applyForGuide, type Guide, type GuideApplication } from '@/services/guides';
import AppleSignInButton from '@/components/AppleSignInButton';
import { avatarColor } from '@/utils/avatarColor';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

const STATUS_LABEL: Record<GuideApplication['status'], string> = {
  pending: 'Başvurun inceleniyor.',
  approved: 'Rehbersin — listede görünüyorsun.',
  rejected: 'Başvurun reddedildi. Tekrar başvurabilirsin.',
};

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
        <Text style={styles.rowBio} numberOfLines={2}>
          {item.bio}
        </Text>
      </View>
      <Pressable onPress={onMessage} style={styles.messageButton} hitSlop={8}>
        <Ionicons name="chatbubble-outline" size={18} color={GOLD} />
      </Pressable>
    </View>
  );
}

export default function RehberlerScreen({ navigation }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [application, setApplication] = useState<GuideApplication | null>(null);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const refresh = useCallback(() => {
    getGuides()
      .then(setGuides)
      .catch(() => setGuides([]))
      .finally(() => setLoadingGuides(false));

    getStoredSession().then((session) => {
      setSignedIn(!!session);
      if (!session) {
        setLoadingApplication(false);
        return;
      }
      getMyGuideApplication()
        .then(setApplication)
        .catch(() => setApplication(null))
        .finally(() => setLoadingApplication(false));
    });
  }, []);

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

  const handleApply = useCallback(async () => {
    if (!message.trim()) return;
    setApplying(true);
    try {
      const app = await applyForGuide(message);
      setApplication(app);
      setMessage('');
    } catch (err) {
      Alert.alert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setApplying(false);
    }
  }, [message]);

  const openMessage = useCallback(
    (guide: Guide) => {
      navigation.navigate('DMThread', { userId: guide.id, displayName: guide.displayName, avatarUrl: guide.avatarUrl });
    },
    [navigation],
  );

  const canApply = !application || application.status === 'rejected';

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="sparkles-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Rehberler</Text>
        </View>

        {loadingGuides ? (
          <ActivityIndicator color={GOLD} style={{ marginBottom: 20 }} />
        ) : (
          <View style={styles.list}>
            {guides.length === 0 ? (
              <Text style={styles.emptyText}>Henüz onaylanmış rehber yok.</Text>
            ) : (
              guides.map((item) => <GuideRow key={item.id} item={item} onMessage={() => openMessage(item)} />)
            )}
          </View>
        )}

        <Text style={styles.sectionLabel}>Rehber Ol</Text>

        {signedIn === false && (
          <View style={{ marginBottom: 20 }}>
            <Pressable
              onPress={handleSignIn}
              disabled={signingIn}
              style={({ pressed }) => [styles.signInCard, { marginBottom: 0 }, pressed && styles.rowPressed]}
            >
              <FontAwesome name="google" size={20} color={GOLD} />
              <Text style={styles.signInText}>{signingIn ? 'Giriş yapılıyor...' : 'Başvurmak için Google ile giriş yap'}</Text>
              {signingIn && <ActivityIndicator color={GOLD} style={{ marginLeft: 6 }} />}
            </Pressable>
            <AppleSignInButton onSuccess={refresh} onError={(message) => Alert.alert('Giriş yapılamadı', message)} />
          </View>
        )}

        {signedIn && loadingApplication && <ActivityIndicator color={GOLD} style={{ marginBottom: 10 }} />}

        {signedIn && !loadingApplication && (
          <>
            {application && (
              <View style={[styles.statusCard, application.status === 'approved' && styles.statusCardApproved]}>
                <Text style={styles.statusText}>{STATUS_LABEL[application.status]}</Text>
              </View>
            )}
            {canApply && (
              <View style={styles.applyBox}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Kendinden ve uzmanlık alanından bahset (örn. tarot, kahve falı)..."
                  placeholderTextColor={TEXT_MUTED}
                  style={styles.applyInput}
                  multiline
                  maxLength={600}
                />
                <Pressable
                  onPress={handleApply}
                  disabled={applying || !message.trim()}
                  style={[styles.applyButton, (applying || !message.trim()) && styles.applyButtonDisabled]}
                >
                  {applying ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.applyButtonText}>Başvur</Text>}
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: GOLD },
  list: { gap: 10, marginBottom: 28 },
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
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  rowTextWrap: { flex: 1 },
  rowName: { fontSize: 13.5, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 2 },
  rowBio: { fontSize: 11.5, lineHeight: 16, color: TEXT_MUTED },
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
  rowPressed: { opacity: 0.85 },
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
  },
  signInText: { fontSize: 13.5, fontWeight: '700', color: GOLD },
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
