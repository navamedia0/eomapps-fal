import { useEffect, useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ImageBackground, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList, TabScreenProps } from '@/navigation/types';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import FeatureIcon from '@/components/FeatureIcon';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import quotes from '@/data/kesfet_sozleri.json';
import { FEATURE_ICONS } from '@/assets/icons';
import { getPopularFavorites, type PopularFavorite } from '@/services/popularFavorites';
import { GOLD, GOLD_SOFT, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const QUOTE_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = TabScreenProps;

const QUOTES: string[] = quotes;

const FEATURES: Array<{
  key: keyof RootStackParamList;
  iconKey: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'Dice',
    iconKey: 'dice',
    title: 'Zar Falı',
    subtitle: 'Zarları at, şansına bak',
    icon: <MaterialCommunityIcons name="dice-multiple-outline" size={24} color={GOLD} />,
  },
  {
    key: 'Daisy',
    iconKey: 'daisy',
    title: 'Papatya Falı',
    subtitle: 'Seviyor mu, sevmiyor mu?',
    icon: <Ionicons name="flower-outline" size={22} color={GOLD} />,
  },
  {
    key: 'MagicBall',
    iconKey: 'magicBall',
    title: 'Sihirli Küre',
    subtitle: 'Evet ya da hayır? Küreye sor',
    icon: <MaterialCommunityIcons name="crystal-ball" size={24} color={GOLD} />,
  },
  {
    key: 'SuFal',
    iconKey: 'suFal',
    title: 'Su Falı',
    subtitle: 'Suya dokun, cevabını al',
    icon: <Ionicons name="water-outline" size={22} color={GOLD} />,
  },
  {
    key: 'AngelCard',
    iconKey: 'angelCard',
    title: 'Günün İlham Kartı',
    subtitle: 'Bugüne küçük bir mesaj',
    icon: <Ionicons name="rose-outline" size={22} color={GOLD} />,
  },
  {
    key: 'MoonCalendar',
    iconKey: 'moonCalendar',
    title: 'Ay Takvimi',
    subtitle: 'Bugün ayın hangi evresindeyiz?',
    icon: <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={GOLD} />,
  },
];

type FeedItem = { type: 'quote'; text: string } | { type: 'feature'; feature: (typeof FEATURES)[number] };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Day-of-year seeded rotation so the quote order (and which quotes lead)
// changes daily instead of always starting from index 0 — the same 150-item
// pool cycles through fully every ~150 days, and every user sees the same
// "today's" set (no per-device randomness to reconcile).
function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function buildFeed(): FeedItem[] {
  const offset = dayIndex() % QUOTES.length;
  const rotatedQuotes = [...QUOTES.slice(offset), ...QUOTES.slice(0, offset)];
  const feed: FeedItem[] = [];
  let featureCount = 0;
  for (let i = 0; i < rotatedQuotes.length; i += 1) {
    feed.push({ type: 'quote', text: rotatedQuotes[i] });
    if ((i + 1) % 3 === 0) {
      feed.push({ type: 'feature', feature: FEATURES[(featureCount + dayIndex()) % FEATURES.length] });
      featureCount += 1;
    }
  }
  return feed;
}

export default function KesfetScreen({ navigation }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const feed = useMemo(buildFeed, [todayKey()]);
  const [popular, setPopular] = useState<PopularFavorite[]>([]);

  useEffect(() => {
    getPopularFavorites().then(setPopular);
  }, []);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="compass-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Keşfet</Text>
        </View>
        <Text style={styles.refreshNote}>Her gün 00:00'da yenilenir</Text>

        {popular.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Ionicons name="flame-outline" size={16} color={GOLD} />
              <Text style={styles.popularTitle}>Haftanın En Sevilenleri</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
              {popular.map((item) => (
                <View key={item.id} style={styles.popularCard}>
                  {item.title && <Text style={styles.popularCardTitle}>{item.title}</Text>}
                  <Text style={styles.popularCardBody} numberOfLines={4}>
                    {item.body}
                  </Text>
                  <View style={styles.popularCountRow}>
                    <Ionicons name="star" size={11} color={GOLD} />
                    <Text style={styles.popularCount}>{item.count}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.feed}>
          {feed.map((item, index) => {
            if (item.type === 'quote') {
              return (
                <ImageBackground
                  key={index}
                  source={QUOTE_CARD_BG}
                  style={styles.quoteCard}
                  imageStyle={styles.quoteCardImage}
                  resizeMode="cover"
                >
                  {/* Dims whichever part of the mist background lands under the
                      text — the source image has both dark and bright (bokeh
                      flare) regions, and text needs to stay readable either way. */}
                  <LinearGradient
                    colors={['rgba(11, 10, 31, 0.55)', 'rgba(11, 10, 31, 0.72)']}
                    style={styles.quoteScrim}
                    pointerEvents="none"
                  />
                  <FavoriteStarButton id={`quote:${item.text}`} kind="quote" body={item.text} />
                  <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} style={styles.quoteIcon} />
                  <Text style={styles.quoteText}>{item.text}</Text>
                  <View style={styles.quoteShareRow}>
                    <ShareButton text={`Mistik Rehber\n\n"${item.text}"`} label="Paylaş" />
                    <ShareImageButton text={item.text} label="Görsel Paylaş" />
                  </View>
                </ImageBackground>
              );
            }
            const { feature } = item;
            return (
              <Pressable
                key={index}
                onPress={() => navigation.navigate(feature.key as any)}
                style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
              >
                <FeatureIcon source={FEATURE_ICONS[feature.iconKey]} fallback={feature.icon} size={78} />
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={GOLD} />
              </Pressable>
            );
          })}
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
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  refreshNote: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  popularSection: {
    marginBottom: 22,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  popularTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  popularRow: {
    gap: 12,
  },
  popularCard: {
    width: 180,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
  },
  popularCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  popularCardBody: {
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  popularCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  popularCount: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
  },
  feed: {
    gap: 14,
  },
  quoteCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
  },
  quoteCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  quoteScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  quoteIcon: {
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteShareRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  featureCardPressed: {
    opacity: 0.85,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
});
