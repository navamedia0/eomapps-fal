import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '@/services/themedAlert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import AvatarRenderer from '@/components/avatar/AvatarRenderer';
import AppleSignInButton from '@/components/AppleSignInButton';
import { getStoredSession, signInWithGoogle } from '@/services/auth';
import { getUserProfile, setAvatarGender, equipAvatarItem, type AvatarGender, type AvatarSlot, type AvatarState } from '@/services/socialProfile';
import { getShopItems, purchaseItem, type ShopItem } from '@/services/shop';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, NIGHT_CARD, VELVET_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AvatarWardrobe'>;

const SLOTS: { key: AvatarSlot; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'hat', label: 'Şapka', icon: 'sparkles-outline' },
  { key: 'cape', label: 'Pelerin', icon: 'body-outline' },
  { key: 'outfit', label: 'Kıyafet', icon: 'shirt-outline' },
  { key: 'pants', label: 'Pantolon', icon: 'walk-outline' },
];

const SLOT_FIELD: Record<AvatarSlot, keyof AvatarState> = {
  hat: 'hatItemId',
  cape: 'capeItemId',
  outfit: 'outfitItemId',
  pants: 'pantsItemId',
};

const CURRENCY_LABEL: Record<'coin' | 'crystal', string> = { coin: 'Coin', crystal: 'Kristal' };

export default function AvatarWardrobeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [meId, setMeId] = useState<string | null>(null);
  const [gender, setGender] = useState<AvatarGender | null>(null);
  const [equipped, setEquipped] = useState<AvatarState>({
    gender: null,
    hatItemId: null,
    capeItemId: null,
    outfitItemId: null,
    pantsItemId: null,
  });
  const [activeSlot, setActiveSlot] = useState<AvatarSlot>('hat');
  const [itemsBySlot, setItemsBySlot] = useState<Record<AvatarSlot, ShopItem[]>>({
    hat: [],
    cape: [],
    outfit: [],
    pants: [],
  });
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
        setMeId(session.user.id);
        const [profile, hat, cape, outfit, pants] = await Promise.all([
          getUserProfile(session.user.id),
          getShopItems('avatar_hat'),
          getShopItems('avatar_cape'),
          getShopItems('avatar_outfit'),
          getShopItems('avatar_pants'),
        ]);
        setGender(profile.avatar.gender);
        setEquipped(profile.avatar);
        setItemsBySlot({ hat, cape, outfit, pants });
      })
      .catch((err) => {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
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
      showAlert('Giriş yapılamadı', err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setSigningIn(false);
    }
  }, [load]);

  const handlePickGender = useCallback(
    async (g: AvatarGender) => {
      setGenderBusy(true);
      try {
        await setAvatarGender(g);
        setGender(g);
      } catch (err) {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setGenderBusy(false);
      }
    },
    [],
  );

  const currentItems = itemsBySlot[activeSlot];
  const equippedIdForSlot = equipped[SLOT_FIELD[activeSlot]] as string | null;

  const handleTapItem = useCallback(
    async (item: ShopItem | null) => {
      const itemId = item?.id ?? null;
      const busyKey = itemId ?? `${activeSlot}-none`;
      setBusyId(busyKey);
      try {
        if (item && !item.owned) {
          await purchaseItem(item.id);
          setItemsBySlot((prev) => ({
            ...prev,
            [activeSlot]: prev[activeSlot].map((i) => (i.id === item.id ? { ...i, owned: true } : i)),
          }));
        }
        await equipAvatarItem(activeSlot, itemId);
        setEquipped((prev) => ({ ...prev, [SLOT_FIELD[activeSlot]]: itemId }));
      } catch (err) {
        showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setBusyId(null);
      }
    },
    [activeSlot],
  );

  const cards = useMemo(() => [{ isNone: true, item: null as ShopItem | null }, ...currentItems.map((item) => ({ isNone: false, item }))], [
    currentItems,
  ]);

  return (
    <MysticTableBackground>
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={GOLD} />
        </Pressable>
        <Text style={styles.topBarTitle}>Karakterim</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      ) : needsAuth ? (
        <View style={styles.genderPrompt}>
          <Ionicons name="sparkles-outline" size={36} color={GOLD} style={{ marginBottom: 4 }} />
          <Text style={styles.genderTitle}>Karakterini oluşturmak için giriş yap</Text>
          <Text style={styles.genderHint}>
            Karakter, seviye ve profil bilgilerin hesabına bağlı kaydediliyor — Google veya Apple ile giriş yapman yeterli.
          </Text>
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={signingIn}
            style={[styles.googleButton, signingIn && styles.cardDisabled]}
          >
            <FontAwesome name="google" size={18} color={GOLD} />
            <Text style={styles.googleButtonText}>{signingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</Text>
            {signingIn && <ActivityIndicator color={GOLD} style={{ marginLeft: 6 }} />}
          </Pressable>
          <View style={{ width: '100%', maxWidth: 280 }}>
            <AppleSignInButton onSuccess={load} onError={(message) => showAlert('Giriş yapılamadı', message)} />
          </View>
        </View>
      ) : !gender ? (
        <View style={styles.genderPrompt}>
          <Text style={styles.genderTitle}>Karakterini seç</Text>
          <Text style={styles.genderHint}>Bu seçimi istediğin zaman ayarlardan değiştirebilirsin.</Text>
          <View style={styles.genderRow}>
            <Pressable
              onPress={() => handlePickGender('female')}
              disabled={genderBusy}
              style={[styles.genderCard, genderBusy && styles.cardDisabled]}
            >
              <AvatarRenderer gender="female" size={110} />
              <Text style={styles.genderCardText}>Kadın</Text>
            </Pressable>
            <Pressable
              onPress={() => handlePickGender('male')}
              disabled={genderBusy}
              style={[styles.genderCard, genderBusy && styles.cardDisabled]}
            >
              <AvatarRenderer gender="male" size={110} />
              <Text style={styles.genderCardText}>Erkek</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stage}>
            <AvatarRenderer
              gender={gender}
              hatItemId={equipped.hatItemId}
              capeItemId={equipped.capeItemId}
              outfitItemId={equipped.outfitItemId}
              pantsItemId={equipped.pantsItemId}
              size={190}
            />
          </View>

          <View style={styles.slotTabRow}>
            {SLOTS.map((slot) => {
              const active = activeSlot === slot.key;
              return (
                <Pressable
                  key={slot.key}
                  onPress={() => setActiveSlot(slot.key)}
                  style={[styles.slotTab, active && styles.slotTabActive]}
                >
                  <Ionicons name={slot.icon} size={19} color={active ? NIGHT_DEEP : GOLD} />
                  <Text style={[styles.slotTabText, active && styles.slotTabTextActive]}>{slot.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.grid}>
            {cards.map(({ isNone, item }) => {
              const key = item?.id ?? 'none';
              const isEquipped = isNone ? equippedIdForSlot === null : equippedIdForSlot === item?.id;
              const isBusy = busyId === (item?.id ?? `${activeSlot}-none`);
              return (
                <Pressable
                  key={key}
                  onPress={() => handleTapItem(item)}
                  disabled={isBusy}
                  style={[styles.card, isEquipped && styles.cardEquipped, isBusy && styles.cardDisabled]}
                >
                  <View style={styles.cardSwatch}>
                    <Ionicons name={isNone ? 'close-outline' : 'sparkles'} size={26} color={GOLD} />
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {isNone ? 'Yok' : item?.name}
                  </Text>
                  {!isNone && item && !item.owned && (
                    <Text style={styles.cardPrice}>
                      {item.price} {CURRENCY_LABEL[item.currency]}
                    </Text>
                  )}
                  {isBusy ? (
                    <ActivityIndicator size="small" color={GOLD} style={styles.cardStateIcon} />
                  ) : isEquipped ? (
                    <Ionicons name="checkmark-circle" size={18} color={GOLD} style={styles.cardStateIcon} />
                  ) : !isNone && item && !item.owned ? (
                    <Ionicons name="lock-closed-outline" size={16} color={TEXT_MUTED} style={styles.cardStateIcon} />
                  ) : null}
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: TEXT_PRIMARY },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48 },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VELVET_MID,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 26,
    marginBottom: 18,
  },
  slotTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  slotTab: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
  },
  slotTabActive: { backgroundColor: GOLD, borderColor: GOLD },
  slotTabText: { fontSize: 10.5, fontWeight: '700', color: TEXT_MUTED },
  slotTabTextActive: { color: NIGHT_DEEP },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '31%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  cardEquipped: { borderColor: GOLD, borderWidth: 2 },
  cardDisabled: { opacity: 0.6 },
  cardSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontSize: 11, fontWeight: '700', color: TEXT_PRIMARY, textAlign: 'center' },
  cardPrice: { fontSize: 10, color: GOLD, fontWeight: '700' },
  cardStateIcon: { marginTop: 2 },
  genderPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  genderTitle: { fontSize: 18, fontWeight: '800', color: TEXT_PRIMARY },
  genderHint: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', marginBottom: 10 },
  genderRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  genderCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: NIGHT_CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  genderCardText: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 22,
    marginTop: 6,
    width: '100%',
    maxWidth: 280,
    justifyContent: 'center',
  },
  googleButtonText: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
});
