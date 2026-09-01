import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { COIN_PACKAGES } from '@/constants/coinPackages';
import { getCoins, addCoins, subscribeCoins } from '@/services/coins';
import {
  getWallet,
  subscribeWallet,
  purchaseWalletBundle,
  WALLET_BUNDLES,
  type WalletBalances,
} from '@/services/shop';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import AnimatedNumberText from '@/components/AnimatedNumberText';
import { GOLD, TEXT_MUTED } from '@/theme/colors';

export default function CoinShopScreen() {
  const [coins, setCoins] = useState(0);
  const [coinsLoaded, setCoinsLoaded] = useState(false);
  const [wallet, setWallet] = useState<WalletBalances | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getCoins().then((c) => {
      setCoins(c);
      setCoinsLoaded(true);
    });
    getWallet()
      .then(setWallet)
      .catch(() => setWallet(null));
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCoins((c) => {
      setCoins(c);
      setCoinsLoaded(true);
    });
  }, [refresh]);

  useEffect(() => subscribeWallet(setWallet), []);

  const buy = useCallback(
    async (packageId: string, amount: number) => {
      await addCoins(amount);
      setFeedback(`+${amount} Coin cüzdanına eklendi! 🌙`);
      refresh();
      setTimeout(() => setFeedback(null), 3000);
    },
    [refresh],
  );

  const buyBundle = useCallback(
    async (
      bundleId: (typeof WALLET_BUNDLES)[number]['id'],
      coinAmount: number,
      crystalAmount: number,
    ) => {
      setPurchasingBundle(bundleId);
      try {
        const balances = await purchaseWalletBundle(bundleId);
        setWallet(balances);
        await addCoins(coinAmount);
        setFeedback(`+${coinAmount} Coin ve +${crystalAmount} Kristal eklendi! 💎`);
        setTimeout(() => setFeedback(null), 3000);
      } catch (err) {
        showAlert('Alınamadı', err instanceof Error ? err.message : 'Bir sorun oluştu.');
      } finally {
        setPurchasingBundle(null);
      }
    },
    [],
  );

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Üst Canlı Bakiye Paneli */}
        <View style={styles.heroWalletCard}>
          <Text style={styles.heroTitle}>MİSTİK CÜZDANIN</Text>
          <View style={styles.heroBalancesRow}>
            {/* Coin Kutusu */}
            <View style={styles.heroBalancePill}>
              <View style={styles.heroCoinCircle}>
                <FontAwesome5 name="coins" size={14} color="#000000" />
              </View>
              <View>
                <Text style={styles.heroBalanceLabel}>Coin Bakiyesi</Text>
                {coinsLoaded ? (
                  <AnimatedNumberText value={coins} style={styles.heroBalanceValue} />
                ) : (
                  <Text style={styles.heroBalanceValue}>0</Text>
                )}
              </View>
            </View>

            {/* Kristal Kutusu */}
            <View style={[styles.heroBalancePill, styles.heroCrystalPill]}>
              <View style={styles.heroCrystalCircle}>
                <Ionicons name="diamond" size={16} color="#000000" />
              </View>
              <View>
                <Text style={[styles.heroBalanceLabel, { color: '#7DD3FC' }]}>Kristal Bakiyesi</Text>
                {wallet ? (
                  <AnimatedNumberText
                    value={wallet.crystal}
                    style={[styles.heroBalanceValue, { color: '#38BDF8' }]}
                  />
                ) : (
                  <Text style={[styles.heroBalanceValue, { color: '#38BDF8' }]}>0</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {feedback && (
          <View style={styles.feedbackWrap}>
            <Ionicons name="sparkles" size={16} color={GOLD} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* 1. BÖLÜM: ÇİFTE KAZANÇLI COIN & KRİSTAL KESELERİ */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>👑 AVANTAJLI COIN & KRİSTAL PAKETLERİ</Text>
          <Text style={styles.sectionSub}>Mağaza, VIP üyelik ve özel açılımlar için en avantajlı keseler</Text>
        </View>

        <View style={styles.bundleList}>
          {WALLET_BUNDLES.map((bundle, index) => {
            const isFeatured = index === 1;
            return (
              <View
                key={bundle.id}
                style={[
                  styles.bundleCard,
                  isFeatured && styles.bundleCardFeatured,
                ]}
              >
                {bundle.badge && (
                  <View style={[styles.bundleBadge, isFeatured && styles.bundleBadgeFeatured]}>
                    <Text style={styles.bundleBadgeText}>{bundle.badge}</Text>
                  </View>
                )}

                <View style={styles.bundleAmounts}>
                  <View style={styles.bundleRow}>
                    <View style={styles.coinIconCircle}>
                      <FontAwesome5 name="coins" size={11} color="#000000" />
                    </View>
                    <Text style={styles.bundleCoinText}>{bundle.coin} Coin</Text>
                  </View>
                  <View style={styles.bundleRow}>
                    <Ionicons name="diamond" size={14} color="#38BDF8" />
                    <Text style={styles.bundleCrystalText}>+{bundle.crystal} Kristal</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => buyBundle(bundle.id, bundle.coin, bundle.crystal)}
                  disabled={purchasingBundle === bundle.id}
                  style={({ pressed }) => [
                    styles.bundleButton,
                    isFeatured && styles.bundleButtonFeatured,
                    pressed && styles.btnPressed,
                  ]}
                >
                  {purchasingBundle === bundle.id ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.bundleButtonText}>{bundle.priceTL}</Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* 2. BÖLÜM: SAF COIN PAKETLERİ */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeading}>🪙 SAF COIN PAKETLERİ</Text>
          <Text style={styles.sectionSub}>Doğum haritası, tarot ve derin fal yorumları için</Text>
        </View>

        <View style={styles.grid}>
          {COIN_PACKAGES.map((pack) => (
            <Pressable
              key={pack.id}
              onPress={() => buy(pack.id, pack.coins)}
              style={({ pressed }) => [styles.packCard, pressed && styles.btnPressed]}
            >
              {pack.badge && (
                <View style={styles.packBadge}>
                  <Text style={styles.packBadgeText}>{pack.badge}</Text>
                </View>
              )}

              <View style={styles.packIconCircle}>
                <FontAwesome5 name="coins" size={24} color={GOLD} />
              </View>

              <Text style={styles.packCoinsText}>{pack.coins} COIN</Text>
              {pack.tagline ? <Text style={styles.packTagline}>{pack.tagline}</Text> : null}

              <View style={styles.packPriceBtn}>
                <Text style={styles.packPriceText}>{pack.priceTL}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* 3. BÖLÜM: GÜVEN & BİLGİ */}
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={18} color={GOLD} />
            <Text style={styles.infoText}>256-Bit SSL Güvenli ve Anında Teslimat</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="infinite" size={18} color={GOLD} />
            <Text style={styles.infoText}>Süresiz Geçerli Bakiye — Asla Silinmez</Text>
          </View>
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
  heroWalletCard: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroBalancesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroBalancePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#18181D',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
    borderRadius: 14,
    padding: 12,
  },
  heroCrystalPill: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  heroCoinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCrystalCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBalanceLabel: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 1,
  },
  heroBalanceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  feedbackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 13,
    color: GOLD,
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
  bundleList: {
    gap: 10,
  },
  bundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  bundleCardFeatured: {
    borderColor: 'rgba(229, 169, 60, 0.5)',
    backgroundColor: '#15151B',
  },
  bundleBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#27272A',
    borderBottomLeftRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bundleBadgeFeatured: {
    backgroundColor: GOLD,
  },
  bundleBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#000000',
  },
  bundleAmounts: {
    gap: 6,
  },
  bundleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleCoinText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bundleCrystalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  bundleButton: {
    backgroundColor: '#27272A',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleButtonFeatured: {
    backgroundColor: GOLD,
  },
  bundleButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  packCard: {
    width: '48.3%',
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  packBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  packBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#000000',
  },
  packIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(229, 169, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  packCoinsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  packTagline: {
    fontSize: 10,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 10,
    minHeight: 14,
  },
  packPriceBtn: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  packPriceText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#000000',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  infoBox: {
    marginTop: 22,
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
});
