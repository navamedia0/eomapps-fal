import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS, NAV_ICONS } from '@/assets/icons';
import { getStoredSession, refreshSession, signInWithGoogle, signOut, type AuthUser } from '@/services/auth';
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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getStoredSession().then((session) => {
        if (active) setUser(session?.user ?? null);
      });
      refreshSession().then((freshUser) => {
        if (active) setUser(freshUser);
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
      Alert.alert('Giriş yapılamadı', err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setSigningIn(false);
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Çıkış yap', 'Hesabından çıkış yapmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          setUser(null);
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
          <Image source={{ uri: user.avatarUrl }} style={styles.authAvatar} />
        ) : (
          <View style={[styles.authAvatar, styles.authAvatarFallback]}>
            <Ionicons name="person" size={22} color={GOLD} />
          </View>
        )}
        <View style={styles.authTextWrap}>
          <Text style={styles.authName}>{user.displayName || 'Mistik Rehber Kullanıcısı'}</Text>
          <Text style={styles.authSubtitle}>Google ile giriş yapıldı</Text>
        </View>
        <Pressable onPress={handleSignOut} hitSlop={10}>
          <Ionicons name="log-out-outline" size={22} color={TEXT_MUTED} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleSignIn}
      disabled={signingIn}
      style={({ pressed }) => [styles.authCard, styles.authSignInButton, pressed && styles.cardPressed]}
    >
      <FontAwesome name="google" size={20} color={GOLD} />
      <Text style={styles.authSignInText}>{signingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</Text>
      {signingIn && <ActivityIndicator color={GOLD} style={{ marginLeft: 6 }} />}
    </Pressable>
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
});
