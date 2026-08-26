import { useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ZODIACS, type Zodiac } from '@/services/zodiac';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { ZODIAC_TRAITS } from '@/constants/zodiacTraits';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

export default function ZodiacTraitsScreen() {
  const [selected, setSelected] = useState<Zodiac | null>(null);

  if (!selected) {
    return (
      <MysticTableBackground>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.instruction}>
            Bir burç seç; elementini, niteliğini, kutbunu ve yönetici gezegenini keşfet.
          </Text>
          <View style={styles.grid}>
            {ZODIACS.map((sign) => {
              const info = ZODIAC_INFO[sign];
              return (
                <Pressable
                  key={sign}
                  onPress={() => setSelected(sign)}
                  style={({ pressed }) => [styles.signCard, pressed && styles.signCardPressed]}
                >
                  <MaterialCommunityIcons name={info.icon as any} size={30} color={GOLD} />
                  <Text style={styles.signName}>{info.name}</Text>
                  <Text style={styles.signRange}>{info.dateRange}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </MysticTableBackground>
    );
  }

  const info = ZODIAC_INFO[selected];
  const traits = ZODIAC_TRAITS[selected];

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={info.icon as any} size={40} color={GOLD} />
          </View>
          <Text style={styles.detailSign}>{info.name}</Text>
          <Text style={styles.dateLabel}>{info.dateRange}</Text>
        </View>

        <View style={styles.traitsCard}>
          <View style={styles.traitsRow}>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Element</Text>
              <Text style={styles.traitValue}>{traits.element}</Text>
            </View>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Nitelik</Text>
              <Text style={styles.traitValue}>{traits.quality}</Text>
            </View>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Kutup</Text>
              <Text style={styles.traitValue}>{traits.polarity}</Text>
            </View>
            <View style={styles.traitItem}>
              <Text style={styles.traitLabel}>Yönetici</Text>
              <Text style={styles.traitValue}>{traits.rulingPlanet}</Text>
            </View>
          </View>
          <View style={styles.keyTraitsRow}>
            {traits.keyTraits.map((trait) => (
              <View key={trait} style={styles.keyTraitChip}>
                <Text style={styles.keyTraitText}>{trait}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.polarityNote}>
            "Kutup" burcun geleneksel astrolojideki enerji polaritesidir (eril: dışa dönük, dişil: içe dönük) — kişinin cinsiyetiyle ilgisi yoktur.
          </Text>
        </View>

        <Pressable onPress={() => setSelected(null)} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
          <Ionicons name="arrow-back" size={18} color={GOLD} />
          <Text style={styles.backButtonText}>Başka Burç Seç</Text>
        </Pressable>
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  signCard: {
    width: '31%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  signCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  signName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  signRange: {
    fontSize: 9.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  detailHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detailSign: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },
  dateLabel: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },
  traitsCard: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  traitItem: {
    flexBasis: '23%',
    alignItems: 'center',
    gap: 2,
  },
  traitLabel: {
    fontSize: 9.5,
    color: TEXT_MUTED,
  },
  traitValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  keyTraitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  keyTraitChip: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  keyTraitText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
  },
  polarityNote: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    lineHeight: 15,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
});
