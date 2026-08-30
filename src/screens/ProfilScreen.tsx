import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { showAlert } from '@/services/themedAlert';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS, NAV_ICONS } from '@/assets/icons';
import { getStoredSession, refreshSession, signInWithGoogle, signOut, type AuthUser } from '@/services/auth';
import { getUserProfile } from '@/services/socialProfile';
import { getFeed, deletePost, type KesfetFeedPost } from '@/services/kesfetPosts';
import CommentsModal from '@/components/CommentsModal';
import { relativeTime } from '@/utils/relativeTime';
import AppleSignInButton from '@/components/AppleSignInButton';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

const SOCIAL_ACCOUNTS = [
  { key: 'facebook', name: 'Facebook', icon: <FontAwesome name="facebook" size={18} color={GOLD} /> },
  { key: 'instagram', name: 'Instagram', icon: <FontAwesome name="instagram" size={18} color={GOLD} /> },
  { key: 'whatsapp', name: 'WhatsApp', icon: <FontAwesome name="whatsapp" size={18} color={GOLD} /> },
];

function AuthSection() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = henüz yüklenmedi
  const [signingIn, setSigningIn] = useState(false);
  const [stats, setStats] = useState<{ followerCount: number; followingCount: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getStoredSession().then((session) => {
        if (active) setUser(session?.user ?? null);
      });
      refreshSession().then((freshUser) => {
        if (active) setUser(freshUser);
        if (active && freshUser) {
          getUserProfile(freshUser.id)
            .then((profile) => {
              if (active) setStats({ followerCount: profile.followerCount, followingCount: profile.followingCount });
            })
            .catch(() => {});
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      const signedInUser = await signInWithGoogle();
      setUser(signedInUser);
    } catch (err) {
      showAlert('Giriş yapılamadı', err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setSigningIn(false);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    showAlert('Çıkış yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setUser(null);
          setStats(null);
        },
      },
    ]);
  }, []);

  if (user === undefined) {
    return (
      <View style={[styles.authCard, styles.authCardLoading]}>
        <ActivityIndicator color={GOLD} />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.authCard}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.authAvatar} cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.authAvatar, styles.authAvatarFallback]}>
            <Ionicons name="person" size={22} color={GOLD} />
          </View>
        )}
        <View style={styles.authTextWrap}>
          <Text style={styles.authName}>{user.displayName || 'Mistik Rehber Kullanıcısı'}</Text>
          {stats ? (
            <Text style={styles.authSubtitle}>
              {stats.followerCount} takipçi · {stats.followingCount} takip
            </Text>
          ) : (
            <Text style={styles.authSubtitle}>Google ile giriş yapıldı</Text>
          )}
        </View>
        <Pressable onPress={handleSignOut} hitSlop={10}>
          <Ionicons name="log-out-outline" size={22} color={TEXT_MUTED} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 20 }}>
      <Pressable
        onPress={handleSignIn}
        disabled={signingIn}
        style={({ pressed }) => [styles.authCard, styles.authSignInButton, { marginBottom: 0 }, pressed && styles.cardPressed]}
      >
        <FontAwesome name="google" size={20} color={GOLD} />
        <Text style={styles.authSignInText}>{signingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</Text>
        {signingIn && <ActivityIndicator color={GOLD} style={{ marginLeft: 6 }} />}
      </Pressable>
      <AppleSignInButton
        onSuccess={() => getStoredSession().then((session) => setUser(session?.user ?? null))}
        onError={(message) => showAlert('Giriş yapılamadı', message)}
      />
    </View>
  );
}

function MyPostsSection() {
  const [posts, setPosts] = useState<KesfetFeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const session = await getStoredSession();
    if (!session) {
      setUser(null);
      setPosts([]);
      return;
    }
    setUser(session.user);
    setLoading(true);
    try {
      const feed = await getFeed();
      setPosts(feed.filter((p) => p.isMe));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts]),
  );

  const handleDelete = useCallback(
    (id: string) => {
      showAlert('Gönderiyi Sil', 'Bu paylaşımını silmek istediğine emin misin?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setPosts((prev) => prev.filter((p) => p.id !== id));
            try {
              await deletePost(id);
              loadPosts();
            } catch (err) {
              showAlert('Silinemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
            }
          },
        },
      ]);
    },
    [loadPosts],
  );

  if (!user) return null;

  return (
    <View style={styles.myPostsContainer}>
      <View style={styles.myPostsHeader}>
        <View style={styles.myPostsTitleWrap}>
          <Ionicons name="newspaper-outline" size={18} color={GOLD} />
          <Text style={styles.myPostsTitle}>Paylaşılanlar ({posts.length})</Text>
        </View>
        <Text style={styles.myPostsSubtitle}>24 saat sonra otomatik silinir</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={GOLD} style={{ marginVertical: 14 }} />
      ) : posts.length === 0 ? (
        <View style={styles.myPostsEmptyBox}>
          <Text style={styles.myPostsEmptyText}>Henüz bir paylaşımın yok.</Text>
          <Text style={styles.myPostsEmptySubtext}>Keşfet sekmesinden fotoğraf veya durum paylaşabilirsin.</Text>
        </View>
      ) : (
        <View style={styles.myPostsList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.myPostCard}>
              {post.imageUri ? (
                <Image source={{ uri: post.imageUri }} style={styles.myPostThumb} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={styles.myPostTextIconWrap}>
                  <Ionicons name="chatbox-ellipses-outline" size={20} color={GOLD} />
                </View>
              )}
              <View style={styles.myPostContentWrap}>
                <Text style={styles.myPostText} numberOfLines={2}>
                  {post.text || (post.imageUri ? 'Fotoğraflı Gönderi' : 'Durum')}
                </Text>
                <View style={styles.myPostMetaRow}>
                  <Text style={styles.myPostTime}>{relativeTime(post.createdAt)}</Text>
                  <View style={styles.myPostStatsRow}>
                    <View style={styles.myPostStatItem}>
                      <Ionicons name="heart" size={12} color="#EF4444" />
                      <Text style={styles.myPostStatText}>{post.likeCount}</Text>
                    </View>
                    <Pressable onPress={() => setCommentsPostId(post.id)} style={styles.myPostStatItem} hitSlop={4}>
                      <Ionicons name="chatbubble" size={12} color={GOLD} />
                      <Text style={styles.myPostStatText}>{post.commentCount}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              <Pressable onPress={() => handleDelete(post.id)} style={styles.myPostDeleteBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={TEXT_MUTED} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <CommentsModal
        postId={commentsPostId}
        onClose={() => {
          setCommentsPostId(null);
          loadPosts();
        }}
        onPressAuthor={() => {}}
      />
    </View>
  );
}

export default function ProfilScreen({ navigation }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        <AuthSection />
        <MyPostsSection />

        <View style={styles.list}>
          <Pressable
            onPress={() => navigation.navigate('ProfileChat')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon
              source={FEATURE_ICONS.profileChat}
              fallback={<Ionicons name="chatbubble-ellipses-outline" size={22} color={GOLD} />}
              size={74}
            />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Kendinden Bahset</Text>
              <Text style={styles.cardSubtitle}>Seni tanıyalım, daha kişisel yorumlar sunalım</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Tasks')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon source={FEATURE_ICONS.tasks} fallback={<Ionicons name="ribbon-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Görevler</Text>
              <Text style={styles.cardSubtitle}>Video izleyerek bonus kredi kazan</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Favorites')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon source={FEATURE_ICONS.favorites} fallback={<Ionicons name="star-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Favorilerim</Text>
              <Text style={styles.cardSubtitle}>Kaydettiğin sözler ve bilgi kartları</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('History')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon source={FEATURE_ICONS.history} fallback={<Ionicons name="time-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Geçmiş</Text>
              <Text style={styles.cardSubtitle}>Baktırdığın falların geçmişi (cihazında saklanır)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('BilgiKosesi')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon
              source={NAV_ICONS.BilgiKosesi}
              fallback={<Ionicons name="library-outline" size={22} color={GOLD} />}
              size={74}
            />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Bilgi Köşesi</Text>
              <Text style={styles.cardSubtitle}>Kart anlamları, mistik makaleler ve daha fazlası</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('NotificationSettings')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon
              source={FEATURE_ICONS.notificationSettings}
              fallback={<Ionicons name="notifications-outline" size={22} color={GOLD} />}
              size={74}
            />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Bildirim Ayarları</Text>
              <Text style={styles.cardSubtitle}>Günlük hatırlatmaları yönet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Achievements')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon fallback={<Ionicons name="trophy-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Başarımlar</Text>
              <Text style={styles.cardSubtitle}>Kademeli rozetler ve ilerlemeni gör</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Popularity')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon fallback={<Ionicons name="flame-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Haftalık Popülerlik</Text>
              <Text style={styles.cardSubtitle}>Bu haftanın liderlik tablosu</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('BlockedUsers')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon fallback={<Ionicons name="ban-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Engellenen Kullanıcılar</Text>
              <Text style={styles.cardSubtitle}>Engellediklerini gör, istersen engeli kaldır</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Bağlı Hesaplar</Text>
        <Text style={styles.sectionHint}>
          Bu özellik yakında aktif olacak — hesap bağlama şu an sadece önizleme amaçlı gösteriliyor.
        </Text>
        <View style={styles.socialList}>
          {SOCIAL_ACCOUNTS.map((account) => (
            <View key={account.key} style={styles.socialRow}>
              <View style={styles.socialIconWrap}>{account.icon}</View>
              <Text style={styles.socialName}>{account.name}</Text>
              <Pressable
                onPress={() => setNotice(`${account.name} hesabı bağlama özelliği yakında aktif olacak.`)}
                style={styles.socialConnectButton}
              >
                <Text style={styles.socialConnectButtonText}>Bağla</Text>
              </Pressable>
            </View>
          ))}
        </View>
        {notice && <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  authCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 20,
  },
  authCardLoading: {
    justifyContent: 'center',
  },
  authAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authAvatarFallback: {
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTextWrap: {
    flex: 1,
  },
  authName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  authSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  authSignInButton: {
    justifyContent: 'center',
    borderColor: GOLD,
  },
  authSignInText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  list: {
    gap: 14,
    marginBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
    marginBottom: 14,
  },
  socialList: {
    gap: 10,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  socialIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  socialConnectButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  socialConnectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
  },
  notice: {
    fontSize: 11.5,
    color: GOLD,
    textAlign: 'center',
    marginTop: 12,
  },
  myPostsContainer: {
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    padding: 16,
    marginBottom: 20,
  },
  myPostsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  myPostsTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myPostsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
  },
  myPostsSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  myPostsEmptyBox: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  myPostsEmptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  myPostsEmptySubtext: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  myPostsList: {
    gap: 10,
  },
  myPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 24, 70, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    padding: 10,
    gap: 10,
  },
  myPostThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  myPostTextIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myPostContentWrap: {
    flex: 1,
  },
  myPostText: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  myPostMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myPostTime: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  myPostStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  myPostStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  myPostStatText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '700',
  },
  myPostDeleteBtn: {
    padding: 6,
  },
});
