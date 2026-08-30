import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import PopularDetailModal from '@/components/PopularDetailModal';
import quotesData from '@/data/kesfet_sozleri.json';
import allInfoCards from '@/data/bilgi_kosesi_kartlari.json';
import { type InfoCard, type InfoCategory } from '@/services/bilgiKosesiFeed';
import { getPopularFavorites, type PopularFavorite } from '@/services/popularFavorites';
import {
  GOLD,
  GOLD_SOFT,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

const QUOTE_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');
const PARCHMENT_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = NativeStackScreenProps<RootStackParamList, 'HaftaninSevilenleri'>;

const ALL_QUOTES: string[] = quotesData as string[];
const ALL_INFO_CARDS: InfoCard[] = allInfoCards as InfoCard[];
const MAX_ITEMS = 15;

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

// Pazartesi 08:00 (Türkiye saati / UTC+3) haftalık yenilenme seed hesabı
function getMonday8AmWeekSeed(): number {
  const now = new Date();
  const epochReference = 363600000; // Monday 05:00 UTC (08:00 TR)
  const oneWeekMs = 7 * 24 * 3600 * 1000;
  return Math.max(0, Math.floor((now.getTime() - epochReference) / oneWeekMs));
}

export default function HaftaninSevilenleriScreen({ navigation }: Props) {
  const [activeCategory, setActiveCategory] = useState<'sozler' | 'bilgiler'>('sozler');
  const [popularQuotes, setPopularQuotes] = useState<PopularFavorite[]>([]);
  const [popularInfo, setPopularInfo] = useState<PopularFavorite[]>([]);
  const [selectedPopular, setSelectedPopular] = useState<PopularFavorite | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Haftalık dönen 15 söz algoritması (Her Pazartesi 08:00'da değişir)
  const weeklyTopQuotes = useMemo(() => {
    const seed = getMonday8AmWeekSeed();
    const result: Array<{ rank: number; body: string; id: string }> = [];
    const step = 17;
    const offset = (seed * 23) % ALL_QUOTES.length;
    for (let i = 0; i < MAX_ITEMS; i++) {
      const idx = (offset + i * step) % ALL_QUOTES.length;
      result.push({
        rank: i + 1,
        body: ALL_QUOTES[idx],
        id: `weekly_quote_${seed}_${i}`,
      });
    }
    return result;
  }, []);

  // Haftalık dönen 15 bilgi algoritması (Her Pazartesi 08:00'da değişir)
  const weeklyTopInfo = useMemo(() => {
    const seed = getMonday8AmWeekSeed();
    const result: Array<{ rank: number; card: InfoCard }> = [];
    const step = 29;
    const offset = (seed * 31) % ALL_INFO_CARDS.length;
    for (let i = 0; i < MAX_ITEMS; i++) {
      const idx = (offset + i * step) % ALL_INFO_CARDS.length;
      result.push({
        rank: i + 1,
        card: ALL_INFO_CARDS[idx],
      });
    }
    return result;
  }, []);

  const loadData = useCallback(() => {
    getPopularFavorites().then((items) => {
      setPopularQuotes(items.filter((item) => item.kind === 'quote').slice(0, MAX_ITEMS));
      setPopularInfo(items.filter((item) => item.kind === 'info').slice(0, MAX_ITEMS));
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  return (
    <MysticTableBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[GOLD]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="flame" size={26} color="#EF4444" />
          <Text style={styles.headerTitle}>Haftanın En Sevilenleri</Text>
          <View style={styles.renewalBadge}>
            <Ionicons name="time-outline" size={13} color={GOLD_SOFT} />
            <Text style={styles.renewalBadgeText}>Her Pazartesi 08:00'da Yenilenir</Text>
          </View>
        </View>

        {/* 2 Kategori Geçiş Butonları: Sözler (15) & Bilgiler (15) */}
        <View style={styles.categorySwitchRow}>
          <Pressable
            onPress={() => setActiveCategory('sozler')}
            style={[
              styles.categorySwitchBtn,
              activeCategory === 'sozler' && styles.categorySwitchBtnActive,
            ]}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={activeCategory === 'sozler' ? '#1a0d33' : GOLD}
            />
            <Text
              style={[
                styles.categorySwitchText,
                activeCategory === 'sozler' && styles.categorySwitchTextActive,
              ]}
            >
              En Sevilen Sözler (15)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveCategory('bilgiler')}
            style={[
              styles.categorySwitchBtn,
              activeCategory === 'bilgiler' && styles.categorySwitchBtnActive,
            ]}
          >
            <MaterialCommunityIcons
              name="book-cross"
              size={17}
              color={activeCategory === 'bilgiler' ? '#1a0d33' : GOLD}
            />
            <Text
              style={[
                styles.categorySwitchText,
                activeCategory === 'bilgiler' && styles.categorySwitchTextActive,
              ]}
            >
              En Sevilen Bilgiler (15)
            </Text>
          </Pressable>
        </View>

        {/* KATEGORİ 1: HAFTANIN EN SEVİLEN 15 SÖZÜ */}
        {activeCategory === 'sozler' && (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Haftanın Zirvedeki 15 Mistik Sözü</Text>
            </View>

            <View style={styles.quotesFeed}>
              {weeklyTopQuotes.map((item) => (
                <ImageBackground
                  key={item.id}
                  source={QUOTE_CARD_BG}
                  style={styles.quoteCard}
                  imageStyle={styles.quoteCardImage}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={['rgba(11, 10, 31, 0.55)', 'rgba(11, 10, 31, 0.75)']}
                    style={styles.quoteScrim}
                    pointerEvents="none"
                  />
                  {/* Rank Badge */}
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>#{item.rank}</Text>
                  </View>
                  <FavoriteStarButton id={`quote:${item.body}`} kind="quote" body={item.body} />
                  <MaterialCommunityIcons
                    name="star-crescent"
                    size={16}
                    color={GOLD}
                    style={styles.quoteIcon}
                  />
                  <Text style={styles.quoteText}>{item.body}</Text>
                  <View style={styles.quoteShareRow}>
                    <ShareButton
                      text={`Mistik Rehber (Haftanın #${item.rank} Sözü)\n\n"${item.body}"`}
                      label="Paylaş"
                      style={styles.actionBtnStyle}
                      textStyle={styles.actionBtnTextStyle}
                    />
                    <ShareImageButton text={item.body} label="Görsel Paylaş" />
                  </View>
                </ImageBackground>
              ))}
            </View>
          </View>
        )}

        {/* KATEGORİ 2: HAFTANIN EN SEVİLEN 15 BİLGİSİ */}
        {activeCategory === 'bilgiler' && (
          <View style={styles.listSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Haftanın Zirvedeki 15 Kadim Bilgisi</Text>
            </View>

            <View style={styles.factsFeed}>
              {weeklyTopInfo.map((item) => (
                <ImageBackground
                  key={`top_info_${item.rank}`}
                  source={PARCHMENT_BG}
                  style={styles.factCard}
                  imageStyle={styles.factCardImage}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={['rgba(12, 10, 32, 0.62)', 'rgba(12, 10, 32, 0.82)']}
                    style={styles.factScrim}
                    pointerEvents="none"
                  />
                  <CornerTicks />
                  {/* Rank Badge */}
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>#{item.rank}</Text>
                  </View>
                  <View style={styles.factHeader}>
                    <View style={styles.factCategoryBadge}>
                      <MaterialCommunityIcons
                        name={CATEGORY_ICON[item.card.category] || 'information-outline'}
                        size={13}
                        color={GOLD}
                      />
                      <Text style={styles.factCategoryText}>{CATEGORY_LABEL[item.card.category] || 'BİLGİ'}</Text>
                    </View>
                    <FavoriteStarButton id={item.card.id} kind="info" body={item.card.body} title={item.card.title} />
                  </View>
                  <Text style={styles.factTitle}>{item.card.title}</Text>
                  <Text style={styles.factBody}>{item.card.body}</Text>
                  <View style={styles.factFooter}>
                    <ShareButton
                      text={`Mistik Rehber (Haftanın #${item.rank} Bilgisi) - ${item.card.title}\n\n${item.card.body}`}
                      label="Paylaş"
                      style={styles.actionBtnStyle}
                      textStyle={styles.actionBtnTextStyle}
                    />
                    <ShareImageButton text={`${item.card.title}\n\n${item.card.body}`} label="Görsel Paylaş" />
                  </View>
                </ImageBackground>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Popüler Detay Modalı */}
      {selectedPopular && (
        <PopularDetailModal item={selectedPopular} onClose={() => setSelectedPopular(null)} />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
  },
  renewalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  renewalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCA5A5',
    letterSpacing: 0.3,
  },
  categorySwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  categorySwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
  },
  categorySwitchBtnActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  categorySwitchText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  categorySwitchTextActive: {
    color: '#1a0d33',
    fontWeight: '900',
  },
  listSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: GOLD_SOFT,
    letterSpacing: 0.5,
  },
  quotesFeed: {
    gap: 14,
  },
  quoteCard: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  quoteCardImage: {
    borderRadius: 16,
  },
  quoteScrim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 5,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  quoteIcon: {
    position: 'absolute',
    top: 14,
    left: 48,
    opacity: 0.8,
  },
  quoteText: {
    fontSize: 16.5,
    lineHeight: 25,
    color: '#fff',
    fontWeight: '600',
    fontStyle: 'italic',
    paddingTop: 24,
    paddingBottom: 14,
    paddingHorizontal: 6,
  },
  quoteShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-end',
  },
  factsFeed: {
    gap: 14,
  },
  factCard: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 16,
    overflow: 'hidden',
  },
  factCardImage: {
    borderRadius: 16,
  },
  factScrim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 42,
  },
  factCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  factCategoryText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.4,
  },
  factTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  factBody: {
    fontSize: 15.5,
    lineHeight: 23,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 14,
  },
  factFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-end',
  },
  actionBtnStyle: {
    backgroundColor: 'rgba(242, 200, 121, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnTextStyle: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
  },
});
