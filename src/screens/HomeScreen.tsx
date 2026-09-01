import React, { useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '@/navigation/types';
import { getCheckinStatus, type CheckinStatus } from '@/services/streak';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import SozlerKoskuDrawerModal from '@/components/SozlerKoskuDrawerModal';
import FortuneShelf, { type ShelfItem } from '@/components/home/FortuneShelf';
import SoulOrbHero from '@/components/home/SoulOrbHero';
import PsychologyTestsModal from '@/components/psychology/PsychologyTestsModal';
import TarotModeSelectionModal from '@/components/tarot/TarotModeSelectionModal';
import RuneModeSelectionModal from '@/components/runes/RuneModeSelectionModal';
import { ALL_SIGNATURE_FORTUNES } from '@/constants/allFortunesData';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

type DiscoverTile = {
  key: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

export default function HomeScreen({ navigation }: Props) {
  const [checkinInfo, setCheckinInfo] = useState<CheckinStatus | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [psychologyModalVisible, setPsychologyModalVisible] = useState(false);
  const [tarotModalVisible, setTarotModalVisible] = useState(false);
  const [runeModalVisible, setRuneModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCheckinStatus().then(setCheckinInfo);
  }, []);

  const goToTasks = () => navigation.navigate('Tasks');

  const fallarItems: ShelfItem[] = ALL_SIGNATURE_FORTUNES.map((item) => ({
    key: item.key,
    title: item.title,
    imageSource: item.imageSource,
    onPress: () => {
      if (item.key === 'tarot') {
        setTarotModalVisible(true);
        return;
      }
      if (item.key === 'rune') {
        setRuneModalVisible(true);
        return;
      }
      if (item.route) {
        // @ts-expect-error — allFortunesData rota adlarını jenerik string tutuyor
        navigation.navigate(item.route, item.params);
      }
    },
  }));

  const discoverTiles: DiscoverTile[] = [
    {
      key: 'shop',
      title: 'Sosyal Mağaza',
      subtitle: 'Çerçeve & rozetler',
      iconName: 'cart-outline',
      onPress: () => navigation.navigate('Shop'),
    },
    {
      key: 'oyunMerkezi',
      title: 'Oyun Merkezi',
      subtitle: 'Yakında yeni oyunlar',
      iconName: 'controller-classic-outline',
      onPress: () => navigation.navigate('OyunMerkezi'),
    },
    {
      key: 'popularity',
      title: 'Haftalık Popülerlik',
      subtitle: 'CP liderlik tablosu',
      iconName: 'trophy-outline',
      onPress: () => navigation.navigate('Popularity'),
    },
    {
      key: 'achievements',
      title: 'Madalyalarım',
      subtitle: 'Başarımlar koleksiyonu',
      iconName: 'medal-outline',
      onPress: () => navigation.navigate('Achievements'),
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
        <SoulOrbHero />

        <View style={styles.header}>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} style={styles.sparkle} />
          <Text style={styles.headerTitle}>Mistik Rehber</Text>
          <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} style={styles.sparkle} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.headerCaption}>Kişisel Ruhsal Yaşam ve Keşif Platformu</Text>

        {checkinInfo && !checkinInfo.isClaimedToday && (
          <Pressable onPress={goToTasks}>
            <Text style={styles.rewardToast}>
              Bugünkü yoklamanı yap, +{checkinInfo.todayRewardCoins} coin kazan! ({checkinInfo.dayInWeek}. gün) 📅
            </Text>
          </Pressable>
        )}

        <View style={styles.quickRow}>
          <Pressable onPress={goToTasks} style={({ pressed }) => [styles.quickCard, pressed && styles.pressedFade]}>
            <FeatureIcon fallback={<Ionicons name="gift-outline" size={24} color={GOLD} />} size={44} />
            <Text style={styles.quickTitle} numberOfLines={2}>Ücretsiz Coin Kazan</Text>
            <View style={styles.quickPill}>
              <Text style={styles.quickPillText}>Başlat</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MiniGames')}
            style={({ pressed }) => [styles.quickCard, pressed && styles.pressedFade]}
          >
            <FeatureIcon fallback={<Ionicons name="game-controller-outline" size={24} color={GOLD} />} size={44} />
            <Text style={styles.quickTitle} numberOfLines={2}>Mini Oyunlar</Text>
            <View style={styles.quickPill}>
              <Text style={styles.quickPillText}>Keşfet</Text>
            </View>
          </Pressable>
        </View>

        <FortuneShelf
          title="Tüm Fal Çeşitleri"
          badgeText="Tümünü Gör"
          onSeeAllPress={() => navigation.navigate('TumFallar')}
          items={fallarItems}
        />

        <FortuneShelf
          title="Psikolojik & Kişilik Testleri"
          badgeText="Tümünü Gör"
          onSeeAllPress={() => setPsychologyModalVisible(true)}
          items={[
            {
              key: 'psychology',
              title: 'Aşk Bağlanma Stili, 16 Kişilik, Gölge Benlik',
              imageSource: require('@/assets/ekoller/ekol_bg_4_bati_ezoterik.jpg'),
              onPress: () => setPsychologyModalVisible(true),
            },
          ]}
        />

        <FortuneShelf
          title="Rüya Yorumu & Tabir"
          badgeText="Tümünü Gör"
          onSeeAllPress={() => navigation.navigate('RuyaKitapligi')}
          items={[
            {
              key: 'dreamChat',
              title: 'Rüya Yorumlama',
              imageSource: require('@/assets/ekoller/ekol_bg_5_ruya.jpg'),
              onPress: () => navigation.navigate('DreamChat'),
            },
            {
              key: 'dreamLibrary',
              title: 'Rüya Kitaplığı',
              iconName: 'book-outline',
              onPress: () => navigation.navigate('RuyaKitapligi'),
            },
          ]}
        />

        <FortuneShelf
          title="Burç ve Astroloji"
          badgeText="Tümünü Gör"
          onSeeAllPress={() => navigation.navigate('Zodiac')}
          items={[
            {
              key: 'zodiac',
              title: 'Günlük Burç',
              imageSource: require('@/assets/backgrounds/decks/angel_bg.jpg'),
              onPress: () => navigation.navigate('Zodiac'),
            },
            {
              key: 'birthChart',
              title: 'Doğum Haritası',
              iconName: 'chart-donut',
              onPress: () => navigation.navigate('BirthChart'),
            },
            {
              key: 'risingSign',
              title: 'Yükselen Burcum',
              iconName: 'flash-outline',
              onPress: () => navigation.navigate('RisingSign'),
            },
            {
              key: 'compatibility',
              title: 'Burç Uyumu',
              iconName: 'heart-outline',
              onPress: () => navigation.navigate('Compatibility'),
            },
            {
              key: 'zodiacTraits',
              title: 'Burç Özellikleri',
              iconName: 'star-circle-outline',
              onPress: () => navigation.navigate('ZodiacTraits'),
            },
          ]}
        />

        <FortuneShelf
          title="Sayılar & Enerji Haritası"
          badgeText="Tümünü Gör"
          onSeeAllPress={() => navigation.navigate('MatrixOfDestiny')}
          items={[
            {
              key: 'matrix',
              title: 'Kader Matrisi',
              imageSource: require('@/assets/ekoller/ekol_bg_1_cin.jpg'),
              onPress: () => navigation.navigate('MatrixOfDestiny'),
            },
            {
              key: 'numerology',
              title: 'Numeroloji',
              iconName: 'numeric',
              onPress: () => navigation.navigate('Numerology'),
            },
            {
              key: 'biorhythm',
              title: 'Biyoritim',
              iconName: 'waveform',
              onPress: () => navigation.navigate('Biorhythm'),
            },
            {
              key: 'moonCalendar',
              title: 'Ay Takvimi',
              iconName: 'moon-waning-crescent',
              onPress: () => navigation.navigate('MoonCalendar'),
            },
            {
              key: 'celticTree',
              title: 'Kelt Ağacı',
              iconName: 'tree-outline',
              onPress: () => navigation.navigate('CelticTreeReading'),
            },
            {
              key: 'aura',
              title: 'Çakra & Aura',
              iconName: 'circle-multiple-outline',
              onPress: () => navigation.navigate('AuraEnergy'),
            },
          ]}
        />

        <FortuneShelf
          title="Ruhsal Denge & İç Huzur"
          badgeText="Tümünü Gör"
          onSeeAllPress={() => navigation.navigate('MoodJournal')}
          items={[
            {
              key: 'breathing',
              title: 'Nefes Egzersizi',
              imageSource: require('@/assets/backgrounds/decks/osho_zen_bg.jpg'),
              onPress: () => navigation.navigate('BreathingExercise'),
            },
            {
              key: 'angelCard',
              title: 'Günün İlham Kartı',
              iconName: 'flower-outline',
              onPress: () => navigation.navigate('AngelCard'),
            },
            {
              key: 'affirmation',
              title: 'Günlük Olumlama',
              iconName: 'white-balance-sunny',
              onPress: () => navigation.navigate('Affirmation'),
            },
            {
              key: 'moodJournal',
              title: 'Duygu Günlüğü',
              iconName: 'book-outline',
              onPress: () => navigation.navigate('MoodJournal'),
            },
            {
              key: 'magicBall',
              title: 'Sihirli Küre',
              iconName: 'crystal-ball',
              onPress: () => navigation.navigate('MagicBall'),
            },
          ]}
        />

        <Text style={styles.discoverTitle}>Keşfet</Text>
        <View style={styles.discoverGrid}>
          {discoverTiles.map((tile) => (
            <Pressable
              key={tile.key}
              onPress={tile.onPress}
              style={({ pressed }) => [styles.discoverTile, pressed && styles.pressedFade]}
            >
              <View style={styles.discoverIconWrap}>
                <MaterialCommunityIcons name={tile.iconName} size={20} color={GOLD} />
              </View>
              <View style={styles.discoverTextWrap}>
                <Text style={styles.discoverTileTitle} numberOfLines={1}>{tile.title}</Text>
                <Text style={styles.discoverTileSubtitle} numberOfLines={1}>{tile.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Tarot 3'lü Mod Birleştirme Modalı */}
      <TarotModeSelectionModal
        visible={tarotModalVisible}
        onClose={() => setTarotModalVisible(false)}
        onSelectRelationshipSpread={() =>
          navigation.navigate('CardDeckTable', { deckId: 'tarot', initialMode: 'relationship' })
        }
        onSelectQuickSpread={() => navigation.navigate('TarotSpread')}
        onSelectDeckTable={() =>
          navigation.navigate('CardDeckTable', { deckId: 'tarot', initialMode: 'self' })
        }
      />

      {/* Nordik Rün 2'li Mod Birleştirme Modalı */}
      <RuneModeSelectionModal
        visible={runeModalVisible}
        onClose={() => setRuneModalVisible(false)}
        onSelectClothReading={() => navigation.navigate('RuneReading')}
        onSelectTableReading={() =>
          navigation.navigate('CardDeckTable', { deckId: 'rune', initialMode: 'self' })
        }
      />

      {/* Psikolojik Testler Açılır Modalı */}
      <PsychologyTestsModal
        visible={psychologyModalVisible}
        onClose={() => setPsychologyModalVisible(false)}
        navigation={navigation}
      />

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
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  hamburgerButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 48,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  headerDivider: {
    width: 48,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignSelf: 'center',
    marginVertical: 4,
    borderRadius: 1,
  },
  headerCaption: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 12,
  },
  sparkle: {
    opacity: 0.9,
  },
  rewardToast: {
    textAlign: 'center',
    fontSize: 12,
    color: GOLD,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 8,
  },
  quickTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 16,
  },
  quickPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  pressedFade: {
    opacity: 0.85,
  },
  discoverTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  discoverTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    padding: 12,
  },
  discoverIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 201, 60, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverTextWrap: {
    flex: 1,
  },
  discoverTileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  discoverTileSubtitle: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginTop: 1,
  },
});
