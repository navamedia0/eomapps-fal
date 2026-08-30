import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getFeed, addPost, deletePost, toggleLike, reportContent, type KesfetFeedPost } from '@/services/kesfetPosts';
import CommentsModal from '@/components/CommentsModal';
import { getWallet } from '@/services/shop';
import { getCoins, spendCoins } from '@/services/coins';
import { shareText } from '@/utils/share';
import { relativeTime } from '@/utils/relativeTime';
import { avatarColor } from '@/utils/avatarColor';
import { promptReport } from '@/utils/reportPrompt';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const ROYAL_FRAME_IMG = require('@/assets/icons/royal_post_frame.jpg');

type Props = TabScreenProps;
type KesfetTab = 'gonderi' | 'populerGonderi' | 'durum' | 'populerDurum';

const MAX_POST_LENGTH = 280;
const ONE_DAY_MS = 24 * 3600 * 1000; // 24 Saatlik Otomatik Temizlik

const SUPER_LIKE_DIAMONDS = 15; // Süper Beğeni (x3) için Elmas
const LUXURY_LIKE_DIAMONDS = 35; // Lüks Beğeni (x5) için Elmas

// Spam-safe etkileşim puanı hesaplama:
// Beğeni ağırlığı + spam olmayan tekil yorumlar
function calculateScore(p: KesfetFeedPost): number {
  return p.likeCount * 2 + Math.min(p.commentCount, 50);
}

// 24 saatlik döngüde en yüksek etkileşim alan gönderileri kalıcı (hall-of-fame) yapar
function processFeedPosts(feed: KesfetFeedPost[]) {
  const now = Date.now();
  
  // 24 saatlik dönem bloklarına göre grupla
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
      .filter((p) => calculateScore(p) >= 1) // En az 1 etkileşim almış olmalı
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

  // Popüler gönderiler: Her 24 saatlik döngünün en çok sevilen kalıcıları (Kırmızı Çerçeveli)
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

// Dizi karıştırma (Fair Shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
          <Image source={{ uri: imageUri }} style={styles.composerImage} contentFit="cover" cachePolicy="memory-disk" />
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

// BEĞENİ SEÇENEKLERİ MODALI
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
            <Text style={styles.likeOptionsTitle}>Beğeni Türü Seç</Text>
          </View>

          {/* Normal Beğeni */}
          <Pressable
            onPress={() => {
              onClose();
              onNormalLike(post);
            }}
            style={styles.likeOptionRow}
          >
            <View style={[styles.likeOptionIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="heart" size={20} color="#EF4444" />
            </View>
            <View style={styles.likeOptionTextWrap}>
              <Text style={styles.likeOptionName}>Standart Beğeni</Text>
              <Text style={styles.likeOptionDesc}>+1 Beğeni ekler</Text>
            </View>
            <View style={styles.likeOptionPriceBadge}>
              <Text style={styles.likeOptionFreeText}>Ücretsiz</Text>
            </View>
          </Pressable>

          {/* Süper Beğeni (x3) */}
          <Pressable
            onPress={() => {
              onClose();
              onSuperLike(post);
            }}
            style={[styles.likeOptionRow, styles.superLikeRow]}
          >
            <View style={[styles.likeOptionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.18)' }]}>
              <Ionicons name="sparkles" size={20} color="#3B82F6" />
            </View>
            <View style={styles.likeOptionTextWrap}>
              <Text style={[styles.likeOptionName, { color: '#60A5FA' }]}>Süper Beğeni (x3)</Text>
              <Text style={styles.likeOptionDesc}>+3 Beğeni ekler ve öne çıkarır</Text>
            </View>
            <View style={[styles.likeOptionPriceBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Ionicons name="diamond" size={13} color="#60A5FA" />
              <Text style={[styles.likeOptionDiamondText, { color: '#60A5FA' }]}>{SUPER_LIKE_DIAMONDS} 💎</Text>
            </View>
          </Pressable>

          {/* Lüks Beğeni (x5) */}
          <Pressable
            onPress={() => {
              onClose();
              onLuxuryLike(post);
            }}
            style={[styles.likeOptionRow, styles.luxuryLikeRow]}
          >
            <View style={[styles.likeOptionIconCircle, { backgroundColor: 'rgba(242, 200, 121, 0.2)' }]}>
              <MaterialCommunityIcons name="crown" size={22} color={GOLD} />
            </View>
            <View style={styles.likeOptionTextWrap}>
              <Text style={[styles.likeOptionName, { color: GOLD }]}>Lüks Beğeni (x5)</Text>
              <Text style={styles.likeOptionDesc}>+5 Beğeni ekler, popülerliğe taşır</Text>
            </View>
            <View style={[styles.likeOptionPriceBadge, { backgroundColor: 'rgba(242, 200, 121, 0.22)' }]}>
              <Ionicons name="diamond" size={13} color={GOLD} />
              <Text style={[styles.likeOptionDiamondText, { color: GOLD }]}>{LUXURY_LIKE_DIAMONDS} 💎</Text>
            </View>
          </Pressable>

          <Pressable onPress={onClose} style={styles.likeOptionsCloseBtn}>
            <Text style={styles.likeOptionsCloseText}>Vazgeç</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// KÖŞE SÜSLEMELERİ (Ornate Filigree Corner Accents)
function OrnateCorners() {
  return (
    <>
      <View style={[styles.ornateCorner, styles.ornateCornerTL]}>
        <MaterialCommunityIcons name="cards-diamond" size={14} color={GOLD} />
      </View>
      <View style={[styles.ornateCorner, styles.ornateCornerTR]}>
        <MaterialCommunityIcons name="cards-diamond" size={14} color={GOLD} />
      </View>
      <View style={[styles.ornateCorner, styles.ornateCornerBL]}>
        <MaterialCommunityIcons name="cards-diamond" size={14} color={GOLD} />
      </View>
      <View style={[styles.ornateCorner, styles.ornateCornerBR]}>
        <MaterialCommunityIcons name="cards-diamond" size={14} color={GOLD} />
      </View>
    </>
  );
}

// FOTOĞRAFLI GÖNDERİ KARTI (Instagram Tarzı + Popüler Lüks Kraliyet Çerçevesi)
function PhotoPostCard({
  post,
  isPopular,
  onOpenLikeOptions,
  onDelete,
  onOpenComments,
  onReport,
  onPressAuthor,
}: {
  post: KesfetFeedPost;
  isPopular?: boolean;
  onOpenLikeOptions: (p: KesfetFeedPost) => void;
  onDelete: (id: string) => void;
  onOpenComments: (id: string) => void;
  onReport: (id: string) => void;
  onPressAuthor: (userId: string) => void;
}) {
  return (
    <View style={[styles.photoCard, isPopular && styles.popularRoyalOuterBox]}>
      {isPopular && <OrnateCorners />}

      {/* Popüler Lüks Kozmik Rozet */}
      {isPopular && (
        <View style={styles.popularRoyalBanner}>
          <Image source={ROYAL_FRAME_IMG} style={styles.royalCrownImage} contentFit="cover" cachePolicy="memory-disk" />
          <View style={styles.royalCrownPill}>
            <MaterialCommunityIcons name="crown" size={14} color="#1a0d33" />
            <Text style={styles.royalCrownPillText}>EFSANE</Text>
          </View>
          <Text style={styles.popularRoyalTitle}>24 SAATİN ZİRVE GÖNDERİSİ</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="sparkles" size={16} color={GOLD} />
        </View>
      )}

      {/* Header */}
      <View style={[styles.postHeader, isPopular && styles.royalHeader]}>
        <Pressable onPress={() => onPressAuthor(post.authorId)} style={styles.postAuthorPressable} hitSlop={4}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(post.authorTag) }]}>
            <Text style={styles.avatarText}>{post.authorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.postAuthorWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.postAuthorName, isPopular && { color: GOLD }]}>{post.authorName}</Text>
              {isPopular && <MaterialCommunityIcons name="check-decagram" size={14} color={GOLD} />}
            </View>
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
        <View style={[styles.photoWrap, isPopular && styles.royalPhotoWrap]}>
          <Image source={{ uri: post.imageUri }} style={styles.photoImage} contentFit="cover" cachePolicy="memory-disk" />
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <Pressable onPress={() => onOpenLikeOptions(post)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? '#EF4444' : TEXT_PRIMARY} />
          <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>{post.likeCount}</Text>
          <Ionicons name="chevron-up" size={12} color={GOLD_SOFT} style={{ marginLeft: -2 }} />
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
          <Text style={[styles.captionAuthor, isPopular && { color: GOLD }]}>{post.authorName}{' '}</Text>
          <Text style={styles.captionText}>{post.text}</Text>
        </View>
      ) : null}

      {/* Popüler Altın Şerit Alt Bilgi */}
      {isPopular && (
        <View style={styles.royalFooterPill}>
          <Ionicons name="diamond" size={11} color={GOLD} />
          <Text style={styles.royalFooterPillText}>Kalıcı Efsane Statüsü Kazanıldı</Text>
          <Ionicons name="diamond" size={11} color={GOLD} />
        </View>
      )}
    </View>
  );
}

// METİN DURUM KARTI (Tweet / X Tarzı + Popüler Lüks Kraliyet Çerçevesi)
function TextStatusCard({
  post,
  isPopular,
  onOpenLikeOptions,
  onDelete,
  onOpenComments,
  onReport,
  onPressAuthor,
}: {
  post: KesfetFeedPost;
  isPopular?: boolean;
  onOpenLikeOptions: (p: KesfetFeedPost) => void;
  onDelete: (id: string) => void;
  onOpenComments: (id: string) => void;
  onReport: (id: string) => void;
  onPressAuthor: (userId: string) => void;
}) {
  return (
    <View style={[styles.statusCard, isPopular && styles.popularRoyalOuterBox]}>
      {isPopular && <OrnateCorners />}

      {/* Popüler Lüks Kozmik Rozet */}
      {isPopular && (
        <View style={styles.popularRoyalBanner}>
          <Image source={ROYAL_FRAME_IMG} style={styles.royalCrownImage} contentFit="cover" cachePolicy="memory-disk" />
          <View style={styles.royalCrownPill}>
            <MaterialCommunityIcons name="crown" size={14} color="#1a0d33" />
            <Text style={styles.royalCrownPillText}>EFSANE</Text>
          </View>
          <Text style={styles.popularRoyalTitle}>24 SAATİN ZİRVE DURUMU</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="sparkles" size={16} color={GOLD} />
        </View>
      )}

      <View style={[styles.postHeader, isPopular && styles.royalHeader]}>
        <Pressable onPress={() => onPressAuthor(post.authorId)} style={styles.postAuthorPressable} hitSlop={4}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(post.authorTag) }]}>
            <Text style={styles.avatarText}>{post.authorName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.postAuthorWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.postAuthorName, isPopular && { color: GOLD }]}>{post.authorName}</Text>
              {isPopular && <MaterialCommunityIcons name="check-decagram" size={14} color={GOLD} />}
            </View>
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

      <Text style={[styles.statusTextBody, isPopular && styles.royalStatusTextBody]}>{post.text}</Text>

      <View style={styles.postActions}>
        <Pressable onPress={() => onOpenLikeOptions(post)} style={styles.actionButton} hitSlop={6}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={18} color={post.liked ? '#EF4444' : TEXT_MUTED} />
          <Text style={[styles.actionCount, post.liked && styles.actionCountLiked]}>{post.likeCount}</Text>
          <Ionicons name="chevron-up" size={12} color={GOLD_SOFT} style={{ marginLeft: -2 }} />
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

      {/* Popüler Altın Şerit Alt Bilgi */}
      {isPopular && (
        <View style={styles.royalFooterPill}>
          <Ionicons name="diamond" size={11} color={GOLD} />
          <Text style={styles.royalFooterPillText}>Kalıcı Efsane Statüsü Kazanıldı</Text>
          <Ionicons name="diamond" size={11} color={GOLD} />
        </View>
      )}
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
  const [selectedPostForLikes, setSelectedPostForLikes] = useState<KesfetFeedPost | null>(null);

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

  // Standart Beğeni
  const handleNormalLike = useCallback((p: KesfetFeedPost) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, liked: !item.liked, likeCount: item.liked ? item.likeCount - 1 : item.likeCount + 1 } : item,
      ),
    );
    toggleLike(p.id).catch((err) => {
      showAlert('İşlem Başarısız', err instanceof Error ? err.message : 'Beğeni kaydedilemedi.');
      refreshFeed();
    });
  }, [refreshFeed]);

  // Süper Beğeni (x3 Beğeni - 15 Elmas)
  const handleSuperLike = useCallback(async (p: KesfetFeedPost) => {
    const success = await spendCoins(SUPER_LIKE_DIAMONDS);
    if (!success) {
      showAlert('Yetersiz Elmas', `Süper Beğeni (x3) göndermek için ${SUPER_LIKE_DIAMONDS} Elmas gereklidir.`);
      return;
    }

    setFeed((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, liked: true, likeCount: item.likeCount + 3 } : item)),
    );
    showAlert('✨ Süper Beğeni Gönderildi!', `Gönderiye +3 Beğeni eklendi ve öne çıkarıldı! (${SUPER_LIKE_DIAMONDS} Elmas 💎)`);
    toggleLike(p.id).catch(() => {});
  }, []);

  // Lüks Beğeni (x5 Beğeni - 35 Elmas)
  const handleLuxuryLike = useCallback(async (p: KesfetFeedPost) => {
    const success = await spendCoins(LUXURY_LIKE_DIAMONDS);
    if (!success) {
      showAlert('Yetersiz Elmas', `Lüks Beğeni (x5) göndermek için ${LUXURY_LIKE_DIAMONDS} Elmas gereklidir.`);
      return;
    }

    setFeed((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, liked: true, likeCount: item.likeCount + 5 } : item)),
    );
    showAlert('👑 Lüks Beğeni Gönderildi!', `Gönderiye +5 Beğeni eklendi ve zirveye taşındı! (${LUXURY_LIKE_DIAMONDS} Elmas 💎)`);
    toggleLike(p.id).catch(() => {});
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

  // Popüler & Normal akış listeleri (24 Saatlik Döngü)
  const {
    activePhotos,
    activeStatuses,
    rawPopularPhotos,
    rawPopularStatuses,
    popularPhotoIds,
    popularStatusIds,
  } = useMemo(() => processFeedPosts(feed), [feed]);

  // Popüler gönderiler ve popüler durumlar RASTGELE sıralanır (Her girişte/sekmede adil rastgelelik)
  const popularPhotos = useMemo(() => shuffleArray(rawPopularPhotos), [rawPopularPhotos, tab]);
  const popularStatuses = useMemo(() => shuffleArray(rawPopularStatuses), [rawPopularStatuses, tab]);

  // Aktif sekmenin listesi + o listenin "popüler" rozetini nasıl belirleyeceği
  // — dört ayrı ScrollView+map yerine TEK bir FlatList (gerçek virtualization:
  // ekran dışındaki gönderiler mount edilmiyor/geri dönüştürülüyor). key={tab}
  // sekme değişince temiz bir remount zorluyor, farklı veri şekillerinin
  // birbirine karışmasını engelliyor.
  const isPhotoTab = tab === 'gonderi' || tab === 'populerGonderi';
  const currentList =
    tab === 'gonderi' ? activePhotos : tab === 'populerGonderi' ? popularPhotos : tab === 'durum' ? activeStatuses : popularStatuses;
  const isPopularBadge = (post: KesfetFeedPost) =>
    tab === 'populerGonderi' || tab === 'populerDurum' || (isPhotoTab ? popularPhotoIds.has(post.id) : popularStatusIds.has(post.id));

  const listHeader = (
    <>
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

      {tab === 'gonderi' && (
        <>
          <PhotoPostComposer onPosted={refreshFeed} />
          <Text style={styles.retentionHint}>
            Gönderiler 24 saat sonra silinir. En çok etkileşim alan gönderi Popüler'e girip kalıcı olur!
          </Text>
        </>
      )}
      {tab === 'populerGonderi' && (
        <View style={styles.popularInfoBanner}>
          <Ionicons name="flame" size={16} color="#EF4444" />
          <Text style={styles.popularInfoBannerText}>
            24 saatlik döngülerde en çok etkileşim alan efsane gönderiler kalıcı olur ve rastgele sıralanır.
          </Text>
        </View>
      )}
      {tab === 'durum' && (
        <>
          <TextStatusComposer onPosted={refreshFeed} />
          <Text style={styles.retentionHint}>
            Durumlar 24 saat sonra silinir. En çok sevilen durum Popüler'e girip kalıcı olur!
          </Text>
        </>
      )}
      {tab === 'populerDurum' && (
        <View style={styles.popularInfoBanner}>
          <MaterialCommunityIcons name="crown" size={16} color="#EF4444" />
          <Text style={styles.popularInfoBannerText}>
            24 saatlik döngülerde en çok etkileşim alan durumlar kalıcı olur ve rastgele sıralanır.
          </Text>
        </View>
      )}

      {loading && <ActivityIndicator color={tab.startsWith('populer') ? '#EF4444' : GOLD} style={{ marginTop: 30 }} />}
      {!loading && feedError && (isPhotoTab || tab === 'durum') && (
        <View style={styles.feedErrorWrap}>
          <Text style={styles.feedErrorText}>Akış yüklenemedi. İnternet bağlantını kontrol et.</Text>
          <Pressable onPress={refreshFeed} style={styles.feedRetryButton}>
            <Text style={styles.feedRetryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      )}
    </>
  );

  const listEmpty = loading || feedError ? null : (
    <View style={styles.emptyFeedWrap}>
      {tab === 'gonderi' && <Ionicons name="images-outline" size={44} color={GOLD_SOFT} />}
      {tab === 'populerGonderi' && <Ionicons name="flame-outline" size={44} color="#EF4444" />}
      {tab === 'durum' && <MaterialCommunityIcons name="chat-outline" size={44} color={GOLD_SOFT} />}
      {tab === 'populerDurum' && <MaterialCommunityIcons name="crown-outline" size={44} color="#EF4444" />}
      <Text style={[styles.emptyFeedTitle, tab.startsWith('populer') && { color: '#EF4444' }]}>
        {tab === 'gonderi' && 'Henüz fotoğraflı gönderi yok'}
        {tab === 'populerGonderi' && 'Henüz popüler gönderi seçilmedi'}
        {tab === 'durum' && 'Henüz durum paylaşılmadı'}
        {tab === 'populerDurum' && 'Henüz popüler durum seçilmedi'}
      </Text>
      <Text style={styles.emptyFeedSubtitle}>
        {tab === 'gonderi' && 'İlk görseli yukarıdan sen paylaş!'}
        {tab === 'populerGonderi' && 'En yüksek etkileşimi toplayan gönderi burada kalıcı olur!'}
        {tab === 'durum' && 'Aklından geçenleri ilk sen paylaş!'}
        {tab === 'populerDurum' && 'En çok beğenilen durumlar burada ölümsüzleşir!'}
      </Text>
    </View>
  );

  return (
    <MysticTableBackground>
      <FlatList
        key={tab}
        data={currentList}
        keyExtractor={(post) => post.id}
        renderItem={({ item: post }) =>
          isPhotoTab ? (
            <PhotoPostCard
              post={post}
              isPopular={isPopularBadge(post)}
              onOpenLikeOptions={setSelectedPostForLikes}
              onDelete={handleDelete}
              onOpenComments={setCommentsPostId}
              onReport={handleReport}
              onPressAuthor={handlePressAuthor}
            />
          ) : (
            <TextStatusCard
              post={post}
              isPopular={isPopularBadge(post)}
              onOpenLikeOptions={setSelectedPostForLikes}
              onDelete={handleDelete}
              onOpenComments={setCommentsPostId}
              onReport={handleReport}
              onPressAuthor={handlePressAuthor}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} tintColor={GOLD} colors={[GOLD]} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        removeClippedSubviews
        windowSize={7}
        maxToRenderPerBatch={6}
        initialNumToRender={5}
      />

      {/* Beğeni Seçenekleri Modalı (Normal, Süper x3, Lüks x5) */}
      <LikeOptionsModal
        visible={!!selectedPostForLikes}
        post={selectedPostForLikes}
        onClose={() => setSelectedPostForLikes(null)}
        onNormalLike={handleNormalLike}
        onSuperLike={handleSuperLike}
        onLuxuryLike={handleLuxuryLike}
      />

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
  popularRoyalOuterBox: {
    borderColor: '#F59E0B',
    borderWidth: 2.5,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 10, 46, 0.98)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 12,
  },
  ornateCorner: {
    position: 'absolute',
    zIndex: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornateCornerTL: { top: 3, left: 3 },
  ornateCornerTR: { top: 3, right: 3 },
  ornateCornerBL: { bottom: 3, left: 3 },
  ornateCornerBR: { bottom: 3, right: 3 },
  popularRoyalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F59E0B',
  },
  royalCrownImage: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  royalCrownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  royalCrownPillText: {
    color: '#1a0d33',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  popularRoyalTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  royalHeader: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    paddingHorizontal: 14,
  },
  royalPhotoWrap: {
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  royalStatusTextBody: {
    color: '#FFF',
    fontSize: 15.5,
    fontWeight: '600',
    lineHeight: 23,
    paddingHorizontal: 4,
  },
  royalFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 7,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.35)',
  },
  royalFooterPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 36,
  },
  likeOptionsCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.98)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 18,
    gap: 10,
  },
  likeOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  likeOptionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
  },
  likeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 24, 70, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    padding: 12,
    gap: 12,
  },
  superLikeRow: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(30, 38, 80, 0.9)',
  },
  luxuryLikeRow: {
    borderColor: 'rgba(242, 200, 121, 0.5)',
    backgroundColor: 'rgba(48, 32, 85, 0.92)',
  },
  likeOptionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeOptionTextWrap: {
    flex: 1,
  },
  likeOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  likeOptionDesc: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  likeOptionPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeOptionFreeText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  likeOptionDiamondText: {
    fontSize: 12,
    fontWeight: '800',
  },
  likeOptionsCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  likeOptionsCloseText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
});
