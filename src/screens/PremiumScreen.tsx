import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { getActivePlan, activatePlanMock, deactivatePlanMock } from '@/services/premium';
import { addCoins } from '@/services/coins';
import { COIN_PACKAGES } from '@/constants/coinPackages';
import { SUBSCRIPTION_PLANS, THEMED_FAL_PACKAGES, type SubscriptionPlan, type SubscriptionPeriod } from '@/constants/subscriptionPlans';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

const PERIOD_LABEL: Record<SubscriptionPeriod, string> = {
  haftalik: 'Haftalık Paketler',
  aylik: 'Aylık Paketler',
  yillik: 'Yıllık Paketler — bonus coin dahil',
};

const PERIOD_ORDER: SubscriptionPeriod[] = ['haftalik', 'aylik', 'yillik'];

function quotaLabel(plan: SubscriptionPlan): string {
  return plan.dailyQuota === null ? 'Sınırsız fal hakkı' : `Günlük ${plan.dailyQuota} fal hakkı`;
}

export default function PremiumScreen({ navigation }: Props) {
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null | undefined>(undefined);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getActivePlan().then(setActivePlan);
  }, []);

  useFocusEffect(refresh);

  const purchasePlan = useCallback(
    async (plan: SubscriptionPlan) => {
      await activatePlanMock(plan.id);
      setActivePlan(plan);
      setFeedback(`${plan.name} aktifleşti! ✨`);
      setTimeout(() => setFeedback(null), 2200);
    },
    [],
  );

  const deactivate = useCallback(async () => {
    await deactivatePlanMock();
    setActivePlan(null);
  }, []);

  const buyThemedPack = useCallback(async (coins: number, name: string) => {
    await addCoins(coins);
    setFeedback(`${name} satın alındı, +${coins} coin! ✨`);
    setTimeout(() => setFeedback(null), 2200);
  }, []);

  if (activePlan === undefined) return <MysticTableBackground><View style={styles.flex} /></MysticTableBackground>;

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="star-outline" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Mistik Rehber Premium</Text>
          <Text style={styles.headerSubtitle}>Sana uygun paketle günlük fal hakkını artır</Text>
        </View>

        {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

        {activePlan && (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={22} color={GOLD} />
            <View style={styles.activeTextWrap}>
              <Text style={styles.activeTitle}>{activePlan.name} aktif</Text>
              <Text style={styles.activeSubtitle}>{quotaLabel(activePlan)}</Text>
            </View>
            <Pressable onPress={deactivate} style={styles.deactivateButton}>
              <Text style={styles.deactivateButtonText}>İptal Et</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionLabel}>Abonelikler</Text>
        {PERIOD_ORDER.map((period) => (
          <View key={period} style={styles.periodBlock}>
            <Text style={styles.periodLabel}>{PERIOD_LABEL[period]}</Text>
            <View style={styles.plansList}>
              {SUBSCRIPTION_PLANS.filter((plan) => plan.period === period).map((plan) => {
                const isActive = activePlan?.id === plan.id;
                return (
                  <View key={plan.id} style={[styles.planCard, isActive && styles.planCardActive]}>
                    {plan.badge && (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.badge}</Text>
                      </View>
                    )}
                    <Text style={styles.planTitle}>{plan.name}</Text>
                    <Text style={styles.planPrice}>{plan.priceTL}</Text>
                    <Text style={styles.planQuota}>{quotaLabel(plan)}</Text>
                    {plan.bonusCoins && <Text style={styles.planBonus}>+{plan.bonusCoins} bonus coin</Text>}
                    <Pressable
                      onPress={() => purchasePlan(plan)}
                      disabled={isActive}
                      style={[styles.planButton, isActive && styles.planButtonDisabled]}
                    >
                      <Text style={styles.planButtonText}>{isActive ? 'Aktif' : 'Satın Al'}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Text style={styles.sectionLabel}>Kahve & Tarot Fal Paketleri</Text>
        <Text style={styles.sectionHint}>Tek seferlik küçük coin paketleri, abonelik gerektirmez.</Text>
        <View style={styles.plansList}>
          {THEMED_FAL_PACKAGES.map((pack) => (
            <View key={pack.id} style={styles.themedCard}>
              <Ionicons name={pack.theme === 'kahve' ? 'cafe-outline' : 'sparkles-outline'} size={22} color={GOLD} />
              <Text style={styles.planTitle}>{pack.name}</Text>
              <Text style={styles.planQuota}>{pack.coins} Coin</Text>
              <Pressable onPress={() => buyThemedPack(pack.coins, pack.name)} style={styles.planButton}>
                <Text style={styles.planButtonText}>{pack.priceTL}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Coin Mağazası</Text>
        <View style={styles.coinPreviewRow}>
          {COIN_PACKAGES.slice(0, 2).map((pack) => (
            <View key={pack.id} style={styles.coinPreviewCard}>
              <Ionicons name="disc-outline" size={18} color={GOLD} />
              <Text style={styles.coinPreviewText}>{pack.coins} Coin</Text>
              <Text style={styles.coinPreviewPrice}>{pack.priceTL}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => navigation.navigate('CoinShop')} style={styles.coinShopLink}>
          <Text style={styles.coinShopLinkText}>Tüm coin paketlerini gör</Text>
          <Ionicons name="chevron-forward" size={14} color={GOLD} />
        </Pressable>

        <Text style={styles.footnote}>Abonelikler istediğin zaman iptal edilebilir.</Text>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 20,
  },
  activeTextWrap: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 2,
  },
  activeSubtitle: {
    fontSize: 11.5,
    color: TEXT_PRIMARY,
  },
  deactivateButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deactivateButtonText: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  periodBlock: {
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  plansList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  planCardActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  planBadge: {
    position: 'absolute',
    top: 10,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  planTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 8,
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: GOLD,
    marginTop: 2,
  },
  planQuota: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  planBonus: {
    fontSize: 10.5,
    color: GOLD,
    fontWeight: '600',
  },
  planButton: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 8,
  },
  planButtonDisabled: {
    opacity: 0.5,
  },
  planButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  themedCard: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  coinPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  coinPreviewCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 14,
  },
  coinPreviewText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  coinPreviewPrice: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  coinShopLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 20,
  },
  coinShopLinkText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
  },
  footnote: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});
