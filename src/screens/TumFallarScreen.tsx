import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import SignatureFortuneCard from '@/components/fortune/SignatureFortuneCard';
import TarotModeSelectionModal from '@/components/tarot/TarotModeSelectionModal';
import RuneModeSelectionModal from '@/components/runes/RuneModeSelectionModal';
import { ALL_SIGNATURE_FORTUNES, type FortuneSignatureItem } from '@/constants/allFortunesData';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TumFallar'>;

type FilterCategory = 'all' | 'cards' | 'visual' | 'ancient';

const FILTERS: { key: FilterCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tümü', icon: 'sparkles' },
  { key: 'cards', label: 'Kart Desteleri', icon: 'albums-outline' },
  { key: 'visual', label: 'Fotoğraflı Fallar', icon: 'camera-outline' },
  { key: 'ancient', label: 'Antik Kehanetler', icon: 'planet-outline' },
];

export default function TumFallarScreen({ navigation }: Props) {
  const [tarotModalVisible, setTarotModalVisible] = useState(false);
  const [runeModalVisible, setRuneModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  const popularItems = useMemo(
    () => [
      {
        key: 'coffee',
        title: 'Kahve Falı',
        iconName: 'coffee' as const,
        accent: '#F59E0B',
        onPress: () => navigation.navigate('ImageReading', { kind: 'coffee' }),
      },
      {
        key: 'tarot',
        title: 'Tarot Falı',
        iconName: 'cards-playing-outline' as const,
        accent: '#EC4899',
        onPress: () => setTarotModalVisible(true),
      },
      {
        key: 'face',
        title: 'Yüz Falı',
        iconName: 'face-recognition' as const,
        accent: '#A855F7',
        onPress: () => navigation.navigate('ImageReading', { kind: 'face' }),
      },
      {
        key: 'voice',
        title: 'Sesli Falcı',
        iconName: 'microphone-outline' as const,
        accent: '#F43F5E',
        onPress: () => navigation.navigate('VoiceReading'),
      },
      {
        key: 'rune',
        title: 'Nordik Rün',
        iconName: 'triangle-outline' as const,
        accent: '#38BDF8',
        onPress: () => setRuneModalVisible(true),
      },
      {
        key: 'palm',
        title: 'El Falı',
        iconName: 'hand-back-right-outline' as const,
        accent: '#10B981',
        onPress: () => navigation.navigate('ImageReading', { kind: 'palm' }),
      },
      {
        key: 'katina',
        title: 'Katina Aşk',
        iconName: 'cards-heart-outline' as const,
        accent: '#E11D48',
        onPress: () => navigation.navigate('CardDeckTable', { deckId: 'katina' }),
      },
      {
        key: 'sufal',
        title: 'Su Falı',
        iconName: 'water-outline' as const,
        accent: '#06B6D4',
        onPress: () => navigation.navigate('SuFal'),
      },
    ],
    [navigation],
  );

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
        return ['coffee', 'palm', 'face', 'sufal', 'wax'].includes(item.key);
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
          <MaterialCommunityIcons name="cards-playing-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Tüm Fal Çeşitleri</Text>
        </View>
        <Text style={styles.headerCaption}>
          Dünyanın dört bir yanından kadim kehanetler ve mistik kart atölyeleri
        </Text>

        {/* Arama Çubuğu */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Fal veya deste ara... (Örn: Aşk, Tarot, Kahve)"
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
                <Ionicons name={f.icon} size={14} color={active ? '#0F0820' : GOLD} />
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* EN ÇOK SEVİLEN & POPÜLER FALLAR (2 SATIRLIK KOMPAKT SİMGE VİTRİNİ) */}
        {!searchQuery.trim() && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeaderRow}>
              <MaterialCommunityIcons name="star-shooting" size={16} color={GOLD} />
              <Text style={styles.popularSectionTitle}>En Çok Tercih Edilen Fallar</Text>
            </View>
            <View style={styles.popularGrid}>
              {popularItems.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.popularIconBtn,
                    pressed && styles.popularIconBtnPressed,
                  ]}
                >
                  <View style={[styles.popularIconCircle, { borderColor: item.accent + '66', backgroundColor: item.accent + '18' }]}>
                    <MaterialCommunityIcons name={item.iconName} size={22} color={item.accent} />
                  </View>
                  <Text style={styles.popularIconText} numberOfLines={1}>
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Fal Listesi (Geniş İmza Kartları) */}
        <View style={styles.cardsList}>
          {filteredFortunes.map((item) => (
            <SignatureFortuneCard
              key={item.key}
              title={item.title}
              subtitle={item.subtitle}
              tags={item.tags}
              accent={item.accent}
              badgeText={item.badgeText}
              badgeColor={item.badgeColor}
              ctaText={item.ctaText}
              imageSource={item.imageSource}
              onPress={() => handleCardPress(item)}
            />
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
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.3,
  },
  headerCaption: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 8, 30, 0.85)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 8, 30, 0.7)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  filterPillActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
  filterTextActive: {
    color: '#0F0820',
  },
  popularSection: {
    backgroundColor: 'rgba(20, 10, 40, 0.7)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    padding: 12,
    marginBottom: 16,
  },
  popularHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  popularSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  popularIconBtn: {
    width: '23%',
    alignItems: 'center',
    gap: 4,
  },
  popularIconBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  popularIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularIconText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  cardsList: {
    gap: 2,
  },
  emptyWrap: {
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
