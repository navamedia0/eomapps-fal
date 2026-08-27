import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { getCoins, subscribeCoins } from '@/services/coins';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD } from '@/theme/colors';

type Navigation = { navigate: (screen: 'CoinShop') => void };

export default function CoinBadge({ navigation }: { navigation: Navigation }) {
  const [coins, setCoins] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getCoins().then(setCoins);
    }, []),
  );

  useEffect(() => {
    getCoins().then(setCoins);
    return subscribeCoins(setCoins);
  }, []);

  return (
    <Pressable
      onPress={() => navigation.navigate('CoinShop')}
      style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
      hitSlop={8}
    >
      <View style={styles.coinWrap}>
        <Image source={FEATURE_ICONS.coinIcon} style={styles.coinImage} resizeMode="contain" />
      </View>
      <Text style={styles.text}>{coins}</Text>
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
    borderRadius: 22,
    paddingVertical: 4,
    paddingLeft: 5,
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
  coinWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 200, 121, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinImage: {
    width: 30,
    height: 30,
    transform: [{ scale: 1.9 }],
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(242, 200, 121, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

