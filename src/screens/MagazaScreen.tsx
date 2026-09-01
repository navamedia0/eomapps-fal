import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { TabScreenProps } from '@/navigation/types';
import { getCoins, subscribeCoins } from '@/services/coins';
import { isPremium } from '@/services/premium';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

type ShopShowcaseItem = {
  key: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor?: string;
  iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconType?: 'ionicons' | 'material';
  iconColor: string;
  accentGradient: [string, string];
  onPress: () => void;
};

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

  const showcaseItems: ShopShowcaseItem[] = [
    {
      key: 'coin_shop',
      title: 'Coin & Kristal',
      subtitle: 'Kristal keseleri ve avantajlı coin paketleri',
      badge: '💰 Bakiye Yükle',
      iconName: 'diamond-outline',
      iconColor: '#38BDF8',
      accentGradient: ['#0284C7', '#0369A1'],
      onPress: () => navigation.navigate('CoinShop'),
    },
    {
      key: 'vip_tiers',
      title: 'VIP Kademeleri',
      subtitle: 'Ametist, Zümrüt ve Kozmik aylık ayrıcalıklar',
      badge: '👑 Özel Statü',
      iconName: 'trophy-outline',
      iconColor: '#F59E0B',
      accentGradient: ['#D97706', '#B45309'],
      onPress: () => navigation.navigate('VipTiers'),
    },
    {
      key: 'frames_badges',
      title: 'Çerçeve & Rozet',
      subtitle: 'Profil çerçeveleri ve özel giriş efektleri',
      badge: '✨ Vitrin Eşyası',
      iconName: 'ribbon-outline',
      iconColor: '#EC4899',
      accentGradient: ['#DB2777', '#BE185D'],
      onPress: () => navigation.navigate('Shop'),
    },
    {
      key: 'card_designs',
      title: 'Kart Tasarımları',
      subtitle: 'Tarot destelerinin arka yüz desenlerini özelleştir',
      badge: '🎨 Kişiselleştir',
      iconName: 'color-palette-outline',
      iconColor: '#8B5CF6',
      accentGradient: ['#7C3AED', '#6D28D9'],
      onPress: () => navigation.navigate('CardDesigns'),
    },
    {
      key: 'deep_tarot',
      title: 'Derin Açılımlar',
      subtitle: '5, 7 ve 10 kartlık detaylı analiz masaları',
      badge: '🔮 Özel Fal',
      iconName: 'cards-outline',
      iconType: 'material',
      iconColor: '#10B981',
      accentGradient: ['#059669', '#047857'],
      onPress: () => navigation.navigate('TarotSpread'),
    },
    {
      key: 'game_center',
      title: 'Oyun & Keşif',
      subtitle: 'Çakra çarkıfeleği, zar kehaneti ve kart düellosu',
      badge: '🎮 Eğlence',
      iconName: 'game-controller-outline',
      iconColor: '#F97316',
      accentGradient: ['#EA580C', '#C2410C'],
      onPress: () => navigation.navigate('OyunMerkezi'),
    },
  ];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="storefront-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Mistik Mağaza</Text>
        </View>

        {/* Bakiye Özeti Şeridi */}
        <View style={styles.walletBar}>
          <View style={styles.walletInfo}>
            <Ionicons name="sparkles" size={16} color={GOLD} />
            <Text style={styles.walletText}>
              Mevcut Bakiyen: <Text style={styles.walletAmount}>{coins} Coin</Text>
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('CoinShop')}
            style={({ pressed }) => [styles.walletAddBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="add-circle" size={15} color="#000000" />
            <Text style={styles.walletAddBtnText}>Yükle</Text>
          </Pressable>
        </View>

        {/* Öne Çıkan VIP / Premium Banner */}
        <Pressable
          onPress={() => navigation.navigate('Premium')}
          style={({ pressed }) => [styles.heroBanner, pressed && styles.cardPressed]}
        >
          <LinearGradient
            colors={['#2A1705', '#160C02', '#0A0501']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroGlowBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#FEF08A" />
            <Text style={styles.heroGlowBadgeText}>AYRICALIKLI ÜYELİK</Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>
              {premium ? 'Mistik Premium Aktif 🌟' : 'Mistik Rehber VIP Kulübü'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {premium
                ? 'Tüm fallara ve özel yorumlara sınırsız erişimin aktif.'
                : 'Sınırsız fal hakkı, altın profil tacı ve reklamsız deneyim.'}
            </Text>
          </View>
          <View style={styles.heroActionRow}>
            <Text style={styles.heroActionText}>{premium ? 'Üyeliğini Yönet' : 'Ayrıcalıkları İncele'}</Text>
            <Ionicons name="chevron-forward" size={16} color={GOLD} />
          </View>
        </Pressable>

        {/* Mağaza Vitrini — 2'li Izgara (Grid) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>MAĞAZA KATEGORİLERİ</Text>
          <Text style={styles.sectionCount}>6 Bölüm</Text>
        </View>

        <View style={styles.grid}>
          {showcaseItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.iconWrap, { backgroundColor: item.iconColor + '18' }]}>
                  {item.iconType === 'material' ? (
                    <MaterialCommunityIcons name={item.iconName as any} size={22} color={item.iconColor} />
                  ) : (
                    <Ionicons name={item.iconName as any} size={22} color={item.iconColor} />
                  )}
                </View>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{item.badge}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              </View>

              <View style={styles.cardArrowRow}>
                <Text style={styles.cardExploreText}>İncele</Text>
                <Ionicons name="arrow-forward" size={13} color={GOLD} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Ücretsiz Ödül Şeridi */}
        <Pressable
          onPress={() => navigation.navigate('Tasks')}
          style={({ pressed }) => [styles.freeRewardBanner, pressed && styles.cardPressed]}
        >
          <View style={styles.freeRewardLeft}>
            <View style={styles.giftIconWrap}>
              <Ionicons name="gift" size={22} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.freeRewardTitle}>Ücretsiz Coin & Görevler</Text>
              <Text style={styles.freeRewardSubtitle}>Günlük görevleri tamamla, video izle ve bonus kazan!</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={GOLD} />
        </Pressable>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  walletBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  walletAmount: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  walletAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GOLD,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  walletAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  heroBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D97706',
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  heroGlowBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  heroGlowBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.6,
  },
  heroBody: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  heroActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#121215',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 13,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  cardBottom: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    lineHeight: 14,
  },
  cardArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardExploreText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
  freeRewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16161A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.25)',
    padding: 14,
  },
  freeRewardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  giftIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 169, 60, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeRewardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  freeRewardSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    lineHeight: 15,
  },
});
