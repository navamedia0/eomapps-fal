import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import { showAlert } from '@/services/themedAlert';
import { getStoredSession, signInWithGoogle } from '@/services/auth';
import AppleSignInButton from '@/components/AppleSignInButton';
import { getGarden, getGardenSeeds, plantSeed, harvestSlot, type GardenState, type GardenSeed, type GardenSlot } from '@/services/garden';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const REFRESH_INTERVAL_MS = 20000;
const CURRENCY_LABEL: Record<'coin' | 'crystal', string> = { coin: 'Coin', crystal: 'Kristal' };

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Hazır';
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin} dk`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hours} sa ${mins} dk`;
}

function Slot({ slot, onPress }: { slot: GardenSlot; onPress: () => void }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (slot.empty || slot.ready) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [slot]);

  if (slot.empty) {
    return (
      <Pressable onPress={onPress} style={styles.slot}>
        <View style={styles.slotEmpty}>
          <Ionicons name="add" size={22} color={TEXT_MUTED} />
        </View>
        <Text style={styles.slotLabel}>Boş arsa</Text>
      </Pressable>
    );
  }

  const remaining = new Date(slot.readyAt).getTime() - Date.now();
  const ready = remaining <= 0;

  return (
    <Pressable onPress={onPress} style={styles.slot}>
      <View style={[styles.slotFilled, ready && styles.slotReady]}>
        <MaterialCommunityIcons name={ready ? 'flower' : 'sprout'} size={26} color={ready ? '#1a0d33' : GOLD} />
      </View>
      <Text style={[styles.slotLabel, ready && styles.slotLabelReady]} numberOfLines={1}>
        {ready ? 'Hasat zamanı!' : formatRemaining(remaining)}
      </Text>
    </Pressable>
  );
}

function SeedPickerModal({
  visible,
  seeds,
  onPick,
  onClose,
}: {
  visible: boolean;
  seeds: GardenSeed[];
  onPick: (seed: GardenSeed) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Bir Tohum Seç</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {seeds.map((seed) => (
              <Pressable key={seed.id} onPress={() => onPick(seed)} style={styles.seedRow}>
                <MaterialCommunityIcons name="seed-outline" size={22} color={GOLD} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.seedName}>{seed.name}</Text>
                  <Text style={styles.seedMeta}>
                    {seed.growMinutes} dk büyür · {seed.yieldCoin} Coin verir
                  </Text>
                </View>
                <Text style={styles.seedPrice}>
                  {seed.price} {CURRENCY_LABEL[seed.currency]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function GardenScreen() {
  const [garden, setGarden] = useState<GardenState | null>(null);
  const [seeds, setSeeds] = useState<GardenSeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    getStoredSession().then((session) => {
      setSignedIn(!!session);
      if (!session) {
        if (!silent) setLoading(false);
        return;
      }
      Promise.all([getGarden(), getGardenSeeds()])
        .then(([g, s]) => {
          setGarden(g);
          setSeeds(s);
          setError(false);
        })
        .catch(() => {
          if (!silent) setError(true);
        })
        .finally(() => {
          if (!silent) setLoading(false);
        });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      pollRef.current = setInterval(() => load(true), REFRESH_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load]),
  );

  const handleSignIn = useCallback(async () => {
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

  const handleSlotPress = useCallback(
    (slot: GardenSlot) => {
      if (slot.empty) {
        setPickerSlot(slot.index);
        return;
      }
      if (!slot.ready) {
        showAlert(slot.seedName, `${formatRemaining(new Date(slot.readyAt).getTime() - Date.now())} sonra hazır olacak.`);
        return;
      }
      showAlert('Hasat et', `${slot.seedName} hazır — hasat etmek istiyor musun?`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hasat Et',
          onPress: async () => {
            try {
              const { yieldCoin } = await harvestSlot(slot.index);
              showAlert('Hasat edildi', `+${yieldCoin} Coin kazandın!`);
              load(true);
            } catch (err) {
              showAlert('Olmadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
            }
          },
        },
      ]);
    },
    [load],
  );

  const handlePickSeed = useCallback(
    async (seed: GardenSeed) => {
      if (pickerSlot === null || busy) return;
      setBusy(true);
      try {
        await plantSeed(pickerSlot, seed.id);
        setPickerSlot(null);
        load(true);
      } catch (err) {
        showAlert('Ekilemedi', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setBusy(false);
      }
    },
    [pickerSlot, busy, load],
  );

  if (loading) {
    return (
      <MysticTableBackground>
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      </MysticTableBackground>
    );
  }

  if (signedIn === false) {
    return (
      <MysticTableBackground>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Bahçen için giriş yapman gerekiyor.</Text>
          <Pressable
            onPress={handleSignIn}
            disabled={signingIn}
            style={({ pressed }) => [styles.signInCard, pressed && { opacity: 0.85 }]}
          >
            <FontAwesome name="google" size={20} color={GOLD} />
            <Text style={styles.signInText}>{signingIn ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</Text>
            {signingIn && <ActivityIndicator color={GOLD} style={{ marginLeft: 6 }} />}
          </Pressable>
          <AppleSignInButton onSuccess={load} onError={(message) => showAlert('Giriş yapılamadı', message)} />
        </View>
      </MysticTableBackground>
    );
  }

  if (error || !garden) {
    return (
      <MysticTableBackground>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>Bahçe yüklenemedi.</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moonCard}>
          <CornerTicks />
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={GOLD} style={{ marginBottom: 6 }} />
          <Text style={styles.moonLabel}>{garden.moon.label}</Text>
          <Text style={styles.moonHint}>
            Yeni ayda ekim daha hızlı büyür, dolunayda hasat daha verimli — şu an aydınlanma %
            {Math.round(garden.moon.illumination * 100)}.
          </Text>
        </View>

        <View style={styles.grid}>
          {garden.slots.map((slot) => (
            <Slot key={slot.index} slot={slot} onPress={() => handleSlotPress(slot)} />
          ))}
        </View>
      </ScrollView>

      <SeedPickerModal
        visible={pickerSlot !== null}
        seeds={seeds}
        onPick={handlePickSeed}
        onClose={() => setPickerSlot(null)}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20 },
  errorText: { fontSize: 13.5, color: TEXT_MUTED, textAlign: 'center' },
  retryButton: { borderWidth: 1, borderColor: GOLD_SOFT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 18 },
  retryText: { fontSize: 12.5, fontWeight: '700', color: GOLD },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 16,
    width: '100%',
  },
  signInText: { fontSize: 13.5, fontWeight: '700', color: GOLD },
  moonCard: {
    position: 'relative',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
    marginBottom: 22,
  },
  moonLabel: { fontSize: 15, fontWeight: '800', color: GOLD, marginBottom: 6 },
  moonHint: { fontSize: 11.5, lineHeight: 17, color: TEXT_PRIMARY, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  slot: { width: 90, alignItems: 'center' },
  slotEmpty: {
    width: 66,
    height: 66,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  slotFilled: {
    width: 66,
    height: 66,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  slotReady: { backgroundColor: GOLD, borderColor: GOLD },
  slotLabel: { fontSize: 11, color: TEXT_MUTED, textAlign: 'center' },
  slotLabelReady: { color: GOLD, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(7, 4, 18, 0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: NIGHT_MID,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: GOLD_SOFT, marginBottom: 10 },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: GOLD, marginBottom: 14, textAlign: 'center' },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(242, 200, 121, 0.1)',
  },
  seedName: { fontSize: 13.5, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 2 },
  seedMeta: { fontSize: 11, color: TEXT_MUTED },
  seedPrice: { fontSize: 12.5, fontWeight: '700', color: GOLD },
});
