import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import { getCoins, subscribeCoins } from '@/services/coins';
import { isPremium } from '@/services/premium';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

export default function MagazaScreen({ navigation }: Props) {
  const [coins, setCoins] = useState(0);
  const [premium, setPremium] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCoins().then(setCoins);
      isPremium().then(setPremium);
    }, []),
  );

  useEffect(() => subscribeCoins(setCoins), []);

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
          <FeatureIcon source={FEATURE_ICONS.premium} fallback={<Ionicons name="star" size={28} color={GOLD} />} size={78} />
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
            <FeatureIcon source={FEATURE_ICONS.coinShop} fallback={<Ionicons name="disc-outline" size={22} color={GOLD} />} size={74} />
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
            <FeatureIcon
              source={FEATURE_ICONS.cardDesigns}
              fallback={<Ionicons name="color-palette-outline" size={22} color={GOLD} />}
              size={74}
            />
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
            <FeatureIcon
              source={FEATURE_ICONS.tarotSpread}
              fallback={<MaterialCommunityIcons name="cards-outline" size={22} color={GOLD} />}
              size={74}
            />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Detaylı Tarot Açılımları</Text>
              <Text style={styles.cardSubtitle}>5, 7 ve 10 kartlık açılımlar coin karşılığı</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Sosyal Mağaza</Text>
        <View style={styles.list}>
          <Pressable
            onPress={() => navigation.navigate('Shop')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon fallback={<Ionicons name="ribbon-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Çerçeve, Rozet & Efektler</Text>
              <Text style={styles.cardSubtitle}>Profilini kişiselleştir</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('VipTiers')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon fallback={<Ionicons name="diamond-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>VIP Kademeleri</Text>
              <Text style={styles.cardSubtitle}>Aylık ayrıcalıklı üyelik</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GOLD} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Oyunlar</Text>
        <View style={styles.list}>
          <Pressable
            onPress={() => navigation.navigate('Garden')}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <FeatureIcon fallback={<MaterialCommunityIcons name="flower-tulip-outline" size={22} color={GOLD} />} size={74} />
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Kader Bahçesi</Text>
              <Text style={styles.cardSubtitle}>Tohum ek, ay evresine göre büyüt, hasat et</Text>
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
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
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
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 14,
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
