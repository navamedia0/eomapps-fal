import React, { useCallback, useState } from 'react';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { useFocusEffect } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import {
  getVipTiers,
  subscribeVip,
  getMyVipSubscription,
  type VipTier,
  type VipSubscription,
} from '@/services/shop';
import { GOLD, TEXT_MUTED } from '@/theme/colors';

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 3600 * 1000)));
}

const TIER_THEMES: Record<string, { color: string; badgeBg: string; icon: string }> = {
  ametist: { color: '#C084FC', badgeBg: 'rgba(192, 132, 252, 0.15)', icon: 'gem' },
  zumrut: { color: '#34D399', badgeBg: 'rgba(52, 211, 153, 0.15)', icon: 'shield-alt' },
  kozmik: { color: GOLD, badgeBg: 'rgba(229, 169, 60, 0.15)', icon: 'crown' },
};

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
        showAlert('Aboneliğin Başladı 🎉', `${tier.name} kademesine hoş geldin! Tüm ayrıcalıkların aktif edildi.`);
        load();
      } catch (err) {
        showAlert('Abonelik Başarısız', err instanceof Error ? err.message : 'Yetersiz Kristal bakiyesi veya bağlantı sorunu.');
      } finally {
        setSubscribingId(null);
      }
    },
    [load],
  );

  if (loading) {
    return (
      <MysticTableBackground>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* VIP Kulübü Hero Başlığı */}
        <View style={styles.heroCard}>
          <View style={styles.heroCrownCircle}>
            <MaterialCommunityIcons name="crown" size={32} color={GOLD} />
          </View>
          <Text style={styles.heroTitle}>MİSTİK REHBER VIP KULÜBÜ</Text>
          <Text style={styles.heroSub}>
            Ayrıcalıklı üyeliklerle her gün ücretsiz derin açılımlar, özel altın çerçeveler ve VIP yorumcu önceliği kazan.
          </Text>
        </View>

        {/* Aktif Abonelik Varsa */}
        {subscription && (
          <View style={styles.activeSubCard}>
            <View style={styles.activeSubHeader}>
              <MaterialCommunityIcons name="crown" size={20} color={GOLD} />
              <Text style={styles.activeSubTitle}>Aktif VIP Üyeliğin: {subscription.tierName}</Text>
            </View>
            <Text style={styles.activeSubDays}>
              Kalan Süre: {daysUntil(subscription.expiresAt)} Gün (Yenilenme: {new Date(subscription.expiresAt).toLocaleDateString('tr-TR')})
            </Text>
          </View>
        )}

        {/* Kademeler */}
        <View style={styles.tierList}>
          {tiers.map((tier, idx) => {
            const isCurrent = subscription?.tierId === tier.id;
            const theme = TIER_THEMES[tier.id] || {
              color: GOLD,
              badgeBg: 'rgba(229, 169, 60, 0.15)',
              icon: 'crown',
            };

            return (
              <View
                key={tier.id}
                style={[
                  styles.tierCard,
                  isCurrent && styles.tierCardActive,
                  idx === 2 && styles.tierCardCosmic,
                ]}
              >
                <View style={styles.tierTopRow}>
                  <View style={[styles.tierBadge, { backgroundColor: theme.badgeBg, borderColor: theme.color + '66' }]}>
                    <FontAwesome5 name={theme.icon as any} size={13} color={theme.color} />
                    <Text style={[styles.tierBadgeText, { color: theme.color }]}>{tier.name}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Ionicons name="diamond" size={14} color="#38BDF8" />
                    <Text style={styles.priceText}>{tier.monthlyPriceCrystal} Kristal</Text>
                    <Text style={styles.priceSub}>/ay</Text>
                  </View>
                </View>

                {/* Ayrıcalık Maddeleri */}
                <View style={styles.perkList}>
                  {tier.perks.map((perk, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.color} />
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>

                {/* Abone Ol Butonu */}
                <Pressable
                  onPress={() => handleSubscribe(tier)}
                  disabled={isCurrent || subscribingId === tier.id}
                  style={({ pressed }) => [
                    styles.subButton,
                    { backgroundColor: isCurrent ? '#27272A' : theme.color },
                    pressed && styles.btnPressed,
                  ]}
                >
                  {subscribingId === tier.id ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text
                      style={[
                        styles.subButtonText,
                        { color: isCurrent ? TEXT_MUTED : '#000000' },
                      ]}
                    >
                      {isCurrent ? 'Mevcut Aktif Üyeliğin' : `${tier.name} Üyesi Ol`}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 48,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  heroCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCrownCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(229, 169, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 17,
  },
  activeSubCard: {
    backgroundColor: '#18181D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 14,
    marginBottom: 16,
  },
  activeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activeSubTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeSubDays: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '600',
  },
  tierList: {
    gap: 12,
  },
  tierCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  tierCardActive: {
    borderColor: GOLD,
  },
  tierCardCosmic: {
    borderColor: 'rgba(229, 169, 60, 0.4)',
    backgroundColor: '#15151B',
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.8,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tierBadgeText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38BDF8',
  },
  priceSub: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  perkList: {
    gap: 8,
    marginBottom: 16,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 12.5,
    color: '#E4E4E7',
    fontWeight: '500',
    flex: 1,
  },
  subButton: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
