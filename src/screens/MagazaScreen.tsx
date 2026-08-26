import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import { getCoins } from '@/services/coins';
import { isPremium } from '@/services/premium';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Magaza'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function MagazaScreen({ navigation }: Props) {
  const [coins, setCoins] = useState(0);
  const [premium, setPremium] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCoins().then(setCoins);
      isPremium().then(setPremium);
    }, []),
  );

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="storefront-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Mağaza</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Premium')}
          style={({ pressed }) => [styles.premiumCard, pressed && styles.cardPressed]}
        >
          <Ionicons name="star" size={28} color={GOLD} />
          <View style={styles.premiumTextWrap}>
            <Text style={styles.premiumTitle}>{premium ? 'Premium Aktif' : 'Mistik Rehber Premium'}</Text>
            <Text style={styles.premiumSubtitle}>
              {premium ? 'Tüm özelliklere sınırsız erişimin var 🌙' : 'Kredi sınırı olmadan tüm falları keşfet'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={GOLD} />
        </Pressable>

        <View style={styles.list}>
          <Pressable
            onPress={() => navigation.navigate('CoinShop')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="disc-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Coin Mağazası</Text>
              <Text style={styles.cardSubtitle}>Bakiyen: {coins} Coin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('CardDesigns')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="color-palette-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Kart Tasarımları</Text>
              <Text style={styles.cardSubtitle}>Tarot kartlarının arka yüzünü özelleştir</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('TarotSpread')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="cards-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Detaylı Tarot Açılımları</Text>
              <Text style={styles.cardSubtitle}>5, 7 ve 10 kartlık açılımlar coin karşılığı</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>
        </View>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
    marginBottom: 20,
  },
  cardPressed: {
    opacity: 0.85,
  },
  premiumTextWrap: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 11.5,
    color: TEXT_PRIMARY,
  },
  list: {
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
});
