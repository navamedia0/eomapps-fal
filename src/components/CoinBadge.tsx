import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, StyleSheet } from 'react-native';
import { getCoins, subscribeCoins } from '@/services/coins';
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
    return subscribeCoins(setCoins);
  }, []);

  return (
    <Pressable onPress={() => navigation.navigate('CoinShop')} style={styles.badge} hitSlop={8}>
      <Ionicons name="disc" size={20} color={GOLD} />
      <Text style={styles.text}>{coins}</Text>
      <Ionicons name="add-circle" size={18} color={GOLD} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    color: GOLD,
  },
});
