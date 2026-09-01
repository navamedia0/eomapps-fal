import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { showAlert } from '@/services/themedAlert';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getStoredSession, refreshSession, signInWithGoogle, signOut, type AuthUser } from '@/services/auth';
import { getUserProfile } from '@/services/socialProfile';
import AppleSignInButton from '@/components/AppleSignInButton';
import { GOLD, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

function AuthSection({ navigation }: { navigation: TabScreenProps['navigation'] }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
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
      <Pressable
        onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
        style={({ pressed }) => [styles.authCard, pressed && styles.cardPressed]}
      >
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.authAvatar} />
        ) : (
          <View style={[styles.authAvatar, styles.authAvatarFallback]}>
            <Ionicons name="person" size={24} color={GOLD} />
          </View>
        )}
        <View style={styles.authTextWrap}>
          <Text style={styles.authName} numberOfLines={1}>
            {user.displayName || 'Mistik Kullanıcı'}
          </Text>
          <Text style={styles.authSubtitle}>
            {stats ? `${stats.followerCount} Takipçi · ${stats.followingCount} Takip` : 'Profilini & Karakterini Gör →'}
          </Text>
        </View>

        <Pressable onPress={handleSignOut} style={styles.authLogoutBtn} hitSlop={10}>
          <Ionicons name="log-out-outline" size={20} color={TEXT_MUTED} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <View style={styles.guestContainer}>
      <Pressable
        onPress={handleSignIn}
        disabled={signingIn}
        style={({ pressed }) => [styles.authCard, styles.authSignInButton, pressed && styles.cardPressed]}
      >
        <FontAwesome name="google" size={18} color={GOLD} />
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

export default function ProfilScreen({ navigation }: Props) {
  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Profilim</Text>
        </View>

        {/* Giriş & Kullanıcı Kartı */}
        <AuthSection navigation={navigation} />

        {/* 1. GRUP: KARAKTER & SOSYAL VİTRİN (3'lü Grid) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>KARAKTER & SOSYAL</Text>
        </View>
        <View style={styles.tripleGrid}>
          {/* Karakterim */}
          <Pressable
            onPress={() => navigation.navigate('AvatarWardrobe')}
            style={({ pressed }) => [styles.tripleCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.tripleIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Ionicons name="shirt" size={20} color="#EC4899" />
            </View>
            <Text style={styles.tripleTitle}>Karakterim</Text>
            <Text style={styles.tripleSub}>Gardırop</Text>
          </Pressable>

          {/* Başarımlar */}
          <Pressable
            onPress={() => navigation.navigate('Achievements')}
            style={({ pressed }) => [styles.tripleCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.tripleIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.tripleTitle}>Başarımlar</Text>
            <Text style={styles.tripleSub}>Rozetler</Text>
          </Pressable>

          {/* Popülerlik */}
          <Pressable
            onPress={() => navigation.navigate('Popularity')}
            style={({ pressed }) => [styles.tripleCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.tripleIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="flame" size={20} color="#EF4444" />
            </View>
            <Text style={styles.tripleTitle}>Popülerlik</Text>
            <Text style={styles.tripleSub}>Sıralama</Text>
          </Pressable>
        </View>

        {/* 2. GRUP: MİSTİK DENEYİMLERİM (3'lü Grid) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>MİSTİK KAYITLARIM</Text>
        </View>
        <View style={styles.tripleGrid}>
          {/* Fal Geçmişim */}
          <Pressable
            onPress={() => navigation.navigate('History')}
            style={({ pressed }) => [styles.tripleCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.tripleIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="time" size={20} color="#38BDF8" />
            </View>
            <Text style={styles.tripleTitle}>Fal Geçmişi</Text>
            <Text style={styles.tripleSub}>Kayıtlarım</Text>
          </Pressable>

          {/* Favorilerim */}
          <Pressable
            onPress={() => navigation.navigate('Favorites')}
            style={({ pressed }) => [styles.tripleCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.tripleIconWrap, { backgroundColor: 'rgba(229, 169, 60, 0.15)' }]}>
              <Ionicons name="star" size={20} color={GOLD} />
            </View>
            <Text style={styles.tripleTitle}>Favorilerim</Text>
            <Text style={styles.tripleSub}>Kaydedilenler</Text>
          </Pressable>

          {/* Görevler */}
          <Pressable
            onPress={() => navigation.navigate('Tasks')}
            style={({ pressed }) => [styles.tripleCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.tripleIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="ribbon" size={20} color="#10B981" />
            </View>
            <Text style={styles.tripleTitle}>Görevler</Text>
            <Text style={styles.tripleSub}>Ödül Kazan</Text>
          </Pressable>
        </View>

        {/* 3. GRUP: KİŞİSELLEŞTİRME & REHBERLER (2'li Geniş Kart) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>REHBER & KİŞİSELLEŞTİRME</Text>
        </View>
        <View style={styles.dualGrid}>
          <Pressable
            onPress={() => navigation.navigate('ProfileChat')}
            style={({ pressed }) => [styles.dualCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.dualIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dualTitle}>Kendinden Bahset</Text>
              <Text style={styles.dualSub}>Kişisel fal yorumları için</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('BilgiKosesi')}
            style={({ pressed }) => [styles.dualCard, pressed && styles.cardPressed]}
          >
            <View style={[styles.dualIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="library" size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dualTitle}>Bilgi Köşesi</Text>
              <Text style={styles.dualSub}>Kart ve makale rehberi</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={GOLD} />
          </Pressable>
        </View>

        {/* 4. GRUP: HESAP AYARLARI */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>HESAP & AYARLAR</Text>
        </View>
        <View style={styles.settingsGroup}>
          <Pressable
            onPress={() => navigation.navigate('NotificationSettings')}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.cardPressed]}
          >
            <View style={styles.settingsIconWrap}>
              <Ionicons name="notifications-outline" size={18} color={GOLD} />
            </View>
            <Text style={styles.settingsRowTitle}>Bildirim Ayarları</Text>
            <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
          </Pressable>

          <View style={styles.settingsDivider} />

          <Pressable
            onPress={() => navigation.navigate('BlockedUsers')}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.cardPressed]}
          >
            <View style={styles.settingsIconWrap}>
              <Ionicons name="ban-outline" size={18} color={TEXT_MUTED} />
            </View>
            <Text style={styles.settingsRowTitle}>Engellenen Kullanıcılar</Text>
            <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
          </Pressable>
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  authCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 18,
  },
  authCardLoading: {
    justifyContent: 'center',
  },
  authAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  authAvatarFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authTextWrap: {
    flex: 1,
  },
  authName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  authSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  authLogoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  guestContainer: {
    marginBottom: 18,
    gap: 8,
  },
  authSignInButton: {
    justifyContent: 'center',
    marginBottom: 0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  authSignInText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  sectionHeaderRow: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
  },
  tripleGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tripleCard: {
    flex: 1,
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tripleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tripleSub: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginTop: 1,
    textAlign: 'center',
  },
  dualGrid: {
    gap: 8,
    marginBottom: 16,
  },
  dualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  dualIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dualSub: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  settingsGroup: {
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  settingsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 14,
  },
});
