import { useCallback, useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import PopularDetailModal from '@/components/PopularDetailModal';
import quotes from '@/data/kesfet_sozleri.json';
import { getPopularFavorites, type PopularFavorite } from '@/services/popularFavorites';
import { getFeed, addPost, deletePost, toggleLike, reportContent, type KesfetFeedPost } from '@/services/kesfetPosts';
import CommentsModal from '@/components/CommentsModal';
import { shareText } from '@/utils/share';
import { relativeTime } from '@/utils/relativeTime';
import { avatarColor } from '@/utils/avatarColor';
import { promptReport } from '@/utils/reportPrompt';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const QUOTE_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = TabScreenProps;
type FeedRow = { type: 'post'; post: KesfetFeedPost } | { type: 'quote'; text: string };

const QUOTES: string[] = quotes;
const QUOTE_EVERY = 5;
const MAX_POST_LENGTH = 280;

// 48 saatlik dönem mantığı, eski Keşfet akışıyla aynı — aynı gün herkese
// aynı sözler gösterilsin diye sunucu olmadan da senkron kalıyor.
function quotePool(): string[] {
  if (QUOTES.length === 0) return [];
  const now = new Date();
  const epochMs = now.getTime() + 3 * 3600 * 1000 - 8 * 3600 * 1000;
  const period = Math.floor(epochMs / (48 * 3600 * 1000));
  const offset = (period * 11) % QUOTES.length;
  return [...QUOTES.slice(offset), ...QUOTES.slice(0, offset)];
}

function buildRows(feed: KesfetFeedPost[]): FeedRow[] {
  const pool = quotePool();
  const rows: FeedRow[] = [];
  feed.forEach((post, index) => {
    rows.push({ type: 'post', post });
    if ((index + 1) % QUOTE_EVERY === 0 && pool.length > 0) {
      rows.push({ type: 'quote', text: pool[Math.floor(index / QUOTE_EVERY) % pool.length] });
    }
  });
  return rows;
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setOpen(false);
    setText('');
    setImageUri(null);
  };

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('İzin gerekli', 'Fotoğraf eklemek için galeri erişimine izin vermelisin.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  }, []);

  const submit = useCallback(async () => {
    if (!text.trim() && !imageUri) return;
    setPosting(true);
    try {
      await addPost(text, imageUri ?? undefined);
      reset();
      onPosted();
    } catch (err) {
      showAlert('Paylaşılamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setPosting(false);
    }
  }, [text, imageUri, onPosted]);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.composerCollapsed}>
        <View style={[styles.avatar, { backgroundColor: avatarColor('@sen') }]}>
          <Text style={styles.avatarText}>S</Text>
        </View>
        <Text style={styles.composerPlaceholder}>Bugün neler oluyor?</Text>
        <Ionicons name="image-outline" size={20} color={GOLD} />
      </Pressable>
    );
  }

  return (
    <View style={styles.composerOpen}>
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX_POST_LENGTH))}
        placeholder="Aklından geçeni, bir kart yorumunu ya da bugün yaşadığın bir işareti paylaş..."
        placeholderTextColor={TEXT_MUTED}
        multiline
        autoFocus
        style={styles.composerInput}
      />
      {imageUri && (
        <View style={styles.composerImageWrap}>
          <Image source={{ uri: imageUri }} style={styles.composerImage} resizeMode="cover" />
          <Pressable onPress={() => setImageUri(null)} style={styles.composerImageRemove} hitSlop={8}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
      <View style={styles.composerFooter}>
        <Pressable onPress={pickImage} style={styles.composerIconButton} hitSlop={8}>
          <Ionicons name="image-outline" size={20} color={GOLD} />
        </Pressable>
        <Text style={styles.composerCounter}>{text.length}/{MAX_POST_LENGTH}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={reset} style={styles.composerCancelButton}>
          <Text style={styles.composerCancelText}>Vazgeç</Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={posting || (!text.trim() && !imageUri)}
          style={[styles.composerSubmitButton, (posting || (!text.trim() && !imageUri)) && styles.composerSubmitDisabled]}
        >
          {posting ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.composerSubmitText}>Paylaş</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function PostCard({
  post,
  onToggleLike,
  onDelete,
  onOpenComments,
  onReport,
  onPressAuthor,
}: {
  post: KesfetFeedPost;
  onToggleLike: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenComments: (id: string) => void;
  onReport: (id: string) => void;
  onPressAuthor: (userId: string) => void;
}) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Pressable onPress={() => onPressAuthor(post.authorId)} style={styles.postAuthorPressable} hitSlop={4}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(post.authorTag) }]}>
            <Text style={styles.avatarText}>{post.authorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.postAuthorWrap}>
            <Text style={styles.postAuthorName}>{post.authorName}</Text>
            <Text style={styles.postMeta}>
              {post.authorTag} · {relativeTime(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        {post.isMe ? (
          <Pressable onPress={() => onDelete(post.id)} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color={TEXT_MUTED} />
          </Pressable>
        ) : (
          <Pressable onPress={() => onReport(post.id)} hitSlop={10}>
            <Ionicons name="flag-outline" size={17} color={TEXT_MUTED} />
          </Pressable>
        )}
      </View>

      {!!post.text && <Text style={styles.postText}>{post.text}</Text>}
      {post.imageUri && <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />}

      <View style={styles.postActions}>
        <Pressable onPress={() => onToggleLike(post.id)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? '#E0708A' : TEXT_MUTED} />
          <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>{post.likeCount}</Text>
        </Pressable>
        <Pressable onPress={() => onOpenComments(post.id)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={17} color={TEXT_MUTED} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => shareText(`${post.authorName}: ${post.text}\n\n— Mistik Rehber Keşfet —`)}
          style={styles.actionButton}
          hitSlop={6}
        >
          <Ionicons name="share-social-outline" size={17} color={TEXT_MUTED} />
        </Pressable>
      </View>
    </View>
  );
}

export default function KesfetScreen({ navigation }: Props) {
  const [feed, setFeed] = useState<KesfetFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [popular, setPopular] = useState<PopularFavorite[]>([]);
  const [selectedPopular, setSelectedPopular] = useState<PopularFavorite | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const refreshFeed = useCallback(() => {
    getFeed()
      .then((items) => {
        setFeed(items);
        setFeedError(false);
        setLoading(false);
      })
      .catch(() => {
        setFeedError(true);
        setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshFeed();
    }, [refreshFeed]),
  );

  // Aşağı çekince yenileme — Instagram tarzı; arka planda periyodik bir
  // zamanlayıcı YOK, sadece bu jestte veya ekrana tekrar girildiğinde
  // (useFocusEffect) yenileniyor.
  const handlePullRefresh = useCallback(() => {
    setRefreshing(true);
    getFeed()
      .then((items) => {
        setFeed(items);
        setFeedError(false);
      })
      .catch(() => setFeedError(true))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    getPopularFavorites().then((items) => {
      setPopular(items.filter((item) => item.kind !== 'info' && !item.id.startsWith('info:')));
    });
  }, []);

  const handleToggleLike = useCallback(
    async (id: string) => {
      try {
        await toggleLike(id);
        refreshFeed();
      } catch (err) {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      }
    },
    [refreshFeed],
  );

  const handleDelete = useCallback(
    (id: string) => {
      showAlert('Gönderiyi sil', 'Bu gönderiyi silmek istediğine emin misin?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(id);
              refreshFeed();
            } catch (err) {
              showAlert('Silinemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
            }
          },
        },
      ]);
    },
    [refreshFeed],
  );

  const handlePressAuthor = useCallback(
    (userId: string) => {
      navigation.navigate('UserProfile', { userId });
    },
    [navigation],
  );

  const handleReport = useCallback((id: string) => {
    promptReport((reason) => {
      reportContent('post', id, reason)
        .then(() => showAlert('Teşekkürler', 'Şikayetin alındı.'))
        .catch((err) => showAlert('Gönderilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.'));
    });
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsPostId(null);
    refreshFeed();
  }, [refreshFeed]);

  const handleCommentAuthorPress = useCallback(
    (userId: string) => {
      setCommentsPostId(null);
      navigation.navigate('UserProfile', { userId });
    },
    [navigation],
  );

  const rows = buildRows(feed);

  return (
    <MysticTableBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} tintColor={GOLD} colors={[GOLD]} />
        }
      >
        <View style={styles.header}>
          <Ionicons name="compass-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Keşfet</Text>
        </View>

        {popular.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Ionicons name="flame-outline" size={16} color={GOLD} />
              <Text style={styles.popularTitle}>Haftanın En Sevilenleri</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
              {popular.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedPopular(item)}
                  style={({ pressed }) => [styles.popularCard, pressed && styles.popularCardPressed]}
                >
                  {item.title && <Text style={styles.popularCardTitle}>{item.title}</Text>}
                  <Text style={styles.popularCardBody} numberOfLines={4}>
                    {item.body}
                  </Text>
                  <View style={styles.popularCountRow}>
                    <Ionicons name="star" size={11} color={GOLD} />
                    <Text style={styles.popularCount}>{item.count}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Composer onPosted={refreshFeed} />
        <Text style={styles.retentionHint}>Gönderiler 3 gün sonra akıştan otomatik kalkar.</Text>

        {loading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} />
        ) : feedError ? (
          <View style={styles.feedErrorWrap}>
            <Text style={styles.feedErrorText}>Akış yüklenemedi. İnternet bağlantını kontrol et.</Text>
            <Pressable onPress={refreshFeed} style={styles.feedRetryButton}>
              <Text style={styles.feedRetryText}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.feed}>
            {rows.map((row, index) => {
              if (row.type === 'post') {
                return (
                  <PostCard
                    key={row.post.id}
                    post={row.post}
                    onToggleLike={handleToggleLike}
                    onDelete={handleDelete}
                    onOpenComments={setCommentsPostId}
                    onReport={handleReport}
                    onPressAuthor={handlePressAuthor}
                  />
                );
              }
              return (
                <ImageBackground
                  key={`quote-${index}`}
                  source={QUOTE_CARD_BG}
                  style={styles.quoteCard}
                  imageStyle={styles.quoteCardImage}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={['rgba(11, 10, 31, 0.55)', 'rgba(11, 10, 31, 0.72)']}
                    style={styles.quoteScrim}
                    pointerEvents="none"
                  />
                  <FavoriteStarButton id={`quote:${row.text}`} kind="quote" body={row.text} />
                  <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} style={styles.quoteIcon} />
                  <Text style={styles.quoteText}>{row.text}</Text>
                  <View style={styles.quoteShareRow}>
                    <ShareButton text={`Mistik Rehber\n\n"${row.text}"`} label="Paylaş" />
                    <ShareImageButton text={row.text} label="Görsel Paylaş" />
                  </View>
                </ImageBackground>
              );
            })}
          </View>
        )}
      </ScrollView>
      <PopularDetailModal item={selectedPopular} onClose={() => setSelectedPopular(null)} />
      <CommentsModal postId={commentsPostId} onClose={handleCloseComments} onPressAuthor={handleCommentAuthorPress} />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  popularSection: {
    marginBottom: 22,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  popularTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  popularRow: {
    gap: 12,
  },
  popularCard: {
    width: 180,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
  },
  popularCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  popularCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  popularCardBody: {
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  popularCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  popularCount: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
    marginBottom: 20,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: TEXT_MUTED,
  },
  composerOpen: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
    marginBottom: 20,
  },
  composerInput: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  composerImageWrap: {
    position: 'relative',
    marginTop: 10,
  },
  composerImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  composerImageRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  composerIconButton: {
    padding: 4,
  },
  composerCounter: {
    fontSize: 10.5,
    color: TEXT_MUTED,
  },
  composerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  composerCancelText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  composerSubmitButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 72,
    alignItems: 'center',
  },
  composerSubmitDisabled: {
    opacity: 0.45,
  },
  composerSubmitText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1a0d33',
  },
  retentionHint: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 22,
  },
  feed: {
    gap: 14,
  },
  feedErrorWrap: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  feedErrorText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  feedRetryButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  feedRetryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
  },
  postCard: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  postAuthorPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAuthorWrap: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  postMeta: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  postText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  actionCountLiked: {
    color: '#E0708A',
  },
  quoteCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
  },
  quoteCardImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  quoteScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  quoteIcon: {
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteShareRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
});
