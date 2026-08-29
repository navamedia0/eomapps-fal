import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  Image,
  RefreshControl,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getFeed, addPost, deletePost, toggleLike, reportContent, type KesfetFeedPost } from '@/services/kesfetPosts';
import CommentsModal from '@/components/CommentsModal';
import { shareText } from '@/utils/share';
import { relativeTime } from '@/utils/relativeTime';
import { avatarColor } from '@/utils/avatarColor';
import { promptReport } from '@/utils/reportPrompt';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;
type KesfetTab = 'gonderi' | 'populerGonderi' | 'durum' | 'populerDurum';

const MAX_POST_LENGTH = 280;
const THREE_DAYS_MS = 3 * 24 * 3600 * 1000;

// Spam-safe etkileşim puanı hesaplama:
// Beğeni ağırlığı + spam olmayan tekil yorumlar
function calculateScore(p: KesfetFeedPost): number {
  return p.likeCount * 2 + Math.min(p.commentCount, 50);
}

// 3 günlük döngüde en yüksek etkileşim alan gönderileri kalıcı (hall-of-fame) yapar
function processFeedPosts(feed: KesfetFeedPost[]) {
  const now = Date.now();
  
  // 3 günlük dönem bloklarına göre grupla
  const photoCycleMap: Record<number, KesfetFeedPost> = {};
  const statusCycleMap: Record<number, KesfetFeedPost> = {};

  feed.forEach((p) => {
    const postTime = new Date(p.createdAt).getTime();
    const cycle = Math.floor(postTime / THREE_DAYS_MS);
    const score = calculateScore(p);

    if (p.imageUri) {
      if (!photoCycleMap[cycle] || score > calculateScore(photoCycleMap[cycle])) {
        photoCycleMap[cycle] = p;
      }
    } else {
      if (!statusCycleMap[cycle] || score > calculateScore(statusCycleMap[cycle])) {
        statusCycleMap[cycle] = p;
      }
    }
  });

  const popularPhotoIds = new Set(
    Object.values(photoCycleMap)
      .filter((p) => calculateScore(p) >= 1) // En az 1 etkileşim almış olmalı
      .map((p) => p.id),
  );

  const popularStatusIds = new Set(
    Object.values(statusCycleMap)
      .filter((p) => calculateScore(p) >= 1)
      .map((p) => p.id),
  );

  // Normal gönderiler: 3 gün içindekiler
  const activePhotos = feed.filter((p) => !!p.imageUri && now - new Date(p.createdAt).getTime() < THREE_DAYS_MS);
  const activeStatuses = feed.filter((p) => !p.imageUri && now - new Date(p.createdAt).getTime() < THREE_DAYS_MS);

  // Popüler gönderiler: Her 3 günlük döngünün en çok sevilen kalıcıları (Kırmızı Çerçeveli)
  const popularPhotos = feed.filter((p) => !!p.imageUri && popularPhotoIds.has(p.id));
  const popularStatuses = feed.filter((p) => !p.imageUri && popularStatusIds.has(p.id));

  return {
    activePhotos,
    activeStatuses,
    popularPhotos,
    popularStatuses,
    popularPhotoIds,
    popularStatusIds,
  };
}

// GÖNDERİ COMPOSER (Instagram Tarzı - Fotoğraf Zorunlu + Açıklama)
function PhotoPostComposer({ onPosted }: { onPosted: () => void }) {
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
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setOpen(true);
    }
  }, []);

  const submit = useCallback(async () => {
    if (!imageUri) {
      showAlert('Fotoğraf Gerekli', 'Gönderi paylaşmak için lütfen bir fotoğraf seçin.');
      return;
    }
    setPosting(true);
    try {
      await addPost(text, imageUri);
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
      <Pressable onPress={pickImage} style={styles.composerCollapsed}>
        <View style={[styles.avatar, { backgroundColor: avatarColor('@sen') }]}>
          <Text style={styles.avatarText}>S</Text>
        </View>
        <Text style={styles.composerPlaceholder}>Fotoğraflı bir gönderi paylaş...</Text>
        <View style={styles.cameraPill}>
          <Ionicons name="camera" size={17} color={GOLD} />
          <Text style={styles.cameraPillText}>Fotoğraf Seç</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.composerOpen}>
      {imageUri && (
        <View style={styles.composerImageWrap}>
          <Image source={{ uri: imageUri }} style={styles.composerImage} resizeMode="cover" />
          <Pressable onPress={() => setImageUri(null)} style={styles.composerImageRemove} hitSlop={8}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX_POST_LENGTH))}
        placeholder="Fotoğrafın altına bir açıklama yaz..."
        placeholderTextColor={TEXT_MUTED}
        multiline
        style={styles.composerInput}
      />
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
          disabled={posting || !imageUri}
          style={[styles.composerSubmitButton, (posting || !imageUri) && styles.composerSubmitDisabled]}
        >
          {posting ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.composerSubmitText}>Paylaş</Text>}
        </Pressable>
      </View>
    </View>
  );
}

// DURUM COMPOSER (Tweet / X Tarzı - Sadece Metin, Asla Fotoğraf Yok)
function TextStatusComposer({ onPosted }: { onPosted: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setOpen(false);
    setText('');
  };

  const submit = useCallback(async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await addPost(text);
      reset();
      onPosted();
    } catch (err) {
      showAlert('Paylaşılamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setPosting(false);
    }
  }, [text, onPosted]);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.composerCollapsed}>
        <View style={[styles.avatar, { backgroundColor: avatarColor('@sen') }]}>
          <Text style={styles.avatarText}>S</Text>
        </View>
        <Text style={styles.composerPlaceholder}>Aklından geçeni yaz, durum paylaş...</Text>
        <Ionicons name="chatbox-ellipses-outline" size={20} color={GOLD} />
      </Pressable>
    );
  }

  return (
    <View style={styles.composerOpen}>
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX_POST_LENGTH))}
        placeholder="Aklından geçeni veya bir düşünceni tweet gibi paylaş..."
        placeholderTextColor={TEXT_MUTED}
        multiline
        autoFocus
        style={styles.composerInput}
      />
      <View style={styles.composerFooter}>
        <Text style={styles.composerCounter}>{text.length}/{MAX_POST_LENGTH}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={reset} style={styles.composerCancelButton}>
          <Text style={styles.composerCancelText}>Vazgeç</Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={posting || !text.trim()}
          style={[styles.composerSubmitButton, (posting || !text.trim()) && styles.composerSubmitDisabled]}
        >
          {posting ? <ActivityIndicator size="small" color="#1a0d33" /> : <Text style={styles.composerSubmitText}>Durum Paylaş</Text>}
        </Pressable>
      </View>
    </View>
  );
}

// FOTOĞRAFLI GÖNDERİ KARTI (Instagram Tarzı + Popüler Kırmızı Çerçeve)
function PhotoPostCard({
  post,
  isPopular,
  onToggleLike,
  onDelete,
  onOpenComments,
  onReport,
  onPressAuthor,
}: {
  post: KesfetFeedPost;
  isPopular?: boolean;
  onToggleLike: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenComments: (id: string) => void;
  onReport: (id: string) => void;
  onPressAuthor: (userId: string) => void;
}) {
  return (
    <View style={[styles.photoCard, isPopular && styles.popularRedBorder]}>
      {/* Popüler Rozet */}
      {isPopular && (
        <View style={styles.popularBadgeWrap}>
          <Ionicons name="flame" size={13} color="#FFF" />
          <Text style={styles.popularBadgeText}>3 Günün Efsanesi · Popüler Gönderi</Text>
        </View>
      )}

      {/* Header */}
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
          <Pressable onPress={() => onDelete(post.id)} style={styles.postDeleteButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={17} color={TEXT_MUTED} />
          </Pressable>
        ) : (
          <Pressable onPress={() => onReport(post.id)} style={styles.postDeleteButton} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={17} color={TEXT_MUTED} />
          </Pressable>
        )}
      </View>

      {/* Large Photo */}
      {post.imageUri && (
        <View style={styles.photoWrap}>
          <Image source={{ uri: post.imageUri }} style={styles.photoImage} resizeMode="cover" />
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <Pressable onPress={() => onToggleLike(post.id)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? '#EF4444' : TEXT_PRIMARY} />
          <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>{post.likeCount}</Text>
        </Pressable>
        <Pressable onPress={() => onOpenComments(post.id)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={19} color={TEXT_PRIMARY} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => shareText(`${post.authorName}: ${post.text || 'Görsel paylaştı'}\n\n— Mistik Rehber Keşfet —`)}
          style={styles.actionButton}
          hitSlop={6}
        >
          <Ionicons name="share-social-outline" size={19} color={TEXT_MUTED} />
        </Pressable>
      </View>

      {/* Caption Text */}
      {post.text ? (
        <View style={styles.photoCaptionWrap}>
          <Text style={styles.captionAuthor}>{post.authorName}{' '}</Text>
          <Text style={styles.captionText}>{post.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

// METİN DURUM KARTI (Tweet / X Tarzı + Popüler Kırmızı Çerçeve)
function TextStatusCard({
  post,
  isPopular,
  onToggleLike,
  onDelete,
  onOpenComments,
  onReport,
  onPressAuthor,
}: {
  post: KesfetFeedPost;
  isPopular?: boolean;
  onToggleLike: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenComments: (id: string) => void;
  onReport: (id: string) => void;
  onPressAuthor: (userId: string) => void;
}) {
  return (
    <View style={[styles.statusCard, isPopular && styles.popularRedBorder]}>
      {/* Popüler Rozet */}
      {isPopular && (
        <View style={styles.popularBadgeWrap}>
          <Ionicons name="flame" size={13} color="#FFF" />
          <Text style={styles.popularBadgeText}>3 Günün Efsanesi · Popüler Durum</Text>
        </View>
      )}

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
          <Pressable onPress={() => onDelete(post.id)} style={styles.postDeleteButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={17} color={TEXT_MUTED} />
          </Pressable>
        ) : (
          <Pressable onPress={() => onReport(post.id)} style={styles.postDeleteButton} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={17} color={TEXT_MUTED} />
          </Pressable>
        )}
      </View>

      <Text style={styles.statusTextBody}>{post.text}</Text>

      <View style={styles.postActions}>
        <Pressable onPress={() => onToggleLike(post.id)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? '#EF4444' : TEXT_MUTED} />
          <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>{post.likeCount}</Text>
        </Pressable>
        <Pressable onPress={() => onOpenComments(post.id)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name="chatbubble-outline" size={17} color={TEXT_MUTED} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => shareText(`${post.authorName}: ${post.text}\n\n— Mistik Rehber Durum —`)}
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
  const [tab, setTab] = useState<KesfetTab>('gonderi');
  const [feed, setFeed] = useState<KesfetFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState(false);
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

  const handleToggleLike = useCallback((id: string) => {
    setFeed((prev) =>
      prev.map((p) => (p.id === id ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p)),
    );
    toggleLike(id).catch((err) => {
      showAlert('İşlem Başarısız', err instanceof Error ? err.message : 'Beğeni kaydedilemedi.');
      refreshFeed();
    });
  }, [refreshFeed]);

  const handleDelete = useCallback(
    (id: string) => {
      showAlert('Gönderiyi Sil', 'Bu paylaşımı silmek istediğine emin misin?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setFeed((prev) => prev.filter((p) => p.id !== id));
            deletePost(id).catch((err) => {
              showAlert('Silinemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
              refreshFeed();
            });
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

  // Popüler & Normal akış listeleri
  const {
    activePhotos,
    activeStatuses,
    popularPhotos,
    popularStatuses,
    popularPhotoIds,
    popularStatusIds,
  } = useMemo(() => processFeedPosts(feed), [feed]);

  return (
    <MysticTableBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} tintColor={GOLD} colors={[GOLD]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="compass-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Keşfet</Text>
        </View>

        {/* 4 Sekmeli Buton Alanı: Gönderi, Popüler Gönderiler, Durum, Popüler Durumlar */}
        <View style={styles.tabSwitchGrid}>
          <View style={styles.tabSwitchRow}>
            <Pressable
              onPress={() => setTab('gonderi')}
              style={[styles.tabSwitchButton, tab === 'gonderi' && styles.tabSwitchButtonActive]}
            >
              <Ionicons name="images-outline" size={15} color={tab === 'gonderi' ? '#1a0d33' : GOLD} />
              <Text style={[styles.tabSwitchText, tab === 'gonderi' && styles.tabSwitchTextActive]}>
                Gönderi ({activePhotos.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('populerGonderi')}
              style={[
                styles.tabSwitchButton,
                styles.populerTabBtn,
                tab === 'populerGonderi' && styles.populerTabBtnActive,
              ]}
            >
              <Ionicons name="flame" size={15} color={tab === 'populerGonderi' ? '#FFF' : '#EF4444'} />
              <Text
                style={[
                  styles.tabSwitchText,
                  { color: '#EF4444' },
                  tab === 'populerGonderi' && styles.populerTabBtnTextActive,
                ]}
              >
                Popüler Gönderiler ({popularPhotos.length})
              </Text>
            </Pressable>
          </View>

          <View style={styles.tabSwitchRow}>
            <Pressable
              onPress={() => setTab('durum')}
              style={[styles.tabSwitchButton, tab === 'durum' && styles.tabSwitchButtonActive]}
            >
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={16}
                color={tab === 'durum' ? '#1a0d33' : GOLD}
              />
              <Text style={[styles.tabSwitchText, tab === 'durum' && styles.tabSwitchTextActive]}>
                Durum ({activeStatuses.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('populerDurum')}
              style={[
                styles.tabSwitchButton,
                styles.populerTabBtn,
                tab === 'populerDurum' && styles.populerTabBtnActive,
              ]}
            >
              <MaterialCommunityIcons
                name="crown"
                size={16}
                color={tab === 'populerDurum' ? '#FFF' : '#EF4444'}
              />
              <Text
                style={[
                  styles.tabSwitchText,
                  { color: '#EF4444' },
                  tab === 'populerDurum' && styles.populerTabBtnTextActive,
                ]}
              >
                Popüler Durumlar ({popularStatuses.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* TAB 1: GÖNDERİLER (Son 3 Günlük Fotoğraflı) */}
        {tab === 'gonderi' && (
          <View style={styles.tabContent}>
            <PhotoPostComposer onPosted={refreshFeed} />
            <Text style={styles.retentionHint}>
              Gönderiler 3 gün sonra akıştan silinir. En çok etkileşim alan gönderi Popüler'e girip kalıcı olur!
            </Text>

            {loading ? (
              <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} />
            ) : feedError ? (
              <View style={styles.feedErrorWrap}>
                <Text style={styles.feedErrorText}>Akış yüklenemedi. İnternet bağlantını kontrol et.</Text>
                <Pressable onPress={refreshFeed} style={styles.feedRetryButton}>
                  <Text style={styles.feedRetryText}>Tekrar dene</Text>
                </Pressable>
              </View>
            ) : activePhotos.length === 0 ? (
              <View style={styles.emptyFeedWrap}>
                <Ionicons name="images-outline" size={44} color={GOLD_SOFT} />
                <Text style={styles.emptyFeedTitle}>Henüz fotoğraflı gönderi yok</Text>
                <Text style={styles.emptyFeedSubtitle}>İlk görseli yukarıdan sen paylaş!</Text>
              </View>
            ) : (
              <View style={styles.feed}>
                {activePhotos.map((post) => (
                  <PhotoPostCard
                    key={post.id}
                    post={post}
                    isPopular={popularPhotoIds.has(post.id)}
                    onToggleLike={handleToggleLike}
                    onDelete={handleDelete}
                    onOpenComments={setCommentsPostId}
                    onReport={handleReport}
                    onPressAuthor={handlePressAuthor}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 2: POPÜLER GÖNDERİLER (Kırmızı Çerçeveli Efsaneler) */}
        {tab === 'populerGonderi' && (
          <View style={styles.tabContent}>
            <View style={styles.popularInfoBanner}>
              <Ionicons name="flame" size={16} color="#EF4444" />
              <Text style={styles.popularInfoBannerText}>
                3 günlük döngülerde en çok beğeni ve etkileşim alan gönderiler silinmez, kalıcı efsane olur.
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#EF4444" style={{ marginTop: 30 }} />
            ) : popularPhotos.length === 0 ? (
              <View style={styles.emptyFeedWrap}>
                <Ionicons name="flame-outline" size={44} color="#EF4444" />
                <Text style={[styles.emptyFeedTitle, { color: '#EF4444' }]}>Henüz popüler gönderi seçilmedi</Text>
                <Text style={styles.emptyFeedSubtitle}>En yüksek etkileşimi toplayan gönderi burada kalıcı olur!</Text>
              </View>
            ) : (
              <View style={styles.feed}>
                {popularPhotos.map((post) => (
                  <PhotoPostCard
                    key={post.id}
                    post={post}
                    isPopular={true}
                    onToggleLike={handleToggleLike}
                    onDelete={handleDelete}
                    onOpenComments={setCommentsPostId}
                    onReport={handleReport}
                    onPressAuthor={handlePressAuthor}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: DURUMLAR (Son 3 Günlük Metinler) */}
        {tab === 'durum' && (
          <View style={styles.tabContent}>
            <TextStatusComposer onPosted={refreshFeed} />
            <Text style={styles.retentionHint}>
              Durumlar 3 gün sonra silinir. En çok sevilen durum Popüler'e girip kalıcı olur!
            </Text>

            {loading ? (
              <ActivityIndicator color={GOLD} style={{ marginTop: 30 }} />
            ) : feedError ? (
              <View style={styles.feedErrorWrap}>
                <Text style={styles.feedErrorText}>Akış yüklenemedi. İnternet bağlantını kontrol et.</Text>
                <Pressable onPress={refreshFeed} style={styles.feedRetryButton}>
                  <Text style={styles.feedRetryText}>Tekrar dene</Text>
                </Pressable>
              </View>
            ) : activeStatuses.length === 0 ? (
              <View style={styles.emptyFeedWrap}>
                <MaterialCommunityIcons name="chat-outline" size={44} color={GOLD_SOFT} />
                <Text style={styles.emptyFeedTitle}>Henüz durum paylaşılmadı</Text>
                <Text style={styles.emptyFeedSubtitle}>Aklından geçenleri ilk sen paylaş!</Text>
              </View>
            ) : (
              <View style={styles.feed}>
                {activeStatuses.map((post) => (
                  <TextStatusCard
                    key={post.id}
                    post={post}
                    isPopular={popularStatusIds.has(post.id)}
                    onToggleLike={handleToggleLike}
                    onDelete={handleDelete}
                    onOpenComments={setCommentsPostId}
                    onReport={handleReport}
                    onPressAuthor={handlePressAuthor}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 4: POPÜLER DURUMLAR (Kırmızı Çerçeveli Efsane Sözler) */}
        {tab === 'populerDurum' && (
          <View style={styles.tabContent}>
            <View style={styles.popularInfoBanner}>
              <MaterialCommunityIcons name="crown" size={16} color="#EF4444" />
              <Text style={styles.popularInfoBannerText}>
                3 günlük döngülerde en çok etkileşim alan durumlar kalıcı olur ve silinmez.
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#EF4444" style={{ marginTop: 30 }} />
            ) : popularStatuses.length === 0 ? (
              <View style={styles.emptyFeedWrap}>
                <MaterialCommunityIcons name="crown-outline" size={44} color="#EF4444" />
                <Text style={[styles.emptyFeedTitle, { color: '#EF4444' }]}>Henüz popüler durum seçilmedi</Text>
                <Text style={styles.emptyFeedSubtitle}>En çok beğenilen durumlar burada ölümsüzleşir!</Text>
              </View>
            ) : (
              <View style={styles.feed}>
                {popularStatuses.map((post) => (
                  <TextStatusCard
                    key={post.id}
                    post={post}
                    isPopular={true}
                    onToggleLike={handleToggleLike}
                    onDelete={handleDelete}
                    onOpenComments={setCommentsPostId}
                    onReport={handleReport}
                    onPressAuthor={handlePressAuthor}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <CommentsModal
        postId={commentsPostId}
        onClose={() => {
          setCommentsPostId(null);
          refreshFeed();
        }}
        onPressAuthor={(userId) => {
          setCommentsPostId(null);
          navigation.navigate('UserProfile', { userId });
        }}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
  },
  tabSwitchGrid: {
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 16,
    padding: 6,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    gap: 6,
  },
  tabSwitchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabSwitchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabSwitchButtonActive: {
    backgroundColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  populerTabBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  populerTabBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  tabSwitchText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  tabSwitchTextActive: {
    color: '#1a0d33',
    fontWeight: '800',
  },
  populerTabBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  tabContent: {
    width: '100%',
  },
  popularInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  popularInfoBannerText: {
    fontSize: 11.5,
    color: '#FCA5A5',
    flex: 1,
    lineHeight: 16,
  },
  retentionHint: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 12,
  },
  composerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 20, 58, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: TEXT_MUTED,
  },
  cameraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cameraPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
  },
  composerOpen: {
    backgroundColor: 'rgba(30, 20, 58, 0.95)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  composerInput: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  composerImageWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 220,
  },
  composerImage: {
    width: '100%',
    height: 220,
  },
  composerImageRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 4,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(242, 200, 121, 0.15)',
  },
  composerIconButton: {
    padding: 4,
  },
  composerCounter: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  composerCancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  composerCancelText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  composerSubmitButton: {
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  composerSubmitDisabled: {
    opacity: 0.4,
  },
  composerSubmitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a0d33',
  },
  feed: {
    gap: 16,
  },
  photoCard: {
    backgroundColor: 'rgba(30, 20, 58, 0.92)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    overflow: 'hidden',
  },
  statusCard: {
    backgroundColor: 'rgba(30, 20, 58, 0.92)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    padding: 16,
  },
  popularRedBorder: {
    borderColor: '#EF4444',
    borderWidth: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  popularBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  postAuthorPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
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
  postDeleteButton: {
    padding: 4,
  },
  photoWrap: {
    width: '100%',
    height: 340,
    backgroundColor: '#0a0614',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoCaptionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  captionAuthor: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD_SOFT,
  },
  captionText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  statusTextBody: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    fontWeight: '500',
    marginVertical: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    color: '#EF4444',
    fontWeight: '700',
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
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  feedRetryText: {
    color: GOLD,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyFeedWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: GOLD,
  },
  emptyFeedSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
