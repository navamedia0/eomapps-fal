import { useEffect, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { TabScreenProps } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import FeatureIcon from '@/components/FeatureIcon';
import PopularDetailModal from '@/components/PopularDetailModal';
import { FEATURE_ICONS } from '@/assets/icons';
import { getDailyInfoCards, type InfoCard, type InfoCategory } from '@/services/bilgiKosesiFeed';
import { getPopularFavorites, type PopularFavorite } from '@/services/popularFavorites';
import { GOLD, GOLD_SOFT, INFO_PURPLE, INFO_PURPLE_SOFT, INFO_CREAM, INFO_MUTED, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = TabScreenProps;

const ITEMS: Array<{
  key: string;
  title: string;
  subtitle: string;
  iconKey?: string;
  icon: React.ReactNode;
  onPress: (navigation: Props['navigation']) => void;
}> = [
  {
    key: 'iskambil',
    title: 'İskambil Kartları ve Anlamları',
    subtitle: '52 kartın geleneksel fal anlamlarını keşfet',
    iconKey: 'kartlarBadge',
    icon: <MaterialCommunityIcons name="cards-playing-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('KartAnlamlari', { deck: 'iskambil' }),
  },
  {
    key: 'tarot',
    title: 'Tarot Kartları ve Anlamları',
    subtitle: '78 kartlık Rider-Waite destesinin tam rehberi',
    iconKey: 'tarot',
    icon: <MaterialCommunityIcons name="cards-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('KartAnlamlari', { deck: 'tarot' }),
  },
  {
    key: 'kahve',
    title: 'Kahve Falı Ne Zaman Bulundu?',
    subtitle: 'Osmanlı\'dan günümüze kahve falının hikayesi',
    iconKey: 'coffee',
    icon: <MaterialCommunityIcons name="coffee-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'kahve_tarihi' }),
  },
  {
    key: 'katina',
    title: 'Katina Falı Nedir?',
    subtitle: 'İskambil kartlarıyla fal bakma geleneği',
    iconKey: 'katina',
    icon: <MaterialCommunityIcons name="cards-club-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'katina_nedir' }),
  },
  {
    key: 'burc',
    title: 'Burçların Kökeni ve 4 Element',
    subtitle: 'Zodyağın Babil\'den günümüze yolculuğu',
    iconKey: 'burclarBadge',
    icon: <MaterialCommunityIcons name="zodiac-leo" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'burc_kokeni' }),
  },
];

const CATEGORY_ICON: Record<InfoCategory, keyof typeof MaterialCommunityIcons.glyphMap> = {
  burc: 'zodiac-leo',
  kart: 'cards-playing-outline',
  astroloji: 'telescope',
  tarot: 'cards-outline',
};

const CATEGORY_LABEL: Record<InfoCategory, string> = {
  burc: 'BURÇLAR',
  kart: 'KARTLAR',
  astroloji: 'ASTROLOJİ',
  tarot: 'TAROT',
};

type FeedItem = { type: 'topic'; item: (typeof ITEMS)[number] } | { type: 'fact'; card: InfoCard };

export default function BilgiKosesiScreen({ navigation }: Props) {
  const [facts, setFacts] = useState<InfoCard[]>([]);
  const [popular, setPopular] = useState<PopularFavorite[]>([]);
  const [selectedPopular, setSelectedPopular] = useState<PopularFavorite | null>(null);

  useEffect(() => {
    getDailyInfoCards().then(setFacts);
    getPopularFavorites().then((items) => {
      // Sadece Bilgi Köşesi (info) favorileri bu ekranda listelenir
      setPopular(items.filter((item) => item.kind === 'info' || item.id.startsWith('info:')));
    });
  }, []);

  const feed: FeedItem[] = [];
  let topicCount = 0;
  facts.forEach((card, index) => {
    feed.push({ type: 'fact', card });
    if ((index + 1) % 3 === 0 && topicCount < ITEMS.length) {
      feed.push({ type: 'topic', item: ITEMS[topicCount] });
      topicCount += 1;
    }
  });
  while (topicCount < ITEMS.length) {
    feed.push({ type: 'topic', item: ITEMS[topicCount] });
    topicCount += 1;
  }

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="star-crescent" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Bilgi Köşesi</Text>
          <Text style={styles.headerSubtitle}>Bunları biliyor muydunuz?</Text>
          <Text style={styles.refreshNote}>Her Pazartesi saat 08:00'de yenilenir</Text>
        </View>

        {/* Bilgi Köşesi - Haftanın En Sevilenleri */}
        {popular.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Ionicons name="flame-outline" size={16} color={GOLD} />
              <Text style={styles.popularTitle}>Haftanın En Sevilenleri</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
              {popular.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedPopular(item)}
                  style={({ pressed }) => [styles.popularCard, pressed && styles.popularCardPressed]}
                >
                  {item.title ? (
                    <Text style={styles.popularCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  ) : null}
                  <Text style={styles.popularCardBody} numberOfLines={4}>
                    {item.body}
                  </Text>
                  <View style={styles.popularCountRow}>
                    <Ionicons name="star" size={11} color={GOLD} />
                    <Text style={styles.popularCount}>{item.count}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.list}>
          {feed.map((entry, index) => {
            if (entry.type === 'topic') {
              const item = entry.item;
              return (
                <Pressable
                  key={`topic-${item.key}`}
                  onPress={() => item.onPress(navigation)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <CornerTicks />
                  <FeatureIcon source={item.iconKey ? FEATURE_ICONS[item.iconKey] : undefined} fallback={item.icon} size={70} />
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={INFO_CREAM} />
                </Pressable>
              );
            }
            const { card } = entry;
            return (
              <View key={`fact-${card.id}-${index}`} style={styles.factCard}>
                <CornerTicks />
                <FavoriteStarButton
                  id={`info:${card.id}`}
                  kind="info"
                  title={card.title}
                  body={card.body}
                  category={card.category}
                />
                <View style={styles.factHeader}>
                  <MaterialCommunityIcons name={CATEGORY_ICON[card.category]} size={16} color={GOLD} />
                  <Text style={styles.factCategory}>{CATEGORY_LABEL[card.category]}</Text>
                </View>
                <Text style={styles.factTitle}>{card.title}</Text>
                <Text style={styles.factBody}>{card.body}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <PopularDetailModal item={selectedPopular} onClose={() => setSelectedPopular(null)} />
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
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: INFO_MUTED,
    fontStyle: 'italic',
  },
  refreshNote: {
    fontSize: 11,
    color: INFO_MUTED,
    marginTop: 4,
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
    width: 190,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 14,
  },
  popularCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  popularCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: INFO_CREAM,
    marginBottom: 4,
  },
  popularCardBody: {
    fontSize: 11.5,
    lineHeight: 16,
    color: INFO_MUTED,
    fontStyle: 'italic',
  },
  popularCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  popularCount: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '600',
  },
  list: {
    gap: 14,
  },
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: INFO_PURPLE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: INFO_PURPLE_SOFT,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: INFO_CREAM,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: INFO_MUTED,
    lineHeight: 16,
  },
  factCard: {
    position: 'relative',
    backgroundColor: 'rgba(245, 240, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: INFO_PURPLE_SOFT,
    padding: 16,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  factCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
  factTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: INFO_CREAM,
    marginBottom: 4,
  },
  factBody: {
    fontSize: 12,
    lineHeight: 18,
    color: INFO_MUTED,
  },
});
