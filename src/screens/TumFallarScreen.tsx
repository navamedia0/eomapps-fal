import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import TarotModeSelectionModal from '@/components/tarot/TarotModeSelectionModal';
import RuneModeSelectionModal from '@/components/runes/RuneModeSelectionModal';
import { ALL_SIGNATURE_FORTUNES, type FortuneSignatureItem } from '@/constants/allFortunesData';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TumFallar'>;

type FilterCategory = 'all' | 'cards' | 'visual' | 'ancient';

const FILTERS: { key: FilterCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tümü', icon: 'sparkles' },
  { key: 'cards', label: 'Kart Desteleri', icon: 'albums-outline' },
  { key: 'visual', label: 'Fotoğraflı', icon: 'camera-outline' },
  { key: 'ancient', label: 'Antik & Remil', icon: 'planet-outline' },
];

export default function TumFallarScreen({ navigation }: Props) {
  const [tarotModalVisible, setTarotModalVisible] = useState(false);
  const [runeModalVisible, setRuneModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  const filteredFortunes = useMemo(() => {
    return ALL_SIGNATURE_FORTUNES.filter((item) => {
      // 1. Arama Filtresi
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchSubtitle = item.subtitle.toLowerCase().includes(query);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchSubtitle && !matchTags) return false;
      }

      // 2. Kategori Filtresi
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'cards') {
        return ['tarot', 'katina', 'lenormand', 'thoth', 'osho_zen', 'angel', 'iskambil'].includes(item.key);
      }
      if (selectedFilter === 'visual') {
        return ['coffee', 'palm', 'face', 'sufal', 'wax', 'voiceReading'].includes(item.key);
      }
      if (selectedFilter === 'ancient') {
        return ['rune', 'iching', 'bakla'].includes(item.key);
      }
      return true;
    });
  }, [searchQuery, selectedFilter]);

  const handleCardPress = (item: FortuneSignatureItem) => {
    if (item.actionType === 'tarot_modal') {
      setTarotModalVisible(true);
    } else if (item.actionType === 'rune_modal') {
      setRuneModalVisible(true);
    } else if (item.route) {
      navigation.navigate(item.route as any, item.params);
    }
  };

  return (
    <MysticTableBackground variant="general">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="cards-playing-outline" size={24} color={GOLD} />
          <Text style={styles.headerTitle}>Tüm Fal Çeşitleri</Text>
        </View>
        <Text style={styles.headerCaption}>
          Dünyanın dört bir yanından 17 kadim kehanet ve mistik kart atölyesi
        </Text>

        {/* Arama Çubuğu */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Fal veya deste ara... (Örn: Tarot, Kahve, Aşk)"
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
            </Pressable>
          )}
        </View>

        {/* Kategori Filtre Butonları (Pills) */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = selectedFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setSelectedFilter(f.key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Ionicons name={f.icon} size={13} color={active ? NIGHT_DEEP : GOLD} />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Fal Izgarası (Grid) — Anasayfa Kart Boyutu & Estetiği */}
        <View style={styles.grid}>
          {filteredFortunes.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => handleCardPress(item)}
              style={({ pressed }) => [styles.gridCard, pressed && styles.gridCardPressed]}
            >
              <ImageBackground
                source={item.imageSource}
                style={styles.cardImageWrap}
                imageStyle={styles.cardImage}
              >
                <LinearGradient
                  colors={['rgba(8, 7, 8, 0.1)', 'rgba(8, 7, 8, 0.55)', 'rgba(8, 7, 8, 0.95)']}
                  style={StyleSheet.absoluteFillObject}
                />

                {item.badgeText && (
                  <View style={[styles.cardTag, { borderColor: item.badgeColor ? item.badgeColor + '66' : GOLD_SOFT }]}>
                    <Text style={styles.cardTagText} numberOfLines={1}>
                      {item.badgeText.replace(/^[^\w\s\u00C0-\u017F]+/, '').trim()}
                    </Text>
                  </View>
                )}

                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </ImageBackground>
            </Pressable>
          ))}

          {filteredFortunes.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="search" size={32} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>Aradığınız kriterde bir fal bulunamadı.</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 48,
    paddingHorizontal: 12,
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
    fontSize: 20,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  headerCaption: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  filterPillActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
  },
  filterTextActive: {
    color: NIGHT_DEEP,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridCard: {
    width: '31.5%',
    height: 152,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
  },
  gridCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  cardImageWrap: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 7,
  },
  cardImage: {
    resizeMode: 'cover',
  },
  cardTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10, 8, 12, 0.82)',
    borderWidth: 0.8,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cardTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: GOLD,
  },
  cardBottom: {
    marginTop: 'auto',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFEFB',
    lineHeight: 14,
  },
  emptyWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});
