import { useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '@/navigation/types';
import { getCheckinStatus, type CheckinStatus } from '@/services/streak';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import SozlerKoskuDrawerModal from '@/components/SozlerKoskuDrawerModal';
import { FEATURE_ICONS } from '@/assets/icons';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_CAPTION,
} from '@/theme/colors';

const UST_BANNER = require('@/assets/icons/ust_banner.png');

type Props = TabScreenProps;

type GridItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

type Category = {
  key: string;
  title: string;
  items: GridItem[];
};

function chunkPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

function GridButton({ item }: { item: GridItem }) {
  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [styles.gridButton, pressed && styles.gridButtonPressed]}
    >
      <FeatureIcon source={FEATURE_ICONS[item.key]} fallback={item.icon} size={56} />
      <View style={styles.gridTextWrap}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={GOLD} style={styles.gridChevron} />
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [checkinInfo, setCheckinInfo] = useState<CheckinStatus | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCheckinStatus().then(setCheckinInfo);
  }, []);

  const goToTasks = () => navigation.navigate('Tasks');

  const categories: Category[] = [
    {
      key: 'fallar',
      title: 'Fallar',
      items: [
        {
          key: 'coffee',
          title: 'Kahve Falı',
          subtitle: 'Fincanındaki sırları çözelim',
          icon: <MaterialCommunityIcons name="coffee" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ImageReading', { kind: 'coffee' }),
        },
        {
          key: 'tarot',
          title: 'Tarot Falı',
          subtitle: 'Kartlar bugününü aydınlatsın',
          icon: <MaterialCommunityIcons name="cards" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('TarotSpread'),
        },
        {
          key: 'face',
          title: 'Yüz Falı',
          subtitle: 'Sima ilmiyle kaderini keşfet',
          icon: <MaterialCommunityIcons name="face-recognition" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ImageReading', { kind: 'face' }),
        },
        {
          key: 'palm',
          title: 'El Falı',
          subtitle: 'Avucundaki çizgileri oku',
          icon: <MaterialCommunityIcons name="hand-back-right-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ImageReading', { kind: 'palm' }),
        },
        {
          key: 'iching',
          title: 'Çin I Ching Falı',
          subtitle: '3 sikke ile 64 heksagram',
          icon: <MaterialCommunityIcons name="yin-yang" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('IChingReading'),
        },
        {
          key: 'rune',
          title: 'Nordik Rün Falı',
          subtitle: 'Vikinglerin kutsal taşları',
          icon: <MaterialCommunityIcons name="triangle-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('RuneReading'),
        },
        {
          key: 'voiceReading',
          title: 'Sesli Fal',
          subtitle: 'Anlat, biz yorumlayalım',
          icon: <Ionicons name="mic-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('VoiceReading'),
        },
      ],
    },
    {
      key: 'ruya',
      title: 'Rüya',
      items: [
        {
          key: 'dream',
          title: 'Rüya Yorumlama',
          subtitle: 'Rüyanın sembollerini birlikte çöz',
          icon: <Ionicons name="moon" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('DreamChat'),
        },
        {
          key: 'dreamLibrary',
          title: 'Rüya Kitaplığı',
          subtitle: 'Geçmiş rüyalarını sakla, ara',
          icon: <Ionicons name="library-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('RuyaKitapligi'),
        },
      ],
    },
    {
      key: 'astroloji',
      title: 'Burç & Astroloji',
      items: [
        {
          key: 'horoscope',
          title: 'Günlük Burç',
          subtitle: 'Bugün burcunu neler bekliyor?',
          icon: <MaterialCommunityIcons name="zodiac-leo" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Zodiac'),
        },
        {
          key: 'zodiacTraits',
          title: 'Burç Özellikleri',
          subtitle: 'Burcunun tüm özelliklerini keşfet',
          icon: <MaterialCommunityIcons name="star-circle-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ZodiacTraits'),
        },
        {
          key: 'compatibility',
          title: 'Burç Uyumu',
          subtitle: 'İki burcun uyumuna bak',
          icon: <Ionicons name="heart-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('Compatibility'),
        },
        {
          key: 'birthChart',
          title: 'Doğum Haritası',
          subtitle: 'Gök haritanı çıkar',
          icon: <MaterialCommunityIcons name="chart-donut" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('BirthChart'),
        },
        {
          key: 'risingSign',
          title: 'Yükselen Burcum',
          subtitle: 'Yükselen burcunu hesapla',
          icon: <Ionicons name="flash-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('RisingSign'),
        },
      ],
    },
    {
      key: 'sayilar',
      title: 'Sayılar & Enerji',
      items: [
        {
          key: 'numerology',
          title: 'Numeroloji',
          subtitle: 'Sayıların gizli anlamını öğren',
          icon: <MaterialCommunityIcons name="numeric" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Numerology'),
        },
        {
          key: 'biorhythm',
          title: 'Biyoritim',
          subtitle: 'Bugünkü enerji seviyeni gör',
          icon: <MaterialCommunityIcons name="waveform" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Biorhythm'),
        },
        {
          key: 'moonCalendar',
          title: 'Ay Takvimi',
          subtitle: 'Ayın evresini takip et',
          icon: <MaterialCommunityIcons name="moon-waning-crescent" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('MoonCalendar'),
        },
      ],
    },
    {
      key: 'eglence',
      title: 'Eğlence',
      items: [
        {
          key: 'magicBall',
          title: 'Sihirli Küre',
          subtitle: 'Evet ya da hayır? Sor',
          icon: <MaterialCommunityIcons name="crystal-ball" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('MagicBall'),
        },
      ],
    },
    {
      key: 'ic-huzur',
      title: 'İç Huzur',
      items: [
        {
          key: 'angelCard',
          title: 'Günün İlham Kartı',
          subtitle: 'Bugüne küçük bir mesaj',
          icon: <Ionicons name="rose-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('AngelCard'),
        },
        {
          key: 'affirmation',
          title: 'Günlük Olumlama',
          subtitle: 'Gününe iyi bir söz',
          icon: <Ionicons name="sunny-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('Affirmation'),
        },
        {
          key: 'breathing',
          title: 'Nefes Egzersizi',
          subtitle: 'Sakinleş, nefesine odaklan',
          icon: <MaterialCommunityIcons name="meditation" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('BreathingExercise'),
        },
        {
          key: 'moodJournal',
          title: 'Duygu Günlüğü',
          subtitle: 'Bugünkü ruh halini kaydet',
          icon: <Ionicons name="book-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('MoodJournal'),
        },
      ],
    },
  ];

  return (
    <MysticTableBackground scrollY={scrollY}>
      {/* Sol Üst 3 Çizgi Hamburger Menü Butonu (Sözler & Bilgi Köşkü) */}
      <View style={[styles.floatingMenuWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => setDrawerVisible(true)}
          style={({ pressed }) => [styles.hamburgerButton, pressed && styles.hamburgerButtonPressed]}
          hitSlop={8}
        >
          <Ionicons name="menu" size={22} color={GOLD} />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <Image source={UST_BANNER} style={styles.banner} resizeMode="cover" />

        <View style={styles.header}>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} style={styles.sparkle} />
          <Text style={styles.headerTitle}>Mistik Rehber</Text>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} style={styles.sparkle} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.headerCaption}>Kaderin kapılarını aralayın</Text>

        {checkinInfo && !checkinInfo.isClaimedToday && (
          <Pressable onPress={goToTasks}>
            <Text style={styles.rewardToast}>
              Bugünkü yoklamanı yap, +{checkinInfo.todayRewardCoins} coin kazan! ({checkinInfo.dayInWeek}. gün) 📅
            </Text>
          </Pressable>
        )}

        <View style={styles.freeRow}>
          <Pressable onPress={goToTasks} style={({ pressed }) => [styles.freeButton, pressed && styles.pressedFade]}>
            <FeatureIcon source={FEATURE_ICONS.freeCoins} fallback={<Ionicons name="gift-outline" size={22} color={GOLD} />} size={54} />
            <Text style={styles.freeButtonText} numberOfLines={2}>Ücretsiz Coin Kazan</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MiniGames')}
            style={({ pressed }) => [styles.freeButton, pressed && styles.pressedFade]}
          >
            <FeatureIcon source={FEATURE_ICONS.miniGames} fallback={<Ionicons name="game-controller-outline" size={22} color={GOLD} />} size={54} />
            <Text style={styles.freeButtonText} numberOfLines={2}>Mini Oyunlar</Text>
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {categories.map((category) => (
            <View key={category.key} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.grid}>
                {chunkPairs(category.items).map((pair, idx) => (
                  <View key={`${category.key}-${idx}`} style={styles.gridRow}>
                    <GridButton item={pair[0]} />
                    {pair[1] ? (
                      <GridButton item={pair[1]} />
                    ) : (
                      <View style={styles.gridPlaceholder} />
                    )}
                  </View>
                ))}
              </View>

              {category.key === 'fallar' && (
                <View style={styles.fallarActionRow}>
                  <Pressable
                    onPress={() => navigation.navigate('CardDeckHub')}
                    style={({ pressed }) => [styles.customDecksButton, pressed && styles.pressedFade]}
                  >
                    <LinearGradient
                      colors={['rgba(245, 158, 11, 0.22)', 'rgba(168, 85, 247, 0.18)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <MaterialCommunityIcons name="cards-playing" size={22} color={GOLD} />
                    <View style={styles.customDeckTextWrap}>
                      <Text style={styles.customDeckTitle}>Kendi Kartlarınla Fal Bak</Text>
                      <Text style={styles.customDeckSub}>Tarot, Katina, Lenormand & 8 Mistik Deste</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={GOLD} />
                  </Pressable>

                  <Pressable
                    onPress={() => navigation.navigate('TumFallar')}
                    style={({ pressed }) => [styles.allFalsButton, pressed && styles.pressedFade]}
                  >
                    <Text style={styles.allFalsButtonText}>Tüm fal çeşitleri için tıklayınız</Text>
                    <Ionicons name="chevron-forward" size={16} color={GOLD} />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Sözler & Bilgi Köşkü Açılır Çekmece Menüsü */}
      <SozlerKoskuDrawerModal
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  floatingMenuWrap: {
    position: 'absolute',
    left: 14,
    zIndex: 999,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  hamburgerButtonPressed: {
    backgroundColor: 'rgba(58, 36, 106, 0.95)',
    borderColor: GOLD,
    transform: [{ scale: 0.92 }],
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 12,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 22,
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sparkle: {
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1.5,
    textShadowColor: GOLD_SOFT,
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  headerDivider: {
    marginTop: 14,
    width: 120,
    height: 1,
    backgroundColor: GOLD_SOFT,
  },
  headerCaption: {
    marginTop: 10,
    fontSize: 13,
    color: TEXT_CAPTION,
    letterSpacing: 0.5,
    marginBottom: 30,
  },
  pressedFade: {
    opacity: 0.85,
  },
  rewardToast: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  freeRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 26,
  },
  freeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderRadius: 18,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 10,
    minHeight: 68,
  },
  freeButtonText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    lineHeight: 16,
  },
  categoryList: {
    width: '100%',
    gap: 26,
  },
  categorySection: {
    width: '100%',
  },
  categoryTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    width: '100%',
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  gridButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 6,
    minHeight: 74,
  },
  gridButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  gridPlaceholder: {
    flex: 1,
  },
  fallarActionRow: {
    marginTop: 12,
    gap: 8,
  },
  customDecksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  customDeckTextWrap: {
    flex: 1,
    gap: 2,
  },
  customDeckTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  customDeckSub: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  allFalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
  },
  allFalsButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
  },
  gridTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 19,
    letterSpacing: 0.2,
  },
  gridChevron: {
    opacity: 0.75,
    marginRight: 2,
  },
});
