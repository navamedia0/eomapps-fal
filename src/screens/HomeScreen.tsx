import { useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import { recordDailyOpen, type DailyOpenResult } from '@/services/streak';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CoinBadge from '@/components/CoinBadge';
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

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'AnaSayfa'>,
  NativeStackScreenProps<RootStackParamList>
>;

type GridItem = {
  key: string;
  title: string;
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
      <FeatureIcon source={FEATURE_ICONS[item.key]} fallback={item.icon} size={56} />
      <Text style={styles.gridTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [streak, setStreak] = useState(0);
  const [rewardBanner, setRewardBanner] = useState<DailyOpenResult | null>(null);

  useEffect(() => {
    recordDailyOpen().then((info) => {
      setStreak(info.streak);
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
          icon: <MaterialCommunityIcons name="coffee" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ImageReading', { kind: 'coffee' }),
        },
        {
          key: 'tarot',
          title: 'Tarot Falı',
          icon: <MaterialCommunityIcons name="cards" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('TarotSpread'),
        },
        {
          key: 'palm',
          title: 'El Falı',
          icon: <MaterialCommunityIcons name="hand-back-right-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ImageReading', { kind: 'palm' }),
        },
        {
          key: 'katina',
          title: 'Katina Falı',
          icon: <MaterialCommunityIcons name="cards-playing-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Katina'),
        },
        {
          key: 'voiceReading',
          title: 'Sesli Fal',
          icon: <Ionicons name="mic-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('VoiceReading'),
        },
        {
          key: 'solitaire',
          title: 'Solitaire Falı',
          icon: <MaterialCommunityIcons name="cards-club-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Solitaire'),
        },
        {
          key: 'daisy',
          title: 'Papatya Falı',
          icon: <Ionicons name="flower-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('Daisy'),
        },
        {
          key: 'dice',
          title: 'Zar Falı',
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
          icon: <Ionicons name="moon" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('DreamChat'),
        },
        {
          key: 'dreamLibrary',
          title: 'Rüya Kitaplığı',
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
          icon: <MaterialCommunityIcons name="zodiac-leo" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Zodiac'),
        },
        {
          key: 'zodiacTraits',
          title: 'Burç Özellikleri',
          icon: <MaterialCommunityIcons name="star-circle-outline" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('ZodiacTraits'),
        },
        {
          key: 'compatibility',
          title: 'Burç Uyumu',
          icon: <Ionicons name="heart-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('Compatibility'),
        },
        {
          key: 'birthChart',
          title: 'Doğum Haritası',
          icon: <MaterialCommunityIcons name="chart-donut" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('BirthChart'),
        },
        {
          key: 'risingSign',
          title: 'Yükselen Burcum',
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
          icon: <MaterialCommunityIcons name="numeric" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Numerology'),
        },
        {
          key: 'biorhythm',
          title: 'Biyoritim',
          icon: <MaterialCommunityIcons name="waveform" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Biorhythm'),
        },
        {
          key: 'moonCalendar',
          title: 'Ay Takvimi',
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
          key: 'mindfulness',
          title: 'Farkındalık',
          icon: <MaterialCommunityIcons name="leaf" size={26} color={GOLD} />,
          onPress: () => navigation.navigate('Mindfulness'),
        },
        {
          key: 'angelCard',
          title: 'Günün İlham Kartı',
          icon: <Ionicons name="rose-outline" size={24} color={GOLD} />,
          onPress: () => navigation.navigate('AngelCard'),
        },
      ],
    },
  ];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <CoinBadge navigation={navigation} />
        </View>

        <View style={styles.header}>
          <Ionicons name="sparkles" size={20} color={GOLD} style={styles.sparkle} />
          <Text style={styles.headerTitle}>Mistik Rehber</Text>
          <Ionicons name="sparkles" size={20} color={GOLD} style={styles.sparkle} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.headerCaption}>Kaderin kapılarını aralayın</Text>

        {streak > 1 && (
          <Pressable onPress={goToTasks} style={({ pressed }) => [styles.streakBadge, pressed && styles.pressedFade]}>
            <Ionicons name="flame" size={14} color={GOLD} />
            <Text style={styles.streakBadgeText}>{streak} günlük seri</Text>
          </Pressable>
        )}

        {rewardBanner && (
          <Pressable onPress={goToTasks} style={({ pressed }) => [styles.rewardBanner, pressed && styles.pressedFade]}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setRewardBanner(null);
              }}
              style={styles.rewardCloseButton}
              hitSlop={8}
            >
              <Ionicons name="close" size={16} color={TEXT_MUTED} />
            </Pressable>
            <Ionicons name="flame" size={22} color={GOLD} />
            <Text style={styles.rewardTitle}>{rewardBanner.streak} Günlük Seri!</Text>
            <Text style={styles.rewardText}>
              {rewardBanner.rewardCredits > 0
                ? `Sadakatin için +${rewardBanner.rewardCredits} bonus kredi kazandın ✨`
                : 'Her gün gel, seriler büyüdükçe bonus kredi kazanırsın.'}
            </Text>
            <View style={styles.rewardCta}>
              <Ionicons name="videocam-outline" size={13} color={GOLD} />
              <Text style={styles.rewardCtaText}>Görevlere göz at</Text>
              <Ionicons name="chevron-forward" size={13} color={GOLD} />
            </View>
          </Pressable>
        )}

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
      </ScrollView>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 8,
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  streakBadgeText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
  },
  rewardBanner: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rewardCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  rewardText: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  rewardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  rewardCtaText: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '700',
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
    gap: 12,
  },
  gridButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  gridButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  gridTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 14,
  },
});
