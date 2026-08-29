import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Image, ImageBackground, ScrollView, StyleSheet, ActivityIndicator, type StyleProp, type TextStyle } from 'react-native';
import { showAlert } from '@/services/themedAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COIN_PACKAGES } from '@/constants/coinPackages';
import { getCoins, addCoins, subscribeCoins } from '@/services/coins';
import { getWallet, subscribeWallet, purchaseWalletBundle, WALLET_BUNDLES, type WalletBalances } from '@/services/shop';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const COSMIC_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');
const COIN_IKONU = require('@/assets/icons/coin_ikonu.png');

// Yüklenme anındaki gerçek değere (mount olur olmaz) hemen oturur, sadece
// SONRAKİ değişikliklerde (satın alma vb.) ~4 saniyede sayarak yükselir —
// bu yüzden bilerek ayrı bir bileşen: hook'un "ilk değer" mantığı sadece
// bakiye gerçekten yüklendikten sonra mount edilince doğru çalışıyor.
function AnimatedBalanceText({ value, style }: { value: number; style: StyleProp<TextStyle> }) {
  const display = useAnimatedCounter(value);
  return <Text style={style}>{display}</Text>;
}

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
      setTimeout(() => setFeedback(null), 2500);
    },
    [refresh],
  );

  const buyBundle = useCallback(
    async (bundleId: (typeof WALLET_BUNDLES)[number]['id'], coinAmount: number, crystalAmount: number) => {
      setPurchasingBundle(bundleId);
      try {
        const balances = await purchaseWalletBundle(bundleId);
        setWallet(balances);
        setFeedback(`+${coinAmount} Coin ve +${crystalAmount} Kristal eklendi! 💎`);
        setTimeout(() => setFeedback(null), 2500);
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
        {/* Başlık Alanı */}
        <View style={styles.header}>
          <View style={styles.headerCoinAura}>
            <Image source={COIN_IKONU} style={styles.headerIcon} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Coin & Kristal Mağazası</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balancePill}>
              <Image source={COIN_IKONU} style={styles.balanceMiniIcon} resizeMode="contain" />
              <Text style={styles.balanceText}>
                Bakiyen:{' '}
                {coinsLoaded ? (
                  <AnimatedBalanceText value={coins} style={styles.balanceBold} />
                ) : (
                  <Text style={styles.balanceBold}>—</Text>
                )}{' '}
                <Text style={styles.balanceBold}>Coin</Text>
              </Text>
            </View>
            <View style={styles.balancePill}>
              <Ionicons name="diamond" size={15} color="#8FD8F2" />
              <Text style={styles.balanceText}>
                Kristal:{' '}
                {wallet ? (
                  <AnimatedBalanceText value={wallet.crystal} style={[styles.balanceBold, { color: '#8FD8F2' }]} />
                ) : (
                  <Text style={[styles.balanceBold, { color: '#8FD8F2' }]}>—</Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        {feedback && (
          <View style={styles.feedbackWrap}>
            <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Sadece Coin</Text>
        {/* Paketler Grid */}
        <View style={styles.grid}>
          {COIN_PACKAGES.map((pack) => (
            <Pressable
              key={pack.id}
              onPress={() => buy(pack.id, pack.coins)}
              style={({ pressed }) => [styles.packCard, pressed && styles.packCardPressed]}
            >
              {/* Kozmik mor yıldızlı arkaplan */}
              <ImageBackground
                source={COSMIC_CARD_BG}
                style={styles.packCardBg}
                imageStyle={styles.packCardBgImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(25, 15, 52, 0.45)', 'rgba(14, 8, 32, 0.78)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <CornerTicks />

                {/* Rozet (En popüler, Tasarruf vb.) */}
                {pack.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pack.badge}</Text>
                  </View>
                )}

                {/* Tagline */}
                {pack.tagline ? <Text style={styles.packTagline}>{pack.tagline}</Text> : <View style={styles.taglinePlaceholder} />}

                {/* Büyük ve Parlak Coin Görseli */}
                <View style={styles.coinAura}>
                  <Image source={COIN_IKONU} style={styles.packCoinIcon} resizeMode="contain" />
                </View>

                {/* Coin Miktarı */}
                <Text style={styles.packCoins}>{pack.coins} Coin</Text>

                {/* Fiyat Butonu */}
                <View style={styles.packButton}>
                  <Text style={styles.packButtonText}>{pack.priceTL}</Text>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Coin & Kristal Paketleri</Text>
        <Text style={styles.sectionSubtitle}>
          Avantajlı paketlerde her ikisi birden — mağazada çerçeve/rozet almak veya VIP olmak için kristal gerekir.
        </Text>
        <View style={styles.bundleList}>
          {WALLET_BUNDLES.map((bundle) => (
            <View key={bundle.id} style={styles.bundleCard}>
              {bundle.badge && (
                <View style={styles.bundleBadge}>
                  <Text style={styles.badgeText}>{bundle.badge}</Text>
                </View>
              )}
              <View style={styles.bundleAmounts}>
                <View style={styles.bundleAmountRow}>
                  <Image source={COIN_IKONU} style={styles.bundleMiniIcon} resizeMode="contain" />
                  <Text style={styles.bundleAmountText}>{bundle.coin} Coin</Text>
                </View>
                <View style={styles.bundleAmountRow}>
                  <Ionicons name="diamond" size={16} color="#8FD8F2" />
                  <Text style={[styles.bundleAmountText, { color: '#8FD8F2' }]}>{bundle.crystal} Kristal</Text>
                </View>
              </View>
              <Pressable
                onPress={() => buyBundle(bundle.id, bundle.coin, bundle.crystal)}
                disabled={purchasingBundle === bundle.id}
                style={styles.bundleButton}
              >
                {purchasingBundle === bundle.id ? (
                  <ActivityIndicator size="small" color="#1a0d33" />
                ) : (
                  <Text style={styles.bundleButtonText}>{bundle.priceTL}</Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerCoinAura: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  headerIcon: {
    width: 66,
    height: 66,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 16, 54, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  balanceMiniIcon: {
    width: 18,
    height: 18,
  },
  balanceText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  balanceBold: {
    fontWeight: '800',
    color: GOLD,
  },
  feedbackWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'center',
  },
  feedbackText: {
    fontSize: 13.5,
    color: GOLD,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  bundleList: {
    gap: 10,
  },
  bundleCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: 'rgba(143, 216, 242, 0.4)',
    padding: 14,
  },
  bundleBadge: {
    position: 'absolute',
    top: -9,
    left: 14,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  bundleAmounts: {
    flex: 1,
    gap: 4,
  },
  bundleAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bundleMiniIcon: { width: 18, height: 18 },
  bundleAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  bundleButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 84,
    alignItems: 'center',
  },
  bundleButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a0d33',
  },
  packCard: {
    width: '48%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.4,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  packCardBg: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  packCardBgImage: {
    borderRadius: 22,
  },
  packCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1a0d33',
  },
  taglinePlaceholder: {
    height: 16,
    marginBottom: 4,
  },
  packTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_SOFT,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  coinAura: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  packCoinIcon: {
    width: 62,
    height: 62,
  },
  packCoins: {
    fontSize: 17,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    marginVertical: 6,
    letterSpacing: 0.3,
  },
  packButton: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  packButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1a0d33',
    letterSpacing: 0.2,
  },
});
