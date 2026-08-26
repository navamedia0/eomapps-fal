import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { COIN_PACKAGES } from '@/constants/coinPackages';
import { getCoins, addCoins } from '@/services/coins';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

export default function CoinShopScreen() {
  const [coins, setCoins] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getCoins().then(setCoins);
  }, []);

  useEffect(() => {
    refresh();
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
          <Ionicons name="disc-outline" size={30} color={GOLD} />
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
              {pack.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pack.badge}</Text>
                </View>
              )}
              <Ionicons name="disc" size={26} color={GOLD} />
              <Text style={styles.packCoins}>{pack.coins} Coin</Text>
              <View style={styles.packButton}>
                <Text style={styles.packButtonText}>{pack.priceTL}</Text>
              </View>
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
    alignItems: 'center',
    gap: 8,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  packCardPressed: {
    opacity: 0.85,
  },
  badge: {
    position: 'absolute',
    top: 10,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: NIGHT_CARD,
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
    color: NIGHT_CARD,
  },
});
