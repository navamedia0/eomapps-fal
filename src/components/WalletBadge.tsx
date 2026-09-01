import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { getCoins, subscribeCoins } from '@/services/coins';
import { getStoredSession } from '@/services/auth';
import { getWallet, subscribeWallet } from '@/services/shop';
import AnimatedNumberText from '@/components/AnimatedNumberText';
import { GOLD, NIGHT_DEEP, TEXT_MUTED } from '@/theme/colors';

let globalCachedCoins: number | null = null;
let globalCachedCrystal: number | null = null;

type Navigation = { navigate: (screen: 'CoinShop') => void };

export default function WalletBadge({ navigation }: { navigation: Navigation }) {
  const [coins, setCoins] = useState<number>(globalCachedCoins ?? 0);
  const [coinsLoaded, setCoinsLoaded] = useState<boolean>(globalCachedCoins !== null);
  const [crystal, setCrystal] = useState<number | null>(globalCachedCrystal);

  const refreshCrystal = useCallback(() => {
    getStoredSession().then((session) => {
      if (!session) {
        setCrystal(0);
        globalCachedCrystal = 0;
        return;
      }
      getWallet()
        .then((balances) => {
          setCrystal(balances.crystal);
          globalCachedCrystal = balances.crystal;
        })
        .catch(() => {
          setCrystal(0);
          globalCachedCrystal = 0;
        });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getCoins().then((c) => {
        setCoins(c);
        globalCachedCoins = c;
        setCoinsLoaded(true);
      });
      refreshCrystal();
    }, [refreshCrystal]),
  );

  useEffect(() => {
    getCoins().then((c) => {
      setCoins(c);
      globalCachedCoins = c;
      setCoinsLoaded(true);
    });
    return subscribeCoins((c) => {
      setCoins(c);
      globalCachedCoins = c;
      setCoinsLoaded(true);
    });
  }, []);

  useEffect(
    () =>
      subscribeWallet((balances) => {
        setCrystal(balances.crystal);
        globalCachedCrystal = balances.crystal;
      }),
    [],
  );

  return (
    <Pressable
      onPress={() => navigation.navigate('CoinShop')}
      style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
      hitSlop={8}
    >
      {/* Coin Bölümü */}
      <View style={styles.itemRow}>
        <View style={styles.coinIconCircle}>
          <FontAwesome5 name="coins" size={10} color="#000000" />
        </View>
        {coinsLoaded ? (
          <AnimatedNumberText value={coins} style={styles.coinText} />
        ) : (
          <Text style={styles.coinText}>0</Text>
        )}
      </View>

      <View style={styles.separator} />

      {/* Kristal Bölümü */}
      <View style={styles.itemRow}>
        <Ionicons name="diamond" size={12} color="#38BDF8" style={styles.crystalIcon} />
        <AnimatedNumberText value={crystal ?? 0} style={styles.crystalText} />
      </View>

      {/* Artı Ekle Butonu */}
      <View style={styles.plusWrap}>
        <Ionicons name="add" size={12} color="#000000" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  badgePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  crystalIcon: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  crystalText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.2,
  },
  plusWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
