import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import PopularDetailModal from '@/components/PopularDetailModal';
import quotesData from '@/data/kesfet_sozleri.json';
import { getPopularFavorites, type PopularFavorite } from '@/services/popularFavorites';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

const QUOTE_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = NativeStackScreenProps<RootStackParamList, 'SozlerKosku'>;

const ALL_QUOTES: string[] = quotesData as string[];
const PAGE_SIZE = 25;
const POPULAR_LIMIT = 15;

export default function SozlerKoskuScreen({ navigation }: Props) {
  const [quotePage, setQuotePage] = useState(1);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [popularQuotes, setPopularQuotes] = useState<PopularFavorite[]>([]);
  const [selectedPopular, setSelectedPopular] = useState<PopularFavorite | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Günlük dönen 365 günlük söz havuzu algoritması
  const dailyRotatedQuotes = useMemo(() => {
    if (ALL_QUOTES.length === 0) return [];
    const now = new Date();
    const epochMs = now.getTime() + 3 * 3600 * 1000 - 8 * 3600 * 1000;
    const period = Math.floor(epochMs / (24 * 3600 * 1000));
    const offset = (period * 37) % ALL_QUOTES.length;
    return [...ALL_QUOTES.slice(offset), ...ALL_QUOTES.slice(0, offset)];
  }, []);

  // Filtrelenmiş sözler
  const filteredQuotes = useMemo(() => {
    let list = dailyRotatedQuotes;
    if (quoteSearch.trim()) {
      const q = quoteSearch.toLowerCase().trim();
      list = list.filter((item) => item.toLowerCase().includes(q));
    }
    return list;
  }, [dailyRotatedQuotes, quoteSearch]);

  const visibleQuotes = useMemo(() => {
    return filteredQuotes.slice(0, quotePage * PAGE_SIZE);
  }, [filteredQuotes, quotePage]);

  const loadData = useCallback(() => {
    getPopularFavorites().then((items) => {
      const quotes = items
        .filter((item) => item.kind === 'quote' || item.id.startsWith('quote:'))
        .slice(0, POPULAR_LIMIT);
      setPopularQuotes(quotes);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setQuotePage(1);
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
          <Ionicons name="sparkles" size={24} color={GOLD} />
          <Text style={styles.headerTitle}>Sözler Köşkü</Text>
          <Text style={styles.headerSubtitle}>Ruhunu Aydınlatan Kadim & Anlamlı Sözler</Text>
        </View>

        {/* 15 POPÜLER SÖZ BÖLÜMÜ */}
        {popularQuotes.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Ionicons name="flame" size={18} color="#EF4444" />
              <Text style={styles.popularTitle}>Haftanın En Sevilen 15 Mistik Sözü</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularRow}
            >
              {popularQuotes.map((item, idx) => (
                <Pressable
                  key={item.id || idx}
                  onPress={() => setSelectedPopular(item)}
                  style={({ pressed }) => [styles.popularCard, pressed && styles.popularCardPressed]}
                >
                  <View style={styles.popularRankBadge}>
                    <Text style={styles.popularRankText}>#{idx + 1}</Text>
                  </View>
                  <Text style={styles.popularCardBody} numberOfLines={4}>
                    "{item.body}"
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Arama Çubuğu */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={17} color={GOLD_SOFT} />
          <TextInput
            value={quoteSearch}
            onChangeText={(t) => {
              setQuoteSearch(t);
              setQuotePage(1);
            }}
            placeholder="Mistik sözlerde ara..."
            placeholderTextColor={TEXT_MUTED}
            style={styles.searchInput}
          />
          {quoteSearch ? (
            <Pressable onPress={() => setQuoteSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={GOLD_SOFT} />
            </Pressable>
          ) : null}
        </View>

        {/* Akış Başlığı */}
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={16} color={GOLD} />
          <Text style={styles.sectionTitle}>
            365 Günlük Söz Havuzu ({filteredQuotes.length})
          </Text>
        </View>

        {/* 365 Günlük Sözler Akışı */}
        <View style={styles.quotesFeed}>
          {visibleQuotes.map((quoteText, index) => (
            <ImageBackground
              key={`quote-${index}`}
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
              <FavoriteStarButton id={`quote:${quoteText}`} kind="quote" body={quoteText} />
              <MaterialCommunityIcons
                name="star-crescent"
                size={16}
                color={GOLD}
                style={styles.quoteIcon}
              />
              <Text style={styles.quoteText}>{quoteText}</Text>
              <View style={styles.quoteShareRow}>
                <ShareButton text={`Mistik Rehber\n\n"${quoteText}"`} label="Paylaş" />
                <ShareImageButton text={quoteText} label="Görsel Paylaş" />
              </View>
            </ImageBackground>
          ))}
        </View>

        {/* Daha Fazla Yükle Butonu */}
        {visibleQuotes.length < filteredQuotes.length && (
          <Pressable
            onPress={() => setQuotePage((p) => p + 1)}
            style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.loadMoreBtnPressed]}
          >
            <Ionicons name="chevron-down-circle-outline" size={18} color={GOLD} />
            <Text style={styles.loadMoreBtnText}>
              Daha Fazla Söz Göster ({filteredQuotes.length - visibleQuotes.length} Kalan)
            </Text>
          </Pressable>
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
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  popularSection: {
    marginBottom: 16,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  popularTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FCA5A5',
    letterSpacing: 0.4,
  },
  popularRow: {
    gap: 10,
    paddingRight: 10,
  },
  popularCard: {
    width: 220,
    minHeight: 90,
    backgroundColor: 'rgba(38, 20, 54, 0.95)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 12,
    justifyContent: 'center',
  },
  popularCardPressed: {
    opacity: 0.85,
  },
  popularRankBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  popularRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  popularCardBody: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#FFF',
    fontStyle: 'italic',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
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
  quoteIcon: {
    position: 'absolute',
    top: 14,
    left: 14,
    opacity: 0.8,
  },
  quoteText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#fff',
    fontWeight: '600',
    fontStyle: 'italic',
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 6,
  },
  quoteShareRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-end',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  loadMoreBtnPressed: {
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
  },
});
