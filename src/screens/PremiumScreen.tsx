import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { isPremium, activatePremiumMock, deactivatePremiumMock } from '@/services/premium';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;

const BENEFITS = [
  'Sınırsız fal ve yorum hakkı',
  'Tüm özelliklere sınırsız erişim',
  'Yeni özelliklere öncelikli erişim',
];

const PLANS = [
  { key: 'monthly', title: 'Aylık', price: '₺29,99', period: '/ay', badge: null },
  { key: 'yearly', title: 'Yıllık', price: '₺199,99', period: '/yıl', badge: '%45 tasarruf' },
];

export default function PremiumScreen({}: Props) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isPremium().then((value) => {
      setActive(value);
      setLoading(false);
    });
  }, []);

  const purchase = useCallback(async () => {
    await activatePremiumMock();
    setActive(true);
  }, []);

  const deactivate = useCallback(async () => {
    await deactivatePremiumMock();
    setActive(false);
  }, []);

  if (loading) return <MysticTableBackground><View style={styles.flex} /></MysticTableBackground>;

  if (active) {
    return (
      <MysticTableBackground>
        <View style={styles.activeWrap}>
          <View style={styles.activeIconCircle}>
            <Ionicons name="star" size={40} color={GOLD} />
          </View>
          <Text style={styles.activeTitle}>Premium Aktif</Text>
          <Text style={styles.activeSubtitle}>Tüm özelliklere sınırsız erişimin var. 🌙</Text>
          <Pressable onPress={deactivate} style={styles.deactivateButton}>
            <Text style={styles.deactivateButtonText}>Test Aboneliğini Kapat</Text>
          </Pressable>
        </View>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="star-outline" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Mistik Rehber Premium</Text>
          <Text style={styles.headerSubtitle}>Kredi sınırı olmadan tüm falları keşfet</Text>
        </View>

        <View style={styles.benefitsList}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={GOLD} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansList}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.key}
              onPress={purchase}
              style={({ pressed }) => [styles.planCard, pressed && styles.planCardPressed]}
            >
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planPrice}>
                {plan.price}
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </Text>
              <View style={styles.planButton}>
                <Text style={styles.planButtonText}>Satın Al</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footnote}>Abonelik istediğin zaman iptal edilebilir.</Text>
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
    marginBottom: 24,
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
  benefitsList: {
    gap: 10,
    marginBottom: 28,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  plansList: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    flexBasis: 0,
    alignItems: 'center',
    gap: 8,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  planCardPressed: {
    opacity: 0.85,
  },
  planBadge: {
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  planBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  planTitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  planPeriod: {
    fontSize: 11,
    fontWeight: '400',
    color: TEXT_MUTED,
  },
  planButton: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  planButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  footnote: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  activeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  activeIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  activeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 6,
  },
  activeSubtitle: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 28,
  },
  deactivateButton: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  deactivateButtonText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
