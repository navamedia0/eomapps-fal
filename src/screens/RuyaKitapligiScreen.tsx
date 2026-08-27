import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { getDreamLibraryEntries, getPopularDreamEntries, getDreamLibraryCategories, type DreamLibraryEntry } from '@/services/dreamLibrary';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import DreamEntryModal from '@/components/DreamEntryModal';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RuyaKitapligi'>;

export default function RuyaKitapligiScreen(_props: Props) {
  const [selected, setSelected] = useState<DreamLibraryEntry | null>(null);
  const popular = useMemo(() => getPopularDreamEntries(), []);
  const all = useMemo(() => getDreamLibraryEntries(), []);
  const categories = useMemo(() => getDreamLibraryCategories(), []);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="library-outline" size={26} color={GOLD} />
          <Text style={styles.headerTitle}>Rüya Kitaplığı</Text>
          <Text style={styles.headerSubtitle}>Rüyandaki kavramları keşfet, anlamlarını oku</Text>
        </View>

        <Text style={styles.sectionLabel}>En Çok Görülen Rüyalar</Text>
        <View style={styles.popularGrid}>
          {popular.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => setSelected(entry)}
              style={({ pressed }) => [styles.popularChip, pressed && styles.pressedFade]}
            >
              <Text style={styles.popularChipText}>{entry.title}</Text>
            </Pressable>
          ))}
        </View>

        {categories.map((category) => {
          const items = all.filter((entry) => entry.category === category);
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.sectionLabel}>{category}</Text>
              <View style={styles.list}>
                {items.map((entry) => (
                  <Pressable
                    key={entry.id}
                    onPress={() => setSelected(entry)}
                    style={({ pressed }) => [styles.card, pressed && styles.pressedFade]}
                  >
                    <View style={styles.cardTextWrap}>
                      <Text style={styles.cardTitle}>{entry.title}</Text>
                      <Text style={styles.cardSubtitle} numberOfLines={2}>
                        {entry.summary}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={GOLD} />
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <DreamEntryModal entry={selected} onClose={() => setSelected(null)} />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  popularChip: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
  },
  popularChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  pressedFade: {
    opacity: 0.85,
  },
  categorySection: {
    marginBottom: 26,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: NIGHT_CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    lineHeight: 15,
  },
});
