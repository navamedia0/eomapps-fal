import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/services/themedAlert';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import AvatarRenderer from '@/components/avatar/AvatarRenderer';
import CommentsModal from '@/components/CommentsModal';
import { getStoredSession } from '@/services/auth';
import { getUserProfile, followUser, unfollowUser, blockUser, type SocialProfile } from '@/services/socialProfile';
import { getFeed, deletePost, toggleLike, type KesfetFeedPost } from '@/services/kesfetPosts';
import { avatarColor } from '@/utils/avatarColor';
import { relativeTime } from '@/utils/relativeTime';
import { shareText } from '@/utils/share';
import { xpProgress } from '@/utils/xp';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;
type ProfileTab = 'character' | 'posts';
type PostsViewMode = 'grid' | 'feed';

const BADGE_CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'social', label: 'Sosyallik', icon: 'people' },
  { key: 'popularity', label: 'Popülerlik', icon: 'flame' },
  { key: 'game', label: 'Oyun', icon: 'leaf' },
  { key: 'fal', label: 'Fal', icon: 'moon' },
];

const GRID_GAP = 2;
const GRID_COLUMNS = 3;

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

// FULL-SCREEN INSTAGRAM-STYLE POST DETAIL MODAL
function PostDetailModal({
  post,
  onClose,
  onOpenComments,
  onDelete,
}: {
  post: KesfetFeedPost | null;
  onClose: () => void;
  onOpenComments: (postId: string) => void;
  onDelete: (postId: string) => void;
}) {
  const [liked, setLiked] = useState(post?.liked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likeCount ?? 0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (post) {
      setLiked(post.liked);
      setLikeCount(post.likeCount);
    }
  }, [post]);

  if (!post) return null;

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    toggleLike(post.id).catch(() => {});
  };

  return (
    <Modal visible={!!post} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.postDetailContainer, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 }]}>
        {/* Top Navbar */}
        <View style={styles.postDetailHeader}>
          <Pressable onPress={onClose} style={styles.detailBackBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.detailHeaderTitle}>Gönderi</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Post Author Info */}
          <View style={styles.detailAuthorRow}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarColor(post.authorTag) }]}>
              <Text style={styles.avatarLetter}>{post.authorName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailAuthorName}>{post.authorName}</Text>
              <Text style={styles.detailTimeText}>{relativeTime(post.createdAt)}</Text>
            </View>
            {post.isMe && (
              <Pressable
                onPress={() => {
                  onClose();
                  onDelete(post.id);
                }}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            )}
          </View>

          {/* Full Large Media */}
          {post.imageUri ? (
            <View style={styles.detailImageWrap}>
              <Image source={{ uri: post.imageUri }} style={styles.detailImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.detailTextStatusWrap}>
              <Text style={styles.detailTextStatusBody}>{post.text}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.detailActionsRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Pressable onPress={handleLike} style={styles.detailActionBtn} hitSlop={6}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? '#EF4444' : '#FFFFFF'}
                />
              </Pressable>
              <Pressable onPress={() => onOpenComments(post.id)} style={styles.detailActionBtn} hitSlop={6}>
                <Ionicons name="chatbubble-outline" size={23} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => shareText(`${post.authorName}: ${post.text || 'Görsel paylaştı'}\n\n— Mistik Rehber —`)}
                style={styles.detailActionBtn}
                hitSlop={6}
              >
                <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Likes & Caption */}
          <View style={styles.detailMetaWrap}>
            {likeCount > 0 && (
              <Text style={styles.detailLikesText}>{likeCount} beğenme</Text>
            )}

            {post.imageUri && post.text ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                <Text style={styles.detailCaptionUsername}>{post.authorName} </Text>
                <Text style={styles.detailCaptionBody}>{post.text}</Text>
              </View>
            ) : null}

            <Pressable onPress={() => onOpenComments(post.id)} hitSlop={4} style={{ marginTop: 6 }}>
              <Text style={styles.detailCommentsLink}>
                {post.commentCount > 0 ? `${post.commentCount} yorumun tümünü gör` : 'Yorum ekle...'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PostsSection({
  userId,
  isSelf,
  onSelectPost,
  onOpenComments,
}: {
  userId: string;
  isSelf: boolean;
  onSelectPost: (post: KesfetFeedPost) => void;
  onOpenComments: (postId: string) => void;
}) {
  const { width } = useWindowDimensions();
  const [posts, setPosts] = useState<KesfetFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<PostsViewMode>('grid');

  const tileSize = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

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

  if (loading) {
    return <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} />;
  }

  if (posts.length === 0) {
    return (
      <View style={styles.postsEmpty}>
        <Ionicons name="images-outline" size={36} color={TEXT_MUTED} />
        <Text style={styles.postsEmptyText}>{isSelf ? 'Henüz bir paylaşımın yok.' : 'Henüz bir paylaşımı yok.'}</Text>
        {isSelf && <Text style={styles.postsEmptySubtext}>Keşfet sekmesinden fotoğraf veya durum paylaşabilirsin.</Text>}
      </View>
    );
  }

  return (
    <View style={styles.postsWrap}>
      {/* View Mode Toggle: Grid or Single Feed */}
      <View style={styles.viewModeToggleRow}>
        <Pressable
          onPress={() => setViewMode('grid')}
          style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
          hitSlop={6}
        >
          <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#FFFFFF' : TEXT_MUTED} />
          <Text style={[styles.viewModeBtnText, viewMode === 'grid' && styles.viewModeBtnTextActive]}>Izgara</Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('feed')}
          style={[styles.viewModeBtn, viewMode === 'feed' && styles.viewModeBtnActive]}
          hitSlop={6}
        >
          <Ionicons name="square" size={18} color={viewMode === 'feed' ? '#FFFFFF' : TEXT_MUTED} />
          <Text style={[styles.viewModeBtnText, viewMode === 'feed' && styles.viewModeBtnTextActive]}>Tek Gösterim</Text>
        </Pressable>
      </View>

      {viewMode === 'grid' ? (
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id}
          numColumns={GRID_COLUMNS}
          scrollEnabled={false}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ gap: GRID_GAP }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelectPost(item)}
              style={[styles.gridTile, { width: tileSize, height: tileSize }]}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              ) : (
                <View style={styles.gridTextTile}>
                  <MaterialCommunityIcons name="text" size={16} color={GOLD} style={{ marginBottom: 4 }} />
                  <Text style={styles.gridTextTileText} numberOfLines={3}>
                    {item.text}
                  </Text>
                </View>
              )}

              {/* Grid overlay counters */}
              <View style={styles.gridOverlay}>
                <Ionicons name="heart" size={11} color="#fff" />
                <Text style={styles.gridOverlayText}>{item.likeCount}</Text>
                <Ionicons name="chatbubble" size={10} color="#fff" style={{ marginLeft: 6 }} />
                <Text style={styles.gridOverlayText}>{item.commentCount}</Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        /* Single Feed View (Keşfet Style Full Size) */
        <View style={styles.feedViewList}>
          {posts.map((item) => (
            <View key={item.id} style={styles.feedPostCard}>
              <View style={styles.feedPostHeader}>
                <View style={[styles.avatarCircleSmall, { backgroundColor: avatarColor(item.authorTag) }]}>
                  <Text style={styles.avatarLetterSmall}>{item.authorName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedAuthorName}>{item.authorName}</Text>
                  <Text style={styles.feedTimeText}>{relativeTime(item.createdAt)}</Text>
                </View>
              </View>

              {item.imageUri ? (
                <Pressable onPress={() => onSelectPost(item)} style={styles.feedImageWrap}>
                  <Image source={{ uri: item.imageUri }} style={styles.feedImage} resizeMode="cover" />
                </Pressable>
              ) : (
                <View style={styles.feedTextStatusWrap}>
                  <Text style={styles.feedTextStatusBody}>{item.text}</Text>
                </View>
              )}

              <View style={styles.feedActionBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Pressable onPress={() => onSelectPost(item)}>
                    <Ionicons
                      name={item.liked ? 'heart' : 'heart-outline'}
                      size={22}
                      color={item.liked ? '#EF4444' : '#FFFFFF'}
                    />
                  </Pressable>
                  <Pressable onPress={() => onOpenComments(item.id)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
                {item.likeCount > 0 && (
                  <Text style={styles.feedLikesCount}>{item.likeCount} beğenme</Text>
                )}
              </View>

              {item.text && item.imageUri ? (
                <View style={styles.feedCaptionRow}>
                  <Text style={styles.feedCaptionUser}>{item.authorName} </Text>
                  <Text style={styles.feedCaptionText}>{item.text}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('character');
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<KesfetFeedPost | null>(null);

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

  const handleDeletePost = useCallback((postId: string) => {
    showAlert('Gönderiyi Sil', 'Bu paylaşımı silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            setSelectedPost(null);
            load();
          } catch (err) {
            showAlert('Silinemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
          }
        },
      },
    ]);
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profil yüklenemedi.</Text>
        <Pressable onPress={load} style={styles.retryButton}>
          <Text style={styles.retryText}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  const { user, followerCount, followingCount, isFollowing, xp, level, achievementCount, popularityScore, avatar } = profile;
  const authorTag = `@${user.id.slice(0, 8)}`;
  const isSelf = meId === user.id;
  const progress = xpProgress(xp);
  const hasBadges = achievementCount > 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card / Header */}
        <View style={styles.profileSection}>
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
                  <ActivityIndicator size="small" color={isFollowing ? '#FFF' : '#09090B'} />
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
                <Ionicons name="chatbubble-outline" size={19} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={handleBlock} style={styles.blockButton} hitSlop={8}>
                <Ionicons name="ban-outline" size={20} color={TEXT_MUTED} />
              </Pressable>
            </View>
          )}

          {/* Badges / Stats */}
          <View style={styles.badgeRow}>
            {BADGE_CATEGORIES.map((badge) => (
              <View key={badge.key} style={[styles.badgeIcon, hasBadges && styles.badgeIconActive]}>
                <Ionicons name={badge.icon} size={18} color={hasBadges ? GOLD : TEXT_MUTED} />
                <Text style={[styles.badgeLabel, hasBadges && styles.badgeLabelActive]}>{badge.label}</Text>
              </View>
            ))}
          </View>

          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <Ionicons name="trophy-outline" size={16} color={GOLD} />
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
        </View>

        {/* Tab Row (Karakterim / Paylaşımlar) */}
        <View style={styles.tabRow}>
          <Pressable onPress={() => setTab('character')} style={[styles.tabButton, tab === 'character' && styles.tabButtonActive]}>
            <Ionicons name="sparkles-outline" size={16} color={tab === 'character' ? '#FFFFFF' : TEXT_MUTED} />
            <Text style={[styles.tabButtonText, tab === 'character' && styles.tabButtonTextActive]}>Karakterim</Text>
          </Pressable>
          <Pressable onPress={() => setTab('posts')} style={[styles.tabButton, tab === 'posts' && styles.tabButtonActive]}>
            <Ionicons name="grid-outline" size={16} color={tab === 'posts' ? '#FFFFFF' : TEXT_MUTED} />
            <Text style={[styles.tabButtonText, tab === 'posts' && styles.tabButtonTextActive]}>Paylaşımlar</Text>
          </Pressable>
        </View>

        {tab === 'character' ? (
          <View style={styles.avatarPanel}>
            <View style={styles.avatarStage}>
              <View style={styles.avatarAuraGlow} />
              <AvatarRenderer
                gender={avatar.gender}
                skinId={avatar.skinItemId}
                hatItemId={avatar.hatItemId}
                capeItemId={avatar.capeItemId}
                outfitItemId={avatar.outfitItemId}
                pantsItemId={avatar.pantsItemId}
                size={250}
              />
              <View style={styles.avatarPedestal} />
            </View>
            {isSelf && (
              <Pressable onPress={() => navigation.navigate('AvatarWardrobe')} style={styles.editAvatarButton}>
                <Ionicons name="shirt-outline" size={16} color="#000000" />
                <Text style={styles.editAvatarText}>Karakter & Gardırobu Düzenle</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <PostsSection
            userId={user.id}
            isSelf={isSelf}
            onSelectPost={setSelectedPost}
            onOpenComments={setCommentsPostId}
          />
        )}
      </ScrollView>

      {/* FULL POST DETAIL MODAL (Opens when tapping any post in grid) */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onOpenComments={(pId) => setCommentsPostId(pId)}
        onDelete={handleDeletePost}
      />

      {/* COMMENTS MODAL */}
      <CommentsModal
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onPressAuthor={(pressedUserId) => {
          setCommentsPostId(null);
          if (pressedUserId !== userId) navigation.navigate('UserProfile', { userId: pressedUserId });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090B' },
  centerContainer: { flex: 1, backgroundColor: '#09090B', alignItems: 'center', justifyContent: 'center', gap: 12 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
    backgroundColor: '#09090B',
  },
  headerBackBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },
  profileSection: { paddingHorizontal: 16, paddingTop: 16 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  retryText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  igRow: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)' },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  photoFallbackText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  igStatsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: 16 },
  nameBlock: { marginTop: 14 },
  name: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  tag: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  bio: { fontSize: 13, lineHeight: 18, color: '#E4E4E7', marginTop: 8 },
  statItem: { alignItems: 'center', minWidth: 50 },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: TEXT_MUTED, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  followButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  followButtonActive: { backgroundColor: '#27272A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  followButtonText: { fontSize: 13, fontWeight: '700', color: '#09090B' },
  followButtonTextActive: { color: '#FFFFFF' },
  buttonDisabled: { opacity: 0.6 },
  blockButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 18 },
  badgeIcon: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
  },
  badgeIconActive: { borderColor: 'rgba(229, 169, 60, 0.35)' },
  badgeLabel: { fontSize: 10, fontWeight: '700', color: TEXT_MUTED },
  badgeLabelActive: { color: TEXT_PRIMARY },
  progressCard: {
    marginTop: 16,
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 12,
  },
  progressCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressCardTitle: { fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY },
  progressRow: { gap: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  progressValue: { fontSize: 10.5, color: TEXT_MUTED },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#27272A', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: GOLD },
  tabRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#18181B',
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
  tabButtonActive: { borderBottomColor: '#FFFFFF' },
  tabButtonText: { fontSize: 12.5, fontWeight: '700', color: TEXT_MUTED },
  tabButtonTextActive: { color: '#FFFFFF' },
  avatarPanel: {
    marginTop: 16,
    marginHorizontal: 14,
    backgroundColor: '#0F0F12',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
    paddingVertical: 20,
    alignItems: 'center',
  },
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarAuraGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(229, 169, 60, 0.08)',
    top: 20,
  },
  avatarPedestal: {
    width: 160,
    height: 18,
    backgroundColor: '#18181D',
    borderRadius: 80,
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.4)',
    marginTop: -8,
  },
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  editAvatarText: { fontSize: 13, fontWeight: '900', color: '#000000' },
  postsEmpty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  postsEmptyText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '600' },
  postsEmptySubtext: { fontSize: 11.5, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 30 },
  postsWrap: { marginTop: 2 },
  viewModeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  viewModeBtnActive: {
    backgroundColor: '#27272A',
  },
  viewModeBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridTile: { backgroundColor: '#18181B', overflow: 'hidden' },
  gridTextTile: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8, backgroundColor: '#18181B' },
  gridTextTileText: { fontSize: 10, color: TEXT_PRIMARY, textAlign: 'center', lineHeight: 13 },
  gridOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridOverlayText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // Feed Mode on Profile
  feedViewList: { gap: 12, paddingTop: 8 },
  feedPostCard: { backgroundColor: '#09090B', borderBottomWidth: 1, borderBottomColor: '#18181B', paddingBottom: 12 },
  feedPostHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8 },
  avatarCircleSmall: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarLetterSmall: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  feedAuthorName: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  feedTimeText: { fontSize: 10.5, color: TEXT_MUTED },
  feedImageWrap: { width: '100%', height: 340, backgroundColor: '#18181B' },
  feedImage: { width: '100%', height: '100%' },
  feedTextStatusWrap: { padding: 14, marginHorizontal: 14, backgroundColor: '#18181B', borderRadius: 12 },
  feedTextStatusBody: { fontSize: 14, color: '#FFF', lineHeight: 20 },
  feedActionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8 },
  feedLikesCount: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  feedCaptionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, marginTop: 4 },
  feedCaptionUser: { fontSize: 12.5, fontWeight: '700', color: '#FFF' },
  feedCaptionText: { fontSize: 12.5, color: '#E4E4E7' },

  // POST DETAIL MODAL STYLES
  postDetailContainer: { flex: 1, backgroundColor: '#09090B' },
  postDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  detailBackBtn: { padding: 4 },
  detailHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  detailAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  detailAuthorName: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  detailTimeText: { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },
  detailImageWrap: { width: '100%', height: 380, backgroundColor: '#121215' },
  detailImage: { width: '100%', height: '100%' },
  detailTextStatusWrap: { padding: 18, marginHorizontal: 14, backgroundColor: '#18181B', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  detailTextStatusBody: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  detailActionsRow: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  detailActionBtn: { padding: 2 },
  detailMetaWrap: { paddingHorizontal: 14, gap: 4 },
  detailLikesText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  detailCaptionUsername: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  detailCaptionBody: { fontSize: 13, color: '#E4E4E7', lineHeight: 18 },
  detailCommentsLink: { fontSize: 12.5, color: TEXT_MUTED },
});
