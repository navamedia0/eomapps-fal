import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import AvatarRenderer from '@/components/avatar/AvatarRenderer';
import CommentsModal from '@/components/CommentsModal';
import { getStoredSession } from '@/services/auth';
import { getUserProfile, followUser, unfollowUser, blockUser, type SocialProfile } from '@/services/socialProfile';
import { getFeed, deletePost, type KesfetFeedPost } from '@/services/kesfetPosts';
import { avatarColor } from '@/utils/avatarColor';
import { xpProgress } from '@/utils/xp';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, VELVET_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;
type ProfileTab = 'character' | 'posts';

const BADGE_CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'social', label: 'Sosyallik', icon: 'people' },
  { key: 'popularity', label: 'Popülerlik', icon: 'flame' },
  { key: 'game', label: 'Oyun', icon: 'leaf' },
  { key: 'fal', label: 'Fal', icon: 'moon' },
];

const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const GRID_PADDING = 20;

function ProgressBar({ label, ratio, valueLabel }: { label: string; ratio: number; valueLabel: string }) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{valueLabel}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` }]} />
      </View>
    </View>
  );
}

function PostsGrid({ userId, isSelf, onOpenComments }: { userId: string; isSelf: boolean; onOpenComments: (postId: string) => void }) {
  const { width } = useWindowDimensions();
  const tileSize = (width - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const [posts, setPosts] = useState<KesfetFeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getFeed(userId)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (postId: string) => {
      showAlert('Gönderiyi Sil', 'Bu paylaşımını silmek istediğine emin misin?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            try {
              await deletePost(postId);
            } catch (err) {
              showAlert('Silinemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
              load();
            }
          },
        },
      ]);
    },
    [load],
  );

  if (loading) {
    return <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} />;
  }

  if (posts.length === 0) {
    return (
      <View style={styles.postsEmpty}>
        <Ionicons name="images-outline" size={30} color={TEXT_MUTED} />
        <Text style={styles.postsEmptyText}>{isSelf ? 'Henüz bir paylaşımın yok.' : 'Henüz bir paylaşımı yok.'}</Text>
        {isSelf && <Text style={styles.postsEmptySubtext}>Keşfet sekmesinden fotoğraf veya durum paylaşabilirsin.</Text>}
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      numColumns={GRID_COLUMNS}
      scrollEnabled={false}
      columnWrapperStyle={{ gap: GRID_GAP }}
      contentContainerStyle={{ gap: GRID_GAP }}
      renderItem={({ item }) => (
        <Pressable onPress={() => onOpenComments(item.id)} style={[styles.gridTile, { width: tileSize, height: tileSize }]}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={styles.gridTextTile}>
              <Ionicons name="sparkles-outline" size={14} color={GOLD} style={{ marginBottom: 4 }} />
              <Text style={styles.gridTextTileText} numberOfLines={4}>
                {item.text}
              </Text>
            </View>
          )}
          <View style={styles.gridOverlay}>
            <Ionicons name="heart" size={11} color="#fff" />
            <Text style={styles.gridOverlayText}>{item.likeCount}</Text>
            <Ionicons name="chatbubble" size={10} color="#fff" style={{ marginLeft: 6 }} />
            <Text style={styles.gridOverlayText}>{item.commentCount}</Text>
          </View>
          {isSelf && (
            <Pressable onPress={() => handleDelete(item.id)} style={styles.gridDeleteBtn} hitSlop={6}>
              <Ionicons name="trash-outline" size={13} color="#fff" />
            </Pressable>
          )}
        </Pressable>
      )}
    />
  );
}

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('character');
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

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

  const { user, followerCount, followingCount, isFollowing, xp, level, achievementCount, popularityScore, avatar } = profile;
  const authorTag = `@${user.id.slice(0, 8)}`;
  const isSelf = meId === user.id;
  const progress = xpProgress(xp);
  const hasBadges = achievementCount > 0;

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.igRow}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoFallback, { backgroundColor: avatarColor(authorTag) }]}>
              <Text style={styles.photoFallbackText}>{(user.displayName || '?').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.igStatsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{level}</Text>
              <Text style={styles.statLabel}>Seviye</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.name}>{user.displayName || 'Mistik Rehber Kullanıcısı'}</Text>
          <Text style={styles.tag}>{authorTag}</Text>
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
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

        <View style={styles.badgeRow}>
          {BADGE_CATEGORIES.map((badge) => (
            <View key={badge.key} style={[styles.badgeIcon, hasBadges && styles.badgeIconActive]}>
              <Ionicons name={badge.icon} size={20} color={hasBadges ? '#1a0d33' : TEXT_MUTED} />
              <Text style={[styles.badgeLabel, hasBadges && styles.badgeLabelActive]}>{badge.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Ionicons name="trophy" size={16} color={GOLD} />
            <Text style={styles.progressCardTitle}>{achievementCount} başarım açıldı</Text>
          </View>
          <ProgressBar
            label="Seviye İlerlemesi"
            ratio={progress.ratio}
            valueLabel={`${progress.xpIntoLevel} / ${progress.xpForNextLevel} XP`}
          />
          <ProgressBar
            label="Haftalık Popülerlik"
            ratio={Math.min(1, popularityScore / 500)}
            valueLabel={`${popularityScore} puan`}
          />
        </View>

        <View style={styles.tabRow}>
          <Pressable onPress={() => setTab('posts')} style={[styles.tabButton, tab === 'posts' && styles.tabButtonActive]}>
            <Ionicons name="grid-outline" size={16} color={tab === 'posts' ? GOLD : TEXT_MUTED} />
            <Text style={[styles.tabButtonText, tab === 'posts' && styles.tabButtonTextActive]}>Paylaşımlar</Text>
          </Pressable>
          <Pressable onPress={() => setTab('character')} style={[styles.tabButton, tab === 'character' && styles.tabButtonActive]}>
            <Ionicons name="sparkles-outline" size={16} color={tab === 'character' ? GOLD : TEXT_MUTED} />
            <Text style={[styles.tabButtonText, tab === 'character' && styles.tabButtonTextActive]}>Karakterim</Text>
          </Pressable>
        </View>

        {tab === 'character' ? (
          <View style={styles.avatarPanel}>
            <View style={styles.avatarStage}>
              <AvatarRenderer
                gender={avatar.gender}
                hatItemId={avatar.hatItemId}
                capeItemId={avatar.capeItemId}
                outfitItemId={avatar.outfitItemId}
                pantsItemId={avatar.pantsItemId}
                size={150}
              />
            </View>
            {isSelf && (
              <Pressable onPress={() => navigation.navigate('AvatarWardrobe')} style={styles.editAvatarButton}>
                <Ionicons name="shirt-outline" size={16} color={GOLD} />
                <Text style={styles.editAvatarText}>Karakterini Düzenle</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <PostsGrid userId={user.id} isSelf={isSelf} onOpenComments={setCommentsPostId} />
        )}
      </ScrollView>

      <CommentsModal
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onPressAuthor={(pressedUserId) => {
          setCommentsPostId(null);
          if (pressedUserId !== userId) navigation.navigate('UserProfile', { userId: pressedUserId });
        }}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  retryText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  igRow: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: GOLD_SOFT },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoFallbackText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  igStatsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 18 },
  nameBlock: { marginTop: 16 },
  name: { fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY },
  tag: { fontSize: 12.5, color: TEXT_MUTED, marginTop: 2 },
  bio: { fontSize: 13, lineHeight: 19, color: TEXT_PRIMARY, marginTop: 10 },
  statItem: { alignItems: 'center', minWidth: 52 },
  statNumber: { fontSize: 17, fontWeight: '800', color: GOLD },
  statLabel: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  followButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 28,
    flex: 1,
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
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 22 },
  badgeIcon: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 12,
  },
  badgeIconActive: { backgroundColor: GOLD, borderColor: GOLD },
  badgeLabel: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED },
  badgeLabelActive: { color: '#1a0d33' },
  progressCard: {
    marginTop: 18,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    gap: 14,
  },
  progressCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  progressCardTitle: { fontSize: 12.5, fontWeight: '700', color: TEXT_PRIMARY },
  progressRow: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11.5, color: TEXT_MUTED, fontWeight: '600' },
  progressValue: { fontSize: 11, color: TEXT_MUTED },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: NIGHT_MID, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: GOLD },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: GOLD_SOFT,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: GOLD },
  tabButtonText: { fontSize: 12.5, fontWeight: '700', color: TEXT_MUTED },
  tabButtonTextActive: { color: GOLD },
  avatarPanel: {
    marginTop: 16,
    backgroundColor: VELVET_MID,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 20,
    alignItems: 'center',
  },
  avatarStage: { alignItems: 'center', justifyContent: 'center' },
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  editAvatarText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  postsEmpty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  postsEmptyText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '600' },
  postsEmptySubtext: { fontSize: 11.5, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 30 },
  gridTile: { backgroundColor: NIGHT_CARD, overflow: 'hidden' },
  gridTextTile: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  gridTextTileText: { fontSize: 10, color: TEXT_PRIMARY, textAlign: 'center', lineHeight: 13 },
  gridOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gridOverlayText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  gridDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
