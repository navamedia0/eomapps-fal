import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/services/themedAlert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import AvatarRenderer from '@/components/avatar/AvatarRenderer';
import AppleSignInButton from '@/components/AppleSignInButton';
import { getStoredSession, signInWithGoogle } from '@/services/auth';
import {
  getUserProfile,
  setAvatarGender,
  equipAvatarItem,
  type AvatarGender,
  type AvatarState,
} from '@/services/socialProfile';
import { getWallet, purchaseItem, type WalletBalances } from '@/services/shop';
import { GOLD, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AvatarWardrobe'>;

type CharacterSkin = {
  id: string | null;
  name: string;
  subtitle: string;
  rarity: 'Temel' | 'Efsanevi' | '3D Kozmik' | '3D Mistik';
  rarityColor: string;
  priceCrystal: number;
  owned: boolean;
  badge?: string;
};

const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: null,
    name: 'Klasik Mistik',
    subtitle: 'Temel Beden',
    rarity: 'Temel',
    rarityColor: '#9CA3AF',
    priceCrystal: 0,
    owned: true,
  },
  {
    id: 'skin_leonidas',
    name: 'Leonidas (Aslan)',
    subtitle: 'Ateş Zırhı',
    rarity: 'Efsanevi',
    rarityColor: GOLD,
    priceCrystal: 150,
    owned: true,
    badge: '👑 Popüler',
  },
  {
    id: 'skin_oracle',
    name: 'Kozmik Kahin',
    subtitle: '3D Galaktik Model',
    rarity: '3D Kozmik',
    rarityColor: '#C084FC',
    priceCrystal: 300,
    owned: false,
    badge: '✨ 3D',
  },
  {
    id: 'skin_moon_witch',
    name: 'Ay Büyücüsü',
    subtitle: '3D Gece Hakimi',
    rarity: '3D Mistik',
    rarityColor: '#38BDF8',
    priceCrystal: 250,
    owned: false,
    badge: '🌙 3D',
  },
  {
    id: 'skin_solar_knight',
    name: 'Güneş Şövalyesi',
    subtitle: '3D Altın Muhafız',
    rarity: '3D Kozmik',
    rarityColor: '#F59E0B',
    priceCrystal: 350,
    owned: false,
    badge: '☀️ 3D',
  },
];

export default function AvatarWardrobeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<AvatarGender | null>(null);
  const [equipped, setEquipped] = useState<AvatarState>({
    gender: null,
    skinItemId: null,
    hatItemId: null,
    capeItemId: null,
    outfitItemId: null,
    pantsItemId: null,
  });
  const [wallet, setWallet] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [genderBusy, setGenderBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getStoredSession()
      .then(async (session) => {
        if (!session) {
          setNeedsAuth(true);
          return;
        }
        setNeedsAuth(false);
        const [profile, userWallet] = await Promise.all([
          getUserProfile(session.user.id),
          getWallet().catch(() => null),
        ]);
        setGender(profile.avatar.gender || 'female');
        setEquipped(profile.avatar);
        setWallet(userWallet);
      })
      .catch((err) => {
        showAlert('Hata', err instanceof Error ? err.message : 'Yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGoogleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      load();
    } catch (err) {
      showAlert('Giriş yapılamadı', err instanceof Error ? err.message : 'Hata oluştu.');
    } finally {
      setSigningIn(false);
    }
  }, [load]);

  const handleSwitchGender = useCallback(
    async (g: AvatarGender) => {
      if (gender === g || genderBusy) return;
      setGenderBusy(true);
      try {
        await setAvatarGender(g);
        setGender(g);
      } catch (err) {
        showAlert('Hata', err instanceof Error ? err.message : 'Cinsiyet değiştirilemedi.');
      } finally {
        setGenderBusy(false);
      }
    },
    [gender, genderBusy],
  );

  const handleEquipSkin = useCallback(
    async (skin: CharacterSkin) => {
      const skinId = skin.id;
      setEquipped((prev) => ({ ...prev, skinItemId: skinId }));
      setBusyId(skinId ?? 'default');

      try {
        if (skinId && !skin.owned) {
          await purchaseItem(skinId);
        }
        await equipAvatarItem('skin', skinId);
      } catch (err) {
        console.warn('Skin equip error:', err);
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const currentSkinName =
    CHARACTER_SKINS.find((s) => s.id === equipped.skinItemId)?.name ||
    (gender === 'male' ? 'Klasik Mistik Erkek' : 'Klasik Mistik Kadın');

  return (
    <MysticTableBackground>
      {/* Üst Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.topBarTitle}>Karakter Podyumu</Text>
        <Pressable
          onPress={() => navigation.navigate('CoinShop')}
          style={styles.crystalPill}
          hitSlop={8}
        >
          <Ionicons name="diamond" size={13} color="#38BDF8" />
          <Text style={styles.crystalText}>{wallet?.crystal ?? 0}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : needsAuth ? (
        <View style={styles.authBox}>
          <Ionicons name="person-circle-outline" size={54} color={GOLD} />
          <Text style={styles.authTitle}>Karakterini Yönetmek İçin Giriş Yap</Text>
          <Text style={styles.authDesc}>
            3D Karakter görünümleri ve gardırobun doğrudan hesabına kaydedilir.
          </Text>
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            style={styles.googleBtn}
          >
            <FontAwesome name="google" size={18} color={GOLD} />
            <Text style={styles.googleBtnText}>
              {signingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
            </Text>
          </Pressable>
          <AppleSignInButton onSuccess={load} onError={(m) => showAlert('Giriş Yapılamadı', m)} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. BÜYÜK GÖRKEMLİ KARAKTER PODYUMU (Hero Showcase Stage) */}
          <View style={styles.heroPodiumStage}>
            {/* Arka Işık Halesi */}
            <View style={styles.auraGlow} />

            {/* Büyük 3D Karakter / Avatar */}
            <AvatarRenderer
              gender={gender}
              skinId={equipped.skinItemId}
              hatItemId={equipped.hatItemId}
              capeItemId={equipped.capeItemId}
              outfitItemId={equipped.outfitItemId}
              pantsItemId={equipped.pantsItemId}
              size={270}
            />

            {/* Podyum Platformu */}
            <View style={styles.pedestalBase}>
              <View style={styles.pedestalTop} />
            </View>

            {/* Karakter İsim & Rozet Şeridi */}
            <View style={styles.characterBadgeCard}>
              <Text style={styles.characterBadgeName}>{currentSkinName}</Text>
              <Text style={styles.characterBadgeSub}>Mevcut Seçili Görünüm</Text>
            </View>
          </View>

          {/* 2. CİNSİYET & TEMEL TÜR SEÇİCİ */}
          <View style={styles.genderSwitchRow}>
            <Pressable
              onPress={() => handleSwitchGender('female')}
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
            >
              <Text style={[styles.genderBtnText, gender === 'female' && styles.genderBtnTextActive]}>
                🧙‍♀️ Kadın Karakter
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSwitchGender('male')}
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
            >
              <Text style={[styles.genderBtnText, gender === 'male' && styles.genderBtnTextActive]}>
                🧙‍♂️ Erkek Karakter
              </Text>
            </Pressable>
          </View>

          {/* 3. GÖRSELLİ 2'Lİ KARAKTER IZGARASI (Visual Character Grid) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>👑 KARAKTER & 3D GÖRÜNÜM IZGARASI</Text>
            <Text style={styles.sectionSub}>Görünüm seç, kuşan veya koleksiyonuna ekle</Text>
          </View>

          <View style={styles.characterGrid}>
            {CHARACTER_SKINS.map((skin) => {
              const isEquipped = equipped.skinItemId === skin.id;
              const isBusy = busyId === (skin.id ?? 'default');

              return (
                <Pressable
                  key={skin.id ?? 'default'}
                  onPress={() => handleEquipSkin(skin)}
                  style={({ pressed }) => [
                    styles.gridCard,
                    isEquipped && styles.gridCardEquipped,
                    pressed && styles.cardPressed,
                  ]}
                >
                  {/* Üst Rozet */}
                  {isEquipped ? (
                    <View style={styles.equippedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#000000" />
                      <Text style={styles.equippedBadgeText}>SEÇİLİ</Text>
                    </View>
                  ) : skin.badge ? (
                    <View style={[styles.gridBadge, { backgroundColor: skin.rarityColor }]}>
                      <Text style={styles.gridBadgeText}>{skin.badge}</Text>
                    </View>
                  ) : null}

                  {/* Görsel Sahnesi (Mini Avatar Önizlemesi) */}
                  <View style={styles.gridAvatarStage}>
                    <View style={styles.gridMiniAura} />
                    <AvatarRenderer
                      gender={gender}
                      skinId={skin.id}
                      hatItemId={skin.id ? null : equipped.hatItemId}
                      capeItemId={skin.id ? null : equipped.capeItemId}
                      outfitItemId={skin.id ? null : equipped.outfitItemId}
                      pantsItemId={skin.id ? null : equipped.pantsItemId}
                      size={105}
                      animated={false}
                    />
                    <View style={styles.gridMiniPedestal} />
                  </View>

                  {/* Başlık & Bilgi */}
                  <Text style={styles.gridCardName} numberOfLines={1}>
                    {skin.name}
                  </Text>
                  <Text style={styles.gridCardSub} numberOfLines={1}>
                    {skin.subtitle}
                  </Text>

                  {/* Alt Aksiyon / Durum Çubuğu */}
                  <View
                    style={[
                      styles.gridActionPill,
                      isEquipped && styles.gridActionPillEquipped,
                      !isEquipped && !skin.owned && skin.priceCrystal > 0 && styles.gridActionPillBuy,
                    ]}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : isEquipped ? (
                      <Text style={styles.gridActionTextEquipped}>Kuşanıldı</Text>
                    ) : skin.owned || skin.priceCrystal === 0 ? (
                      <Text style={styles.gridActionText}>Kuşan</Text>
                    ) : (
                      <View style={styles.priceRow}>
                        <Ionicons name="diamond" size={12} color="#38BDF8" />
                        <Text style={styles.priceText}>{skin.priceCrystal} Kristal</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  crystalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  crystalText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 48,
  },
  heroPodiumStage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F12',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  auraGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(229, 169, 60, 0.08)',
    top: 30,
  },
  pedestalBase: {
    width: 170,
    height: 22,
    backgroundColor: '#18181D',
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 169, 60, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  pedestalTop: {
    width: 140,
    height: 10,
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderRadius: 70,
  },
  characterBadgeCard: {
    marginTop: 12,
    alignItems: 'center',
  },
  characterBadgeName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  characterBadgeSub: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '700',
  },
  genderSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
  },
  genderBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  genderBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionHeaderRow: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.3%',
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridCardEquipped: {
    borderColor: GOLD,
    backgroundColor: '#16161C',
  },
  equippedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#22C55E',
    borderBottomLeftRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
  },
  equippedBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#000000',
  },
  gridBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    zIndex: 10,
  },
  gridBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#000000',
  },
  gridAvatarStage: {
    width: '100%',
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 4,
    marginBottom: 6,
  },
  gridMiniAura: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 169, 60, 0.08)',
    top: 15,
  },
  gridMiniPedestal: {
    width: 75,
    height: 10,
    backgroundColor: '#18181D',
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    marginTop: -8,
  },
  gridCardName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: 10,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 10,
  },
  gridActionPill: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridActionPillEquipped: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  gridActionPillBuy: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  gridActionText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#000000',
  },
  gridActionTextEquipped: {
    fontSize: 11,
    fontWeight: '900',
    color: '#22C55E',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#38BDF8',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  authBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  authTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  authDesc: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  googleBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
