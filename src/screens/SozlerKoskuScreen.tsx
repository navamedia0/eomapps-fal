import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { getDailyInfoCards, type InfoCard, type InfoCategory } from '@/services/bilgiKosesiFeed';
import { getPopularFavorites, type PopularFavorite } from '@/services/popularFavorites';
import {
  GOLD,
  GOLD_SOFT,
  INFO_PURPLE,
  INFO_PURPLE_SOFT,
  INFO_CREAM,
  INFO_MUTED,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

const QUOTE_CARD_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = NativeStackScreenProps<RootStackParamList, 'SozlerKosku'>;
type SozlerKoskuTab = 'sozler' | 'bilgi';

const TOPIC_ARTICLES: Array<{
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: (navigation: Props['navigation']) => void;
}> = [
  {
    key: 'iskambil',
    title: 'İskambil Kartları ve Anlamları',
    subtitle: '52 kartın geleneksel fal anlamlarını keşfet',
    icon: <MaterialCommunityIcons name="cards-playing-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('KartAnlamlari', { deck: 'iskambil' }),
  },
  {
    key: 'tarot',
    title: 'Tarot Kartları ve Anlamları',
    subtitle: '78 kartlık Rider-Waite destesinin tam rehberi',
    icon: <MaterialCommunityIcons name="cards-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('KartAnlamlari', { deck: 'tarot' }),
  },
  {
    key: 'kahve',
    title: 'Kahve Falı Ne Zaman Bulundu?',
    subtitle: "Osmanlı'dan günümüze kahve falının hikayesi",
    icon: <MaterialCommunityIcons name="coffee-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'kahve_tarihi' }),
  },
  {
    key: 'katina',
    title: 'Katina Falı Nedir?',
    subtitle: 'İskambil kartlarıyla fal bakma geleneği',
    icon: <MaterialCommunityIcons name="cards-club-outline" size={24} color={INFO_CREAM} />,
    onPress: (navigation) => navigation.navigate('BilgiMakale', { topic: 'katina_nedir' }),
  },
  {
    key: 'burc',
    title: 'Burçların Kökeni ve 4 Element',
    subtitle: "Zodyağın Babil'den günümüze yolculuğu",
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

const ALL_QUOTES: string[] = quotesData as string[];
const ALL_INFO_CARDS: InfoCard[] = allInfoCards as InfoCard[];

const PAGE_SIZE = 25;

export default function SozlerKoskuScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<SozlerKoskuTab>(route.params?.initialTab ?? 'sozler');
  
  // Sözler state
  const [quotePage, setQuotePage] = useState(1);
  const [quoteSearch, setQuoteSearch] = useState('');
  
  // Bilgi state
  const [infoCategory, setInfoCategory] = useState<'all' | InfoCategory>('all');
  const [infoPage, setInfoPage] = useState(1);
  const [infoSearch, setInfoSearch] = useState('');
  const [popularQuotes, setPopularQuotes] = useState<PopularFavorite[]>([]);
  const [popularInfo, setPopularInfo] = useState<PopularFavorite[]>([]);
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

  // Filtrelenmiş bilgi kartları
  const filteredInfoCards = useMemo(() => {
    let list = ALL_INFO_CARDS;
    if (infoCategory !== 'all') {
      list = list.filter((c) => c.category === infoCategory);
    }
    if (infoSearch.trim()) {
      const q = infoSearch.toLowerCase().trim();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q));
    }
    return list;
  }, [infoCategory, infoSearch]);

  const visibleInfoCards = useMemo(() => {
    return filteredInfoCards.slice(0, infoPage * PAGE_SIZE);
  }, [filteredInfoCards, infoPage]);

  const loadPopulars = useCallback(() => {
    getPopularFavorites().then((items) => {
      setPopularQuotes(items.filter((item) => item.kind === 'quote' || item.id.startsWith('quote:')));
      setPopularInfo(items.filter((item) => item.kind === 'info' || item.id.startsWith('info:')));
    });
  }, []);

  useEffect(() => {
    loadPopulars();
  }, [loadPopulars]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setQuotePage(1);
    setInfoPage(1);
    loadPopulars();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadPopulars]);

  return (
    <MysticTableBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[GOLD]} />
        }
      >
        {/* Header Title */}
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons name="book-open-page-variant" size={28} color={GOLD} />
          </View>
          <Text style={styles.headerTitle}>Sözler Köşkü</Text>
          <Text style={styles.headerSubtitle}>Mistik Sözler, Kadim Bilgiler & İlham Aynası</Text>
        </View>

        {/* Tab Switcher - Sohbet Odaları Tarzında */}
        <View style={styles.tabSwitchRow}>
          <Pressable
            onPress={() => setTab('sozler')}
            style={[styles.tabSwitchButton, tab === 'sozler' && styles.tabSwitchButtonActive]}
          >
            <Ionicons name="sparkles" size={16} color={tab === 'sozler' ? '#1a0d33' : GOLD} />
            <Text style={[styles.tabSwitchText, tab === 'sozler' && styles.tabSwitchTextActive]}>
              Sözler Köşesi ({filteredQuotes.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('bilgi')}
            style={[styles.tabSwitchButton, tab === 'bilgi' && styles.tabSwitchButtonActive]}
          >
            <MaterialCommunityIcons
              name="book-cross"
              size={17}
              color={tab === 'bilgi' ? '#1a0d33' : GOLD}
            />
            <Text style={[styles.tabSwitchText, tab === 'bilgi' && styles.tabSwitchTextActive]}>
              Bilgi Köşesi ({filteredInfoCards.length})
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: SÖZLER KÖŞESİ */}
        {tab === 'sozler' && (
          <View style={styles.tabContent}>
            {/* Sözler Köşesi - Haftanın En Sevilenleri */}
            {popularQuotes.length > 0 && (
              <View style={styles.popularSection}>
                <View style={styles.popularHeader}>
                  <Ionicons name="flame-outline" size={16} color={GOLD} />
                  <Text style={styles.popularTitle}>Haftanın En Sevilen Sözleri</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularRow}
                >
                  {popularQuotes.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedPopular(item)}
                      style={({ pressed }) => [styles.popularCard, pressed && styles.popularCardPressed]}
                    >
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

            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Ruhunu Aydınlatan Günün Sözleri</Text>
            </View>

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
                <Text style={styles.loadMoreBtnText}>Daha Fazla Söz Göster ({filteredQuotes.length - visibleQuotes.length} Kalan)</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* TAB 2: BİLGİ KÖŞESİ */}
        {tab === 'bilgi' && (
          <View style={styles.tabContent}>
            {/* Popülerler Bölümü */}
            {popularInfo.length > 0 && (
              <View style={styles.popularSection}>
                <View style={styles.popularHeader}>
                  <Ionicons name="flame-outline" size={16} color={GOLD} />
                  <Text style={styles.popularTitle}>Haftanın En Sevilen Bilgileri</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularRow}
                >
                  {popularInfo.map((item) => (
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
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Ana Rehber & Makale Kartları (5 Büyük Kart) */}
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="feather" size={16} color={GOLD} />
              <Text style={styles.sectionTitle}>Kadim Kehanet & Fal Ansiklopedisi</Text>
            </View>

            <View style={styles.topicsGrid}>
              {TOPIC_ARTICLES.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => item.onPress(navigation)}
                  style={({ pressed }) => [styles.topicCard, pressed && styles.topicCardPressed]}
                >
                  <View style={styles.topicIconWrap}>{item.icon}</View>
                  <View style={styles.topicTextWrap}>
                    <Text style={styles.topicTitle}>{item.title}</Text>
                    <Text style={styles.topicSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={GOLD_SOFT} />
                </Pressable>
              ))}
            </View>

            {/* BİLGİ ARAMA ÇUBUĞU - 5 Makale Kartının Tam Altında */}
            <View style={[styles.searchBarWrap, { marginTop: 18 }]}>
              <Ionicons name="search" size={17} color={GOLD_SOFT} />
              <TextInput
                value={infoSearch}
                onChangeText={(t) => {
                  setInfoSearch(t);
                  setInfoPage(1);
                }}
                placeholder="Bilgi kartlarında ara..."
                placeholderTextColor={TEXT_MUTED}
                style={styles.searchInput}
              />
              {infoSearch ? (
                <Pressable onPress={() => setInfoSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={GOLD_SOFT} />
                </Pressable>
              ) : null}
            </View>

            {/* Kategori Filtre Butonları */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsRow}
            >
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'burc', label: 'Burçlar' },
                { key: 'kart', label: 'Kartlar' },
                { key: 'astroloji', label: 'Astroloji' },
                { key: 'tarot', label: 'Tarot' },
              ].map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => {
                    setInfoCategory(c.key as any);
                    setInfoPage(1);
                  }}
                  style={[
                    styles.categoryPill,
                    infoCategory === c.key && styles.categoryPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      infoCategory === c.key && styles.categoryPillTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* İlginç Bilgi Kartları Feed - Arama Sonuçları Doğrudan Burada */}
            {visibleInfoCards.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                  <Ionicons name="bulb-outline" size={16} color={GOLD} />
                  <Text style={styles.sectionTitle}>Kadim Bilgi Kartları ({filteredInfoCards.length})</Text>
                </View>

                <View style={styles.factsFeed}>
                  {visibleInfoCards.map((card) => (
                    <View key={card.id} style={styles.factCard}>
                      <CornerTicks />
                      <View style={styles.factHeader}>
                        <View style={styles.factCategoryBadge}>
                          <MaterialCommunityIcons
                            name={CATEGORY_ICON[card.category] || 'information-outline'}
                            size={13}
                            color={GOLD}
                          />
                          <Text style={styles.factCategoryText}>{CATEGORY_LABEL[card.category] || 'BİLGİ'}</Text>
                        </View>
                        <FavoriteStarButton id={card.id} kind="info" body={card.body} title={card.title} />
                      </View>
                      <Text style={styles.factTitle}>{card.title}</Text>
                      <Text style={styles.factBody}>{card.body}</Text>
                      <View style={styles.factFooter}>
                        <ShareButton text={`Mistik Rehber - ${card.title}\n\n${card.body}`} label="Paylaş" />
                        <ShareImageButton text={`${card.title}\n\n${card.body}`} label="Görsel Paylaş" />
                      </View>
                    </View>
                  ))}
                </View>

                {/* Daha Fazla Bilgi Kartı Yükle */}
                {visibleInfoCards.length < filteredInfoCards.length && (
                  <Pressable
                    onPress={() => setInfoPage((p) => p + 1)}
                    style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.loadMoreBtnPressed]}
                  >
                    <Ionicons name="chevron-down-circle-outline" size={18} color={GOLD} />
                    <Text style={styles.loadMoreBtnText}>Daha Fazla Bilgi Kartı Göster ({filteredInfoCards.length - visibleInfoCards.length} Kalan)</Text>
                  </Pressable>
                )}
              </>
            )}
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
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  headerIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  tabSwitchRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    gap: 6,
  },
  tabSwitchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tabSwitchButtonActive: {
    backgroundColor: GOLD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  tabSwitchTextActive: {
    color: '#1a0d33',
    fontWeight: '800',
  },
  tabContent: {
    width: '100%',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingRight: 10,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(242, 200, 121, 0.2)',
    borderColor: GOLD,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  categoryPillTextActive: {
    color: GOLD,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD_SOFT,
    letterSpacing: 0.3,
  },
  quotesFeed: {
    gap: 16,
  },
  quoteCard: {
    position: 'relative',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    overflow: 'hidden',
  },
  quoteCardImage: {
    borderRadius: 18,
  },
  quoteScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  quoteIcon: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 16,
  },
  quoteShareRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 20,
  },
  loadMoreBtnPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(36, 22, 70, 0.95)',
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
  },
  popularSection: {
    marginBottom: 18,
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
    color: GOLD,
  },
  popularRow: {
    gap: 12,
    paddingRight: 10,
  },
  popularCard: {
    width: 210,
    backgroundColor: 'rgba(30, 20, 58, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 14,
    justifyContent: 'space-between',
  },
  popularCardPressed: {
    opacity: 0.85,
  },
  popularCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
    marginBottom: 6,
  },
  popularCardBody: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_MUTED,
  },
  topicsGrid: {
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 20, 58, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    padding: 14,
    gap: 12,
  },
  topicCardPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(40, 28, 72, 0.95)',
  },
  topicIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 200, 121, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTextWrap: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  topicSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  factsFeed: {
    gap: 14,
  },
  factCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.28)',
    padding: 16,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  factCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  factCategoryText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.4,
  },
  factTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: GOLD_SOFT,
    marginBottom: 6,
  },
  factBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    marginBottom: 14,
  },
  factFooter: {
    flexDirection: 'row',
    gap: 8,
  },
});
