import React, { useCallback, useMemo, useState } from 'react';
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
import CornerTicks from '@/components/CornerTicks';
import FavoriteStarButton from '@/components/FavoriteStarButton';
import ShareButton from '@/components/ShareButton';
import ShareImageButton from '@/components/ShareImageButton';
import allInfoCards from '@/data/bilgi_kosesi_kartlari.json';
import { type InfoCard, type InfoCategory } from '@/services/bilgiKosesiFeed';
import {
  GOLD,
  GOLD_SOFT,
  TEXT_PRIMARY,
  TEXT_MUTED,
} from '@/theme/colors';

const PARCHMENT_BG = require('@/assets/textures/soz_karti_arkaplan.webp');

type Props = NativeStackScreenProps<RootStackParamList, 'BilgiKosesi'>;

const ALL_INFO_CARDS: InfoCard[] = allInfoCards as InfoCard[];
const PAGE_SIZE = 25;

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

export default function BilgiKosesiScreen({ navigation }: Props) {
  const [infoCategory, setInfoCategory] = useState<'all' | InfoCategory>('all');
  const [infoPage, setInfoPage] = useState(1);
  const [infoSearch, setInfoSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filtrelenmiş bilgi kartları (7.500 Kart Havuzu)
  const filteredInfoCards = useMemo(() => {
    let list = ALL_INFO_CARDS;
    if (infoCategory !== 'all') {
      list = list.filter((c) => c.category === infoCategory);
    }
    if (infoSearch.trim()) {
      const q = infoSearch.toLowerCase().trim();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q),
      );
    }
    return list;
  }, [infoCategory, infoSearch]);

  const visibleInfoCards = useMemo(() => {
    return filteredInfoCards.slice(0, infoPage * PAGE_SIZE);
  }, [filteredInfoCards, infoPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setInfoPage(1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

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
          <Ionicons name="library" size={24} color={GOLD} />
          <Text style={styles.headerTitle}>Bilgi Köşesi</Text>
          <Text style={styles.headerSubtitle}>7.500 Kadim Bilgi Kartı & İlham Ansiklopedisi</Text>
        </View>

        {/* BİLGİ ARAMA ÇUBUĞU */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={17} color={GOLD_SOFT} />
          <TextInput
            value={infoSearch}
            onChangeText={(t) => {
              setInfoSearch(t);
              setInfoPage(1);
            }}
            placeholder="Kadim bilgi kartlarında ara..."
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

        {/* Kadim Bilgi Kartları Feed */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={16} color={GOLD} />
          <Text style={styles.sectionTitle}>
            Kadim Bilgi Kartları ({filteredInfoCards.length})
          </Text>
        </View>

        <View style={styles.factsFeed}>
          {visibleInfoCards.map((card) => (
            <ImageBackground
              key={card.id}
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
                <ShareButton
                  text={`Mistik Rehber - ${card.title}\n\n${card.body}`}
                  label="Paylaş"
                  style={styles.actionBtnStyle}
                  textStyle={styles.actionBtnTextStyle}
                />
                <ShareImageButton
                  text={`${card.title}\n\n${card.body}`}
                  label="Görsel Paylaş"
                />
              </View>
            </ImageBackground>
          ))}
        </View>

        {/* Daha Fazla Bilgi Kartı Yükle */}
        {visibleInfoCards.length < filteredInfoCards.length && (
          <Pressable
            onPress={() => setInfoPage((p) => p + 1)}
            style={({ pressed }) => [styles.loadMoreBtn, pressed && styles.loadMoreBtnPressed]}
          >
            <Ionicons name="chevron-down-circle-outline" size={18} color={GOLD} />
            <Text style={styles.loadMoreBtnText}>
              Daha Fazla Bilgi Kartı Göster ({filteredInfoCards.length - visibleInfoCards.length} Kalan)
            </Text>
          </Pressable>
        )}
      </ScrollView>
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
  },
  categoryPillsRow: {
    gap: 8,
    marginBottom: 16,
    paddingRight: 10,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
  },
  categoryPillActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD_SOFT,
  },
  categoryPillTextActive: {
    color: '#1a0d33',
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD_SOFT,
    letterSpacing: 0.5,
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
