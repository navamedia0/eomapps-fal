import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { getCoins, subscribeCoins } from '@/services/coins';
import { getStoredSession } from '@/services/auth';
import { getWallet, subscribeWallet } from '@/services/shop';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD } from '@/theme/colors';

type Navigation = { navigate: (screen: 'CoinShop') => void };

// Fal Coin (yerel, okuma açmak için harcanan) ile Kristal/Elmas (sunucudaki
// sosyal cüzdan, mağaza/VIP için harcanan) iki ayrı bakiye — karıştırılmasın
// diye aynı rozette ama net şekilde alt alta gösteriliyor.
export default function WalletBadge({ navigation }: { navigation: Navigation }) {
  const [coins, setCoins] = useState(0);
  const [crystal, setCrystal] = useState<number | null>(null);

  const refreshCrystal = useCallback(() => {
    getStoredSession().then((session) => {
      if (!session) {
        setCrystal(null);
        return;
      }
      getWallet()
        .then((balances) => setCrystal(balances.crystal))
        .catch(() => setCrystal(null));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getCoins().then(setCoins);
      refreshCrystal();
    }, [refreshCrystal]),
  );

  useEffect(() => {
    getCoins().then(setCoins);
    return subscribeCoins(setCoins);
  }, []);

  useEffect(() => subscribeWallet((balances) => setCrystal(balances.crystal)), []);

  return (
    <Pressable
      onPress={() => navigation.navigate('CoinShop')}
      style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
      hitSlop={8}
    >
      <View style={styles.balancesCol}>
        <View style={styles.row}>
          <Image source={FEATURE_ICONS.coinIcon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.text}>{coins}</Text>
        </View>
        {crystal !== null && (
          <View style={styles.row}>
            <Ionicons name="diamond" size={13} color="#8FD8F2" style={styles.crystalIcon} />
            <Text style={styles.crystalText}>{crystal}</Text>
          </View>
        )}
      </View>
      <Ionicons name="add-circle" size={20} color={GOLD} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 17, 64, 0.88)',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 18,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  badgePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  balancesCol: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  icon: {
    width: 18,
    height: 18,
  },
  crystalIcon: {
    marginLeft: 1,
    marginRight: -1,
  },
  text: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  crystalText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8FD8F2',
    letterSpacing: 0.2,
  },
});
