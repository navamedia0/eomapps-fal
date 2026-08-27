import { useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import { recordDailyOpen, type DailyOpenResult } from '@/services/streak';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
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
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
};

type Category = {
  key: string;
  title: string;
  items: GridItem[];
};

function GridButton({ item }: { item: GridItem }) {
  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [styles.gridButton, pressed && styles.gridButtonPressed]}
    >
      <FeatureIcon source={FEATURE_ICONS[item.key]} fallback={item.icon} size={62} />
      <View style={styles.gridTextWrap}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.gridSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [rewardBanner, setRewardBanner] = useState<DailyOpenResult | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    recordDailyOpen().then((info) => {
      if (info.isNewDay) setRewardBanner(info);
    });
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
          subtitle: 'Fincanındaki sırları çöz',
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
          key: 'palm',
          title: 'El Falı',
          subtitle: 'Avucundaki çizgileri oku',
          icon: <MaterialCommunityIcons name="hand-back-right-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ImageReading', { kind: 'palm' }),
        },
        {
          key: 'katina',
          title: 'Katina Falı',
          subtitle: 'İskambille geleceğe bak',
          icon: <MaterialCommunityIcons name="cards-playing-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Katina'),
        },
        {
          key: 'voiceReading',
          title: 'Sesli Fal',
          subtitle: 'Anlat, yapay zeka yorumlasın',
          icon: <Ionicons name="mic-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('VoiceReading'),
        },
        {
          key: 'solitaire',
          title: 'Solitaire Falı',
          subtitle: 'Kartları aç, cevabını bul',
          icon: <MaterialCommunityIcons name="cards-club-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Solitaire'),
        },
        {
          key: 'daisy',
          title: 'Papatya Falı',
          subtitle: 'Seviyor mu, sevmiyor mu?',
          icon: <Ionicons name="flower-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('Daisy'),
        },
        {
          key: 'dice',
          title: 'Zar Falı',
          subtitle: 'Zarları at, şansına bak',
          icon: <MaterialCommunityIcons name="dice-multiple-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Dice'),
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

        {rewardBanner?.isNewDay && rewardBanner.rewardCoins > 0 && (
          <Text style={styles.rewardToast}>+{rewardBanner.rewardCoins} coin kazandın! ({rewardBanner.dayInWeek}. gün) ✨</Text>
        )}

        <View style={styles.freeRow}>
          <Pressable onPress={goToTasks} style={({ pressed }) => [styles.freeButton, pressed && styles.pressedFade]}>
            <FeatureIcon source={FEATURE_ICONS.freeCoins} fallback={<Ionicons name="gift-outline" size={18} color={GOLD} />} size={44} />
            <Text style={styles.freeButtonText} numberOfLines={2}>Ücretsiz Coin Kazan</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MiniGames')}
            style={({ pressed }) => [styles.freeButton, pressed && styles.pressedFade]}
          >
            <FeatureIcon source={FEATURE_ICONS.miniGames} fallback={<Ionicons name="game-controller-outline" size={18} color={GOLD} />} size={44} />
            <Text style={styles.freeButtonText}>Mini Oyunlar</Text>
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {categories.map((category) => (
            <View key={category.key} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.grid}>
                {category.items.map((item) => (
                  <GridButton key={item.key} item={item} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </Animated.ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
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
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  freeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridButton: {
    width: '49.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 8,
  },
  gridButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  gridTextWrap: {
    flex: 1,
  },
  gridTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 10.5,
    lineHeight: 13,
    color: TEXT_MUTED,
  },
});
