import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { showAlert } from '@/services/themedAlert';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getStoredSession } from '@/services/auth';
import { getUserProfile, followUser, unfollowUser, blockUser, type SocialProfile } from '@/services/socialProfile';
import { avatarColor } from '@/utils/avatarColor';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getUserProfile(userId), getStoredSession()])
      .then(([data, session]) => {
        setProfile(data);
        setMeId(session?.user.id ?? null);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleFollow = useCallback(async () => {
    if (!profile) return;
    setBusy(true);
    try {
      if (profile.isFollowing) await unfollowUser(userId);
      else await followUser(userId);
      load();
    } catch (err) {
      showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setBusy(false);
    }
  }, [profile, userId, load]);

  const handleBlock = useCallback(() => {
    showAlert('Kullanıcıyı engelle', 'Bu kullanıcıyı engellersen birbirinizin gönderilerini göremezsiniz. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(userId);
            showAlert('Engellendi', 'Bu kullanıcıyı engelledin.');
            load();
          } catch (err) {
            showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
          }
        },
      },
    ]);
  }, [userId, load]);

  if (loading) {
    return (
      <MysticTableBackground>
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      </MysticTableBackground>
    );
  }

  if (error || !profile) {
    return (
      <MysticTableBackground>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Profil yüklenemedi.</Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      </MysticTableBackground>
    );
  }

  const { user, followerCount, followingCount, isFollowing } = profile;
  const authorTag = `@${user.id.slice(0, 8)}`;
  const isSelf = meId === user.id;

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} cachePolicy="memory-disk" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: avatarColor(authorTag) }]}>
              <Text style={styles.avatarFallbackText}>{(user.displayName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.displayName || 'Mistik Rehber Kullanıcısı'}</Text>
          <Text style={styles.tag}>{authorTag}</Text>
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>

          {!isSelf && (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleToggleFollow}
                disabled={busy}
                style={[styles.followButton, isFollowing && styles.followButtonActive, busy && styles.buttonDisabled]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={isFollowing ? GOLD : '#1a0d33'} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                    {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() =>
                  navigation.navigate('DMThread', { userId: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl })
                }
                style={styles.messageButton}
                hitSlop={8}
              >
                <Ionicons name="chatbubble-outline" size={19} color={GOLD} />
              </Pressable>
              <Pressable onPress={handleBlock} style={styles.blockButton} hitSlop={8}>
                <Ionicons name="ban-outline" size={20} color={TEXT_MUTED} />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 48 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  retryText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  header: { alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 14 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 19, fontWeight: '700', color: TEXT_PRIMARY, textAlign: 'center' },
  tag: { fontSize: 13, color: TEXT_MUTED, marginTop: 3 },
  bio: { fontSize: 13.5, lineHeight: 20, color: TEXT_PRIMARY, textAlign: 'center', marginTop: 14, paddingHorizontal: 10 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 14,
    paddingHorizontal: 30,
    gap: 24,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800', color: GOLD },
  statLabel: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: GOLD_SOFT },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  followButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 28,
    minWidth: 150,
    alignItems: 'center',
  },
  followButtonActive: { backgroundColor: NIGHT_CARD, borderWidth: 1, borderColor: GOLD },
  followButtonText: { fontSize: 13.5, fontWeight: '800', color: '#1a0d33' },
  followButtonTextActive: { color: GOLD },
  buttonDisabled: { opacity: 0.6 },
  blockButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
