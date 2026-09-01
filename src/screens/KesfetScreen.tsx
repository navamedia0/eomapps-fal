import React, { useCallback, useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  Image,
  RefreshControl,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { TabScreenProps } from '@/navigation/types';
import { getFeed, addPost, deletePost, toggleLike, addPostBoost, reportContent, type KesfetFeedPost } from '@/services/kesfetPosts';
import CommentsModal from '@/components/CommentsModal';
import { spendCoins } from '@/services/coins';
import { shareText } from '@/utils/share';
import { relativeTime } from '@/utils/relativeTime';
import { avatarColor } from '@/utils/avatarColor';
import { promptReport } from '@/utils/reportPrompt';
import { GOLD, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;
type KesfetTab = 'gonderi' | 'populerGonderi' | 'durum' | 'populerDurum';

const MAX_POST_LENGTH = 300;
const ONE_DAY_MS = 24 * 3600 * 1000;
const SUPER_LIKE_DIAMONDS = 15;
const LUXURY_LIKE_DIAMONDS = 35;

function calculateScore(p: KesfetFeedPost): number {
  return p.likeCount * 2 + Math.min(p.commentCount, 50);
}

// 24 saatlik döngüde en yüksek etkileşim alan gönderileri kalıcı (hall-of-fame) yapar
function processFeedPosts(feed: KesfetFeedPost[]) {
  const now = Date.now();
  const photoCycleMap: Record<number, KesfetFeedPost> = {};
  const statusCycleMap: Record<number, KesfetFeedPost> = {};

  feed.forEach((p) => {
    const postTime = new Date(p.createdAt).getTime();
    const cycle = Math.floor(postTime / ONE_DAY_MS);
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
      .filter((p) => calculateScore(p) >= 1)
      .map((p) => p.id),
  );

  const popularStatusIds = new Set(
    Object.values(statusCycleMap)
      .filter((p) => calculateScore(p) >= 1)
      .map((p) => p.id),
  );

  // Normal gönderiler: 24 saat içindekiler
  const activePhotos = feed.filter((p) => !!p.imageUri && now - new Date(p.createdAt).getTime() < ONE_DAY_MS);
  const activeStatuses = feed.filter((p) => !p.imageUri && now - new Date(p.createdAt).getTime() < ONE_DAY_MS);

  // Popüler kalıcı gönderiler
  const rawPopularPhotos = feed.filter((p) => !!p.imageUri && popularPhotoIds.has(p.id));
  const rawPopularStatuses = feed.filter((p) => !p.imageUri && popularStatusIds.has(p.id));

  return {
    activePhotos,
    activeStatuses,
    rawPopularPhotos,
    rawPopularStatuses,
    popularPhotoIds,
    popularStatusIds,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function KesfetScreen({ navigation }: Props) {
  const [tab, setTab] = useState<KesfetTab>('gonderi');
  const [feed, setFeed] = useState<KesfetFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [selectedPostForLikes, setSelectedPostForLikes] = useState<KesfetFeedPost | null>(null);
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const insets = useSafeAreaInsets();

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

  const handleNormalLike = useCallback(async (p: KesfetFeedPost) => {
    const optimisticLiked = !p.liked;
    const optimisticCount = optimisticLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1);
    setFeed((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, liked: optimisticLiked, likeCount: optimisticCount } : item)),
    );

    try {
      const res = await toggleLike(p.id);
      setFeed((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, liked: res.liked, likeCount: res.likeCount } : item)),
      );
    } catch (err) {
      showAlert('İşlem Başarısız', err instanceof Error ? err.message : 'Beğeni kaydedilemedi.');
      refreshFeed();
    }
  }, [refreshFeed]);

  const handleSuperLike = useCallback(async (p: KesfetFeedPost) => {
    const success = await spendCoins(SUPER_LIKE_DIAMONDS);
    if (!success) {
      showAlert('Yetersiz Kristal', `Süper Beğeni (x3) göndermek için ${SUPER_LIKE_DIAMONDS} Kristal gereklidir.`);
      return;
    }

    await addPostBoost(p.id, 3);

    if (!p.liked) {
      toggleLike(p.id).catch(() => {});
    }

    setFeed((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, liked: true, likeCount: item.likeCount + (item.liked ? 3 : 4) } : item)),
    );
    showAlert('✨ Süper Beğeni Gönderildi!', `Gönderiye +3 Beğeni eklendi ve öne çıkarıldı! (${SUPER_LIKE_DIAMONDS} Kristal 💎)`);
  }, []);

  const handleLuxuryLike = useCallback(async (p: KesfetFeedPost) => {
    const success = await spendCoins(LUXURY_LIKE_DIAMONDS);
    if (!success) {
      showAlert('Yetersiz Kristal', `Lüks Beğeni (x5) göndermek için ${LUXURY_LIKE_DIAMONDS} Kristal gereklidir.`);
      return;
    }

    await addPostBoost(p.id, 5);

    if (!p.liked) {
      toggleLike(p.id).catch(() => {});
    }

    setFeed((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, liked: true, likeCount: item.likeCount + (item.liked ? 5 : 6) } : item)),
    );
    showAlert('👑 Lüks Beğeni Gönderildi!', `Gönderiye +5 Beğeni eklendi ve zirveye taşındı! (${LUXURY_LIKE_DIAMONDS} Kristal 💎)`);
  }, []);

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

  const toggleSavePost = (id: string) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        showAlert('Kaydedildi', 'Gönderi koleksiyonuna kaydedildi.');
      }
      return next;
    });
  };

  const {
    activePhotos,
    activeStatuses,
    rawPopularPhotos,
    rawPopularStatuses,
    popularPhotoIds,
    popularStatusIds,
  } = useMemo(() => processFeedPosts(feed), [feed]);

  const popularPhotos = useMemo(() => shuffleArray(rawPopularPhotos), [rawPopularPhotos, tab]);
  const popularStatuses = useMemo(() => shuffleArray(rawPopularStatuses), [rawPopularStatuses, tab]);

  const isPhotoTab = tab === 'gonderi' || tab === 'populerGonderi';
  const currentList =
    tab === 'gonderi' ? activePhotos : tab === 'populerGonderi' ? popularPhotos : tab === 'durum' ? activeStatuses : popularStatuses;
  const isPopularBadge = (post: KesfetFeedPost) =>
    tab === 'populerGonderi' || tab === 'populerDurum' || (isPhotoTab ? popularPhotoIds.has(post.id) : popularStatusIds.has(post.id));

  // HEADER: Top Navbar + 24H Info Card + Share Bar + 4 Sekmeli Filtre Çubuğu
  const renderHeader = () => (
    <View style={styles.feedHeaderContainer}>
      {/* App Header Bar (Sağ üstteki hatalı buton kaldırıldı, sadece Sohbet ikonu var) */}
      <View style={[styles.appHeader, { paddingTop: insets.top + 6 }]}>
        <View style={styles.appHeaderLeft}>
          <Text style={styles.logoText}>Mistik Keşfet</Text>
          <MaterialCommunityIcons name="star-four-points" size={14} color={GOLD} style={{ marginLeft: 4 }} />
        </View>

        <View style={styles.appHeaderRight}>
          <Pressable
            onPress={() => setComposeModalVisible(true)}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.iconPressed]}
            hitSlop={6}
          >
            <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* 24-Hour Cycle Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="time-outline" size={14} color={GOLD} style={{ marginTop: 1 }} />
        <Text style={styles.infoBannerText}>
          Gönderiler <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>24 saat sonra silinir</Text>. En çok etkileşim alan gönderi <Text style={{ fontWeight: '800', color: GOLD }}>Popüler'e girip kalıcı olur!</Text> ✨
        </Text>
      </View>

      {/* 4 Sekmeli Filtre Çubuğu */}
      <View style={styles.tabSwitchGrid}>
        <Pressable
          onPress={() => setTab('gonderi')}
          style={[styles.tabButton, tab === 'gonderi' && styles.tabButtonActive]}
        >
          <Ionicons name="image-outline" size={13} color={tab === 'gonderi' ? '#FFF' : TEXT_MUTED} />
          <Text style={[styles.tabButtonText, tab === 'gonderi' && styles.tabButtonTextActive]}>
            Fotoğraflar
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('populerGonderi')}
          style={[styles.tabButton, tab === 'populerGonderi' && styles.tabButtonActivePopular]}
        >
          <Ionicons name="flame" size={13} color={tab === 'populerGonderi' ? '#FFF' : '#EF4444'} />
          <Text style={[styles.tabButtonText, tab === 'populerGonderi' && styles.tabButtonTextActive]}>
            Popüler Gönderiler
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('durum')}
          style={[styles.tabButton, tab === 'durum' && styles.tabButtonActive]}
        >
          <MaterialCommunityIcons name="text-box-outline" size={13} color={tab === 'durum' ? '#FFF' : TEXT_MUTED} />
          <Text style={[styles.tabButtonText, tab === 'durum' && styles.tabButtonTextActive]}>
            Düşünceler
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('populerDurum')}
          style={[styles.tabButton, tab === 'populerDurum' && styles.tabButtonActivePopular]}
        >
          <MaterialCommunityIcons name="crown" size={13} color={tab === 'populerDurum' ? '#FFF' : GOLD} />
          <Text style={[styles.tabButtonText, tab === 'populerDurum' && styles.tabButtonTextActive]}>
            Popüler Düşünceler
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // RENDER POST ITEM (Normal ve Valir Cehennem Sefiri Tarzı Seçkin Kalıcı Çerçeve)
  const renderPostItem = ({ item }: { item: KesfetFeedPost }) => {
    const isPopular = isPopularBadge(item);
    const isSaved = savedPosts.has(item.id);

    return (
      <View style={[styles.instagramPostContainer, isPopular && styles.legendCardWrap]}>
        {/* VALIR CEHENNEM SEFİRİ TARZI SEÇKİN ÜST TAÇ ÇERÇEVESİ (Popüler Kalıcı Gönderiler İçin) */}
        {isPopular && (
          <LinearGradient
            colors={['#450A0A', '#7F1D1D', '#991B1B', '#7F1D1D', '#450A0A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.legendTopCrest}
          >
            <View style={styles.legendGemBadge}>
              <MaterialCommunityIcons name="crown" size={13} color="#FEF08A" />
              <Text style={styles.legendGemText}>KALICI GÖNDERİ</Text>
              <MaterialCommunityIcons name="star-four-points" size={11} color="#FEF08A" />
            </View>
          </LinearGradient>
        )}

        {/* Post Top Header (Avatar, Kullanıcı Adı, Süre ve Sil/Menü Butonu) */}
        <View style={[styles.postHeader, isPopular && styles.legendPostHeader]}>
          <Pressable
            onPress={() => handlePressAuthor(item.authorId)}
            style={styles.postHeaderUser}
            hitSlop={4}
          >
            <View style={[
              styles.avatarCircle,
              { backgroundColor: avatarColor(item.authorTag) },
              isPopular && styles.legendAvatarBorder,
            ]}>
              <Text style={styles.avatarLetter}>{item.authorName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.postHeaderTextWrap}>
              <View style={styles.usernameRow}>
                <Text style={styles.usernameText}>{item.authorName}</Text>
                {isPopular && (
                  <MaterialCommunityIcons name="check-decagram" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={styles.postTimeText}>{relativeTime(item.createdAt)}</Text>
            </View>
          </Pressable>

          {item.isMe ? (
            <Pressable onPress={() => handleDelete(item.id)} style={styles.postMoreBtn} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={isPopular ? '#FCA5A5' : TEXT_MUTED} />
            </Pressable>
          ) : (
            <Pressable onPress={() => handleReport(item.id)} style={styles.postMoreBtn} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={18} color={isPopular ? '#FCA5A5' : TEXT_MUTED} />
            </Pressable>
          )}
        </View>

        {/* Post Media: Photo or Text Status (Kenarlardan hafif içeride ve çerçeveye tam oturan tasarım) */}
        {item.imageUri ? (
          <View style={[styles.photoContainer, isPopular && styles.legendPhotoFrame]}>
            <Image source={{ uri: item.imageUri }} style={styles.postImage} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.statusTextContainer, isPopular && styles.legendStatusContainer]}>
            <Text style={styles.statusTextBody}>{item.text}</Text>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionBar}>
          <View style={styles.actionBarLeft}>
            <Pressable
              onPress={() => setSelectedPostForLikes(item)}
              style={({ pressed }) => [styles.actionIconButton, pressed && styles.iconPressed]}
              hitSlop={6}
            >
              <Ionicons
                name={item.liked ? 'heart' : 'heart-outline'}
                size={25}
                color={item.liked ? '#EF4444' : '#FFFFFF'}
              />
            </Pressable>

            <Pressable
              onPress={() => setCommentsPostId(item.id)}
              style={({ pressed }) => [styles.actionIconButton, pressed && styles.iconPressed]}
              hitSlop={6}
            >
              <Ionicons name="chatbubble-outline" size={23} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() =>
                shareText(`${item.authorName}: ${item.text || 'Görsel paylaştı'}\n\n— Mistik Rehber Keşfet —`)
              }
              style={({ pressed }) => [styles.actionIconButton, pressed && styles.iconPressed]}
              hitSlop={6}
            >
              <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Pressable
            onPress={() => toggleSavePost(item.id)}
            style={({ pressed }) => [styles.actionIconButton, pressed && styles.iconPressed]}
            hitSlop={6}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={23}
              color={isSaved ? GOLD : '#FFFFFF'}
            />
          </Pressable>
        </View>

        {/* Likes Count */}
        <View style={styles.postMetaSection}>
          {item.likeCount > 0 && (
            <Text style={styles.likesCountText}>
              {item.likeCount.toLocaleString('tr-TR')} beğenme
            </Text>
          )}

          {/* Caption */}
          {item.imageUri && item.text ? (
            <View style={styles.captionRow}>
              <Text style={styles.captionUsername}>{item.authorName} </Text>
              <Text style={styles.captionBody}>{item.text}</Text>
            </View>
          ) : null}

          {/* Comments Link */}
          {item.commentCount > 0 ? (
            <Pressable onPress={() => setCommentsPostId(item.id)} hitSlop={4}>
              <Text style={styles.viewCommentsLink}>
                {item.commentCount} yorumun tümünü gör
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setCommentsPostId(item.id)} hitSlop={4}>
              <Text style={styles.viewCommentsLink}>Yorum ekle...</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={40} color={TEXT_MUTED} />
              <Text style={styles.emptyTitle}>
                {tab === 'populerGonderi' || tab === 'populerDurum'
                  ? 'Henüz Popüler paylaşım yok'
                  : 'Henüz paylaşım yok'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'populerGonderi' || tab === 'populerDurum'
                  ? 'En çok beğeni alan gönderiler 24 saat sonunda burada kalıcı olur.'
                  : 'İlk gönderiyi sen paylaş, 24 saatlik akışı canlandır.'}
              </Text>
            </View>
          }
        />
      )}

      {/* CREATE POST MODAL */}
      <CreatePostModal
        visible={composeModalVisible}
        onClose={() => setComposeModalVisible(false)}
        onPosted={() => {
          setComposeModalVisible(false);
          refreshFeed();
        }}
      />

      {/* LIKE OPTIONS MODAL (Standart, Süper x3, Lüks x5) */}
      <LikeOptionsModal
        visible={!!selectedPostForLikes}
        post={selectedPostForLikes}
        onClose={() => setSelectedPostForLikes(null)}
        onNormalLike={(p) => {
          setSelectedPostForLikes(null);
          handleNormalLike(p);
        }}
        onSuperLike={(p) => {
          setSelectedPostForLikes(null);
          handleSuperLike(p);
        }}
        onLuxuryLike={(p) => {
          setSelectedPostForLikes(null);
          handleLuxuryLike(p);
        }}
      />

      {/* COMMENTS MODAL */}
      {commentsPostId && (
        <CommentsModal
          postId={commentsPostId}
          onClose={() => setCommentsPostId(null)}
          onPressAuthor={handlePressAuthor}
        />
      )}
    </View>
  );
}

// CREATE POST MODAL
function CreatePostModal({
  visible,
  onClose,
  onPosted,
}: {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setText('');
    setImageUri(null);
    onClose();
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('İzin gerekli', 'Fotoğraf seçmek için galeri erişimine izin vermelisin.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageUri) {
      showAlert('İçerik gerekli', 'Lütfen bir fotoğraf seçin veya bir düşünce yazın.');
      return;
    }
    setPosting(true);
    try {
      await addPost(text, imageUri || undefined);
      reset();
      onPosted();
    } catch (err) {
      showAlert('Paylaşılamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.createModalCard}>
          <View style={styles.createModalHeader}>
            <Pressable onPress={reset} hitSlop={8}>
              <Text style={styles.createCancelText}>Vazgeç</Text>
            </Pressable>
            <Text style={styles.createModalTitle}>Yeni Paylaşım</Text>
            <Pressable
              onPress={handleSubmit}
              disabled={posting || (!text.trim() && !imageUri)}
              hitSlop={8}
            >
              {posting ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : (
                <Text
                  style={[
                    styles.createSubmitText,
                    (!text.trim() && !imageUri) && styles.createSubmitDisabled,
                  ]}
                >
                  Paylaş
                </Text>
              )}
            </Pressable>
          </View>

          {imageUri ? (
            <View style={styles.createImageWrap}>
              <Image source={{ uri: imageUri }} style={styles.createImagePreview} />
              <Pressable onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                <Ionicons name="close" size={16} color="#FFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickImage} style={styles.addPhotoSlot}>
              <Ionicons name="camera-outline" size={32} color={GOLD} />
              <Text style={styles.addPhotoSlotText}>Fotoğraf Seç (İsteğe bağlı)</Text>
            </Pressable>
          )}

          <TextInput
            value={text}
            onChangeText={(t) => setText(t.slice(0, MAX_POST_LENGTH))}
            placeholder="Bir açıklama yaz veya düşünceni paylaş..."
            placeholderTextColor={TEXT_MUTED}
            multiline
            style={styles.createTextInput}
          />

          <View style={styles.createModalFooter}>
            <Pressable onPress={pickImage} style={styles.footerPickIcon}>
              <Ionicons name="image-outline" size={22} color={GOLD} />
            </Pressable>
            <Text style={styles.charCounter}>
              {text.length}/{MAX_POST_LENGTH}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// LIKE OPTIONS MODAL
function LikeOptionsModal({
  visible,
  post,
  onClose,
  onNormalLike,
  onSuperLike,
  onLuxuryLike,
}: {
  visible: boolean;
  post: KesfetFeedPost | null;
  onClose: () => void;
  onNormalLike: (p: KesfetFeedPost) => void;
  onSuperLike: (p: KesfetFeedPost) => void;
  onLuxuryLike: (p: KesfetFeedPost) => void;
}) {
  if (!visible || !post) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.likeOptionsCard}>
          <View style={styles.likeOptionsHeader}>
            <Ionicons name="heart-circle" size={24} color="#EF4444" />
            <Text style={styles.likeOptionsTitle}>Beğeni Türü</Text>
          </View>

          <Pressable
            onPress={() => onNormalLike(post)}
            style={styles.likeOptionRow}
          >
            <View style={[styles.likeIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="heart" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.likeOptionName}>Standart Beğeni</Text>
              <Text style={styles.likeOptionDesc}>+1 Beğeni ekler</Text>
            </View>
            <Text style={styles.freeBadgeText}>Ücretsiz</Text>
          </Pressable>

          <Pressable
            onPress={() => onSuperLike(post)}
            style={[styles.likeOptionRow, styles.superLikeRow]}
          >
            <View style={[styles.likeIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
              <Ionicons name="sparkles" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.likeOptionName, { color: '#60A5FA' }]}>Süper Beğeni (x3)</Text>
              <Text style={styles.likeOptionDesc}>+3 Beğeni ekler ve öne çıkarır</Text>
            </View>
            <Text style={[styles.diamondBadgeText, { color: '#60A5FA' }]}>{SUPER_LIKE_DIAMONDS} 💎</Text>
          </Pressable>

          <Pressable
            onPress={() => onLuxuryLike(post)}
            style={[styles.likeOptionRow, styles.luxuryLikeRow]}
          >
            <View style={[styles.likeIconCircle, { backgroundColor: 'rgba(229, 169, 60, 0.2)' }]}>
              <MaterialCommunityIcons name="crown" size={22} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.likeOptionName, { color: GOLD }]}>Lüks Beğeni (x5)</Text>
              <Text style={styles.likeOptionDesc}>+5 Beğeni ekler, zirveye taşır</Text>
            </View>
            <Text style={[styles.diamondBadgeText, { color: GOLD }]}>{LUXURY_LIKE_DIAMONDS} 💎</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.likeCancelBtn}>
            <Text style={styles.likeCancelText}>Kapat</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatListContent: {
    paddingBottom: 60,
  },
  feedHeaderContainer: {
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
    paddingBottom: 8,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  appHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconButton: {
    padding: 2,
  },
  iconPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
  },
  quickCreateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 14,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickCreateAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCreatePlaceholder: {
    flex: 1,
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  quickCreateCameraBtn: {
    padding: 2,
  },
  tabSwitchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
  },
  tabButton: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabButtonActive: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabButtonActivePopular: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: '#EF4444',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  // POST CARD STYLES
  instagramPostContainer: {
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
    paddingBottom: 12,
  },

  // VALIR CEHENNEM SEFİRİ TARZI SEÇKİN ÇERÇEVE
  legendCardWrap: {
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#130808',
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  legendTopCrest: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.4)',
  },
  legendGemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#991B1B',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  legendGemText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.8,
  },
  legendPostHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(69, 10, 10, 0.4)',
  },
  legendAvatarBorder: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  legendPhotoFrame: {
    marginHorizontal: 6,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  legendStatusContainer: {
    marginHorizontal: 6,
    backgroundColor: '#200D0D',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  postHeaderTextWrap: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postTimeText: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  postMoreBtn: {
    padding: 4,
  },
  photoContainer: {
    alignSelf: 'stretch',
    height: 380,
    backgroundColor: '#121215',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  statusTextContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#121215',
    marginHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusTextBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconButton: {
    padding: 3,
  },
  postMetaSection: {
    paddingHorizontal: 14,
    gap: 4,
  },
  likesCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  captionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  captionUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  captionBody: {
    fontSize: 13,
    color: '#E4E4E7',
    lineHeight: 18,
  },
  viewCommentsLink: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // CREATE MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  createModalCard: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  createModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  createCancelText: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  createModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  createSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
  },
  createSubmitDisabled: {
    opacity: 0.35,
  },
  addPhotoSlot: {
    height: 140,
    backgroundColor: '#27272A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 14,
  },
  addPhotoSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  createImageWrap: {
    position: 'relative',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    marginVertical: 14,
  },
  createImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTextInput: {
    fontSize: 14.5,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerPickIcon: {
    padding: 4,
  },
  charCounter: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },

  // LIKE OPTIONS
  likeOptionsCard: {
    backgroundColor: '#18181B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 18,
    margin: 16,
    marginBottom: 36,
    gap: 10,
  },
  likeOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  likeOptionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  likeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 12,
  },
  superLikeRow: {
    borderColor: 'rgba(59, 130, 246, 0.35)',
    backgroundColor: 'rgba(30, 38, 80, 0.5)',
  },
  luxuryLikeRow: {
    borderColor: 'rgba(229, 169, 60, 0.35)',
    backgroundColor: 'rgba(48, 38, 20, 0.5)',
  },
  likeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  likeOptionDesc: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  diamondBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  likeCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  likeCancelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
});
