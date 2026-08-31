import React, { useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '@/navigation/types';
import { getCheckinStatus, type CheckinStatus } from '@/services/streak';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import SozlerKoskuDrawerModal from '@/components/SozlerKoskuDrawerModal';
import CompactCategoryCard from '@/components/fortune/CompactCategoryCard';
import PsychologyTestsModal from '@/components/psychology/PsychologyTestsModal';
import { FEATURE_ICONS } from '@/assets/icons';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

const UST_BANNER = require('@/assets/icons/ust_banner.png');

type Props = TabScreenProps;

export default function HomeScreen({ navigation }: Props) {
  const [checkinInfo, setCheckinInfo] = useState<CheckinStatus | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [psychologyModalVisible, setPsychologyModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCheckinStatus().then(setCheckinInfo);
  }, []);

  const goToTasks = () => navigation.navigate('Tasks');

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
        <Text style={styles.headerCaption}>Kişisel Ruhsal Yaşam ve Keşif Platformu</Text>

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

        {/* 6 ANA YAŞAM & KEŞİF BÖLÜMÜ (KOMPAKT İMZA KARTLARI) */}
        <View style={styles.categoryContainer}>
          {/* 1. Tüm Fal Çeşitleri */}
          <CompactCategoryCard
            title="Tüm Fal Çeşitleri"
            subtitle="17 Kadim Fal · 3 Modlu Tarot, Katina & Deste Masası"
            tags={['17 Fal Çeşidi', '3 Modlu Tarot', 'Fotoğraflı & Canlı']}
            accent="#F59E0B"
            iconName="cards-playing-outline"
            badgeText="17 Mistik Ekol"
            imageSource={require('@/assets/backgrounds/decks/tarot_bg.jpg')}
            onPress={() => navigation.navigate('TumFallar')}
          />

          {/* 2. Psikolojik Testler */}
          <CompactCategoryCard
            title="Psikolojik & Kişilik Testleri"
            subtitle="Aşk Bağlanma Stili, 16 Kişilik, Gölge Benlik & Ruh Yaşı"
            tags={['Bağlanma Stili', '16 Kişilik', 'Gölge Arketip']}
            accent="#A855F7"
            iconName="brain"
            badgeText="Kendini Keşfet"
            imageSource={require('@/assets/ekoller/ekol_bg_4_bati_ezoterik.jpg')}
            onPress={() => setPsychologyModalVisible(true)}
          />

          {/* 3. Rüya Yorumlama */}
          <CompactCategoryCard
            title="Rüya Yorumu & Tabir"
            subtitle="Rüyanı Yaz veya Anlat · Bilinçaltı Sembolleri & Rüya Kitaplığı"
            tags={['Rüya Yorumu', 'Rüya Kitaplığı', 'Bilinçaltı']}
            accent="#6366F1"
            iconName="moon-waning-crescent"
            badgeText="Bilinçaltı Aynası"
            imageSource={require('@/assets/ekoller/ekol_bg_5_ruya.jpg')}
            onPress={() => navigation.navigate('DreamChat')}
          />

          {/* 4. Burç ve Astroloji */}
          <CompactCategoryCard
            title="Burç ve Astroloji"
            subtitle="Günlük Burç, Kişiye Özel Doğum Haritası, Yükselen & Sinastri"
            tags={['Günlük Burç', 'Doğum Haritası', 'Burç Uyumu']}
            accent="#EC4899"
            iconName="zodiac-leo"
            badgeText="Kozmik Harita"
            imageSource={require('@/assets/backgrounds/decks/angel_bg.jpg')}
            onPress={() => navigation.navigate('Zodiac')}
          />

          {/* 5. Sayılar ve Enerji */}
          <CompactCategoryCard
            title="Sayılar & Enerji Haritası"
            subtitle="Kader Matrisi, Numeroloji, Kelt Ağacı, Çakra & Aura Taraması"
            tags={['Kader Matrisi', 'Numeroloji', 'Çakra & Aura']}
            accent="#06B6D4"
            iconName="matrix"
            badgeText="Kader Şifresi"
            imageSource={require('@/assets/ekoller/ekol_bg_1_cin.jpg')}
            onPress={() => navigation.navigate('MatrixOfDestiny')}
          />

          {/* 6. Ruhsal Denge & İç Huzur */}
          <CompactCategoryCard
            title="Ruhsal Denge & İç Huzur"
            subtitle="4-7-8 Nefes Egzersizi, Günlük Olumlamalar, Biyoritim & Şifa"
            tags={['Nefes Egzersizi', 'Olumlama', 'Biyoritim']}
            accent="#10B981"
            iconName="meditation"
            badgeText="İç Huzur"
            imageSource={require('@/assets/backgrounds/decks/osho_zen_bg.jpg')}
            onPress={() => navigation.navigate('BreathingExercise')}
          />
        </View>
      </Animated.ScrollView>

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
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 48,
    paddingHorizontal: 14,
  },
  banner: {
    width: '100%',
    height: 90,
    borderRadius: 16,
    marginBottom: 10,
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
    backgroundColor: GOLD_SOFT,
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
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontWeight: '700',
  },
  freeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  freeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  freeButtonText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 15,
  },
  pressedFade: {
    opacity: 0.85,
  },
  categoryContainer: {
    gap: 2,
  },
});
