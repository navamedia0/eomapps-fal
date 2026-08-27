import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TAROT_SPREADS } from '@/services/tarotSpreads';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import {
  GOLD,
  GOLD_SOFT,
  NIGHT_MID,
  NIGHT_CARD,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_CAPTION,
} from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TarotSpread'>;

export default function TarotSpreadScreen({ navigation }: Props) {
  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Kaç kart seçmek istersin?</Text>
            <Text style={styles.caption}>Her açılımın kendine has bir anlatısı var</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('CardDesigns')} style={styles.customizeButton} hitSlop={8}>
            <Ionicons name="color-palette-outline" size={20} color={GOLD} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {TAROT_SPREADS.map((spread) => (
            <Pressable
              key={spread.id}
              onPress={() => navigation.navigate('TarotLayout', { spreadId: spread.id })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <LinearGradient
                colors={[NIGHT_CARD, NIGHT_MID]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{spread.id}</Text>
                </View>
                <View style={styles.cardTextWrap}>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{spread.name}</Text>
                    {spread.priceCoins > 0 && (
                      <View style={styles.priceChip}>
                        <Ionicons name="disc-outline" size={11} color={GOLD} />
                        <Text style={styles.priceChipText}>{spread.priceCoins}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDescription}>{spread.description}</Text>
                  <Text style={styles.cardPositions}>
                    {spread.positions.join(' → ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={GOLD} />
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => navigation.navigate('CardDesigns')}
          style={({ pressed }) => [styles.customizeCardsButton, pressed && styles.cardPressed]}
        >
          <Ionicons name="color-palette-outline" size={18} color={GOLD} />
          <Text style={styles.customizeCardsButtonText}>Kartları Özelleştir</Text>
        </Pressable>
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  headerTextWrap: {
    flex: 1,
  },
  customizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  caption: {
    marginTop: 6,
    fontSize: 13,
    color: TEXT_CAPTION,
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 18,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 200, 121, 0.14)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  priceChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GOLD,
  },
  cardDescription: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 5,
  },
  cardPositions: {
    fontSize: 11,
    color: GOLD,
    opacity: 0.8,
  },
  customizeCardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  customizeCardsButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: GOLD,
  },
});
