import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, StyleSheet } from 'react-native';
import { getCoins } from '@/services/coins';
import { GOLD, GOLD_SOFT } from '@/theme/colors';

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
  }, []);

  return (
    <Pressable onPress={() => navigation.navigate('CoinShop')} style={styles.badge} hitSlop={8}>
      <Ionicons name="disc-outline" size={13} color={GOLD} />
      <Text style={styles.text}>{coins}</Text>
      <Ionicons name="add-circle" size={13} color={GOLD} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
  },
});
