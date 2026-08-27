import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Image, ImageBackground, ScrollView, StyleSheet } from 'react-native';
import { COIN_PACKAGES } from '@/constants/coinPackages';
import { getCoins, addCoins, subscribeCoins } from '@/services/coins';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const COIN_PAKETI = require('@/assets/icons/coin_paketi.webp');
const COIN_IKONU = require('@/assets/icons/coin_ikonu.png');

export default function CoinShopScreen() {
  const [coins, setCoins] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getCoins().then(setCoins);
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCoins(setCoins);
  }, [refresh]);

  const buy = useCallback(
    async (packageId: string, amount: number) => {
      await addCoins(amount);
      setFeedback(`+${amount} coin yüklendi! ✨`);
      refresh();
      setTimeout(() => setFeedback(null), 2200);
    },
    [refresh],
  );

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={COIN_IKONU} style={styles.headerIcon} resizeMode="contain" />
          <Text style={styles.headerTitle}>Coin Mağazası</Text>
          <Text style={styles.headerSubtitle}>Bakiyen: {coins} Coin</Text>
        </View>

        {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

        <View style={styles.grid}>
          {COIN_PACKAGES.map((pack) => (
            <Pressable
              key={pack.id}
              onPress={() => buy(pack.id, pack.coins)}
              style={({ pressed }) => [styles.packCard, pressed && styles.packCardPressed]}
            >
              <ImageBackground source={COIN_PAKETI} style={styles.packCardBg} imageStyle={styles.packCardBgImage} resizeMode="cover">
                {pack.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pack.badge}</Text>
                  </View>
                )}
                <Image source={COIN_IKONU} style={styles.packCoinIcon} resizeMode="contain" />
                <Text style={styles.packCoins}>{pack.coins} Coin</Text>
                <View style={styles.packButton}>
                  <Text style={styles.packButtonText}>{pack.priceTL}</Text>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  headerIcon: {
    width: 56,
    height: 56,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: GOLD,
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  feedbackText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  packCard: {
    width: '47%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  packCardBg: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 10,
  },
  packCardBgImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  packCardPressed: {
    opacity: 0.85,
  },
  packCoinIcon: {
    width: 58,
    height: 58,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E1140',
  },
  packCoins: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 8,
  },
  packButton: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  packButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E1140',
  },
});
