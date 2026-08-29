import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { getVipTiers, subscribeVip, getMyVipSubscription, type VipTier, type VipSubscription } from '@/services/shop';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 3600 * 1000)));
}

export default function VipTiersScreen() {
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [subscription, setSubscription] = useState<VipSubscription>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getVipTiers(), getMyVipSubscription().catch(() => null)])
      .then(([t, sub]) => {
        setTiers(t);
        setSubscription(sub);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSubscribe = useCallback(
    async (tier: VipTier) => {
      setSubscribingId(tier.id);
      try {
        await subscribeVip(tier.id);
        showAlert('Aboneliğin başladı', `${tier.name} kademesine hoş geldin!`);
        load();
      } catch (err) {
        showAlert('Abone olunamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setSubscribingId(null);
      }
    },
    [load],
  );

  if (loading) {
    return (
      <MysticTableBackground>
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {subscription && (
          <View style={styles.currentCard}>
            <Ionicons name="star" size={18} color={GOLD} />
            <Text style={styles.currentText}>
              {subscription.tierName} — {daysUntil(subscription.expiresAt)} gün sonra yenilenir
            </Text>
          </View>
        )}

        {tiers.length === 0 ? (
          <Text style={styles.emptyText}>Henüz VIP kademesi tanımlanmadı.</Text>
        ) : (
          <View style={styles.list}>
            {tiers.map((tier) => {
              const isCurrent = subscription?.tierId === tier.id;
              return (
                <View key={tier.id} style={[styles.tierCard, isCurrent && styles.tierCardActive]}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>{tier.monthlyPriceCrystal} Kristal / ay</Text>
                  <View style={styles.perkList}>
                    {tier.perks.map((perk, i) => (
                      <View key={i} style={styles.perkRow}>
                        <Ionicons name="checkmark" size={14} color={GOLD} />
                        <Text style={styles.perkText}>{perk}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => handleSubscribe(tier)}
                    disabled={isCurrent || subscribingId === tier.id}
                    style={[styles.subscribeButton, isCurrent && styles.subscribeButtonActive]}
                  >
                    {subscribingId === tier.id ? (
                      <ActivityIndicator size="small" color="#1a0d33" />
                    ) : (
                      <Text style={[styles.subscribeButtonText, isCurrent && styles.subscribeButtonTextActive]}>
                        {isCurrent ? 'Aktif Kademen' : 'Abone Ol'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },
  emptyText: { fontSize: 12.5, color: TEXT_MUTED, textAlign: 'center', paddingVertical: 30 },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
    marginBottom: 18,
  },
  currentText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: TEXT_PRIMARY },
  list: { gap: 14 },
  tierCard: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  tierCardActive: { borderColor: GOLD },
  tierName: { fontSize: 15, fontWeight: '800', color: GOLD, marginBottom: 4 },
  tierPrice: { fontSize: 12.5, color: TEXT_MUTED, marginBottom: 10 },
  perkList: { gap: 6, marginBottom: 14 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perkText: { fontSize: 12.5, color: TEXT_PRIMARY },
  subscribeButton: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  subscribeButtonActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: GOLD_SOFT },
  subscribeButtonText: { fontSize: 13, fontWeight: '800', color: '#1a0d33' },
  subscribeButtonTextActive: { color: TEXT_MUTED },
});
