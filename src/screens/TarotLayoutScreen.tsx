import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TarotLayoutId } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TarotLayout'>;

const MINI_CARD_COUNT_GRID = 12;
const MINI_CARD_COUNT_FAN = 9;
const MINI_CARD_COUNT_RADIAL = 16;

function GridPreview() {
  return (
    <View style={styles.gridPreview}>
      {Array.from({ length: MINI_CARD_COUNT_GRID }, (_, i) => (
        <View key={i} style={styles.gridMiniCard} />
      ))}
    </View>
  );
}

function FullGridPreview() {
  return (
    <View style={styles.fullGridPreview}>
      {Array.from({ length: 32 }, (_, i) => (
        <View key={i} style={styles.fullGridMiniCard} />
      ))}
    </View>
  );
}

function FanPreview() {
  const n = MINI_CARD_COUNT_FAN;
  const center = (n - 1) / 2;
  const angleStep = 11;
  const arcRise = 3.2;
  return (
    <View style={styles.fanPreview}>
      {Array.from({ length: n }, (_, i) => {
        const offset = i - center;
        const angle = offset * angleStep;
        const rise = -(center - Math.abs(offset)) * arcRise;
        return (
          <View
            key={i}
            style={[
              styles.fanMiniCard,
              {
                transform: [{ translateY: rise }, { rotate: `${angle}deg` }],
                marginLeft: i === 0 ? 0 : -14,
                zIndex: i,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function RadialPreview() {
  const n = MINI_CARD_COUNT_RADIAL;
  const radius = 38;
  return (
    <View style={styles.radialPreview}>
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = radius * Math.sin(rad);
        const y = -radius * Math.cos(rad);
        return (
          <View
            key={i}
            style={[
              styles.radialMiniCard,
              {
                transform: [{ translateX: x }, { translateY: y }, { rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
      <View style={styles.radialCenterGlow} />
    </View>
  );
}

const LAYOUT_OPTIONS: Array<{
  id: TarotLayoutId;
  title: string;
  subtitle: string;
  preview: React.ReactNode;
}> = [
  {
    id: 'grid',
    title: 'Klasik Masa Dizilimi',
    subtitle: 'Kartlar ızgara düzeninde, ayrı ayrı sıralanır',
    preview: <GridPreview />,
  },
  {
    id: 'fullgrid',
    title: 'Büyük Masa Izgarası (78 Kart Tek Ekranda)',
    subtitle: '78 kartın tamamı masaya yayılmış şekilde, tek ekrandan seçilir',
    preview: <FullGridPreview />,
  },
  {
    id: 'fan',
    title: 'Dalga Dizilimi',
    subtitle: 'Kartlar dalgalı bir şerit halinde yan yana dizilir, kaydırarak gezilir',
    preview: <FanPreview />,
  },
  {
    id: 'radial',
    title: 'Daire Dizilimi',
    subtitle: 'Kartlar tam ekranı kaplayan bir daire etrafında dizilir',
    preview: <RadialPreview />,
  },
];

export default function TarotLayoutScreen({ navigation, route }: Props) {
  const { spreadId } = route.params;

  const choose = (layout: TarotLayoutId) => {
    navigation.navigate('Tarot', { spreadId, layout });
  };

  return (
    <MysticTableBackground variant="tarot">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Kartlar nasıl dizilsin?</Text>
        <Text style={styles.caption}>Kartları seçerken görmek istediğin dizilimi seç</Text>

        <View style={styles.optionsList}>
          {LAYOUT_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => choose(option.id)}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionCardPressed]}
            >
              <View style={styles.previewWrap}>{option.preview}</View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GOLD} />
            </Pressable>
          ))}
        </View>
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
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },
  caption: {
    marginTop: 6,
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 24,
  },
  optionsList: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
  },
  optionCardPressed: {
    opacity: 0.85,
  },
  previewWrap: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 3,
  },
  optionSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },

  // Grid preview
  gridPreview: {
    width: 60,
    height: 60,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    alignContent: 'center',
    justifyContent: 'center',
  },
  gridMiniCard: {
    width: 12,
    height: 16,
    borderRadius: 2,
    backgroundColor: GOLD,
    opacity: 0.85,
  },

  // FullGrid preview
  fullGridPreview: {
    width: 72,
    height: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignContent: 'center',
    justifyContent: 'center',
  },
  fullGridMiniCard: {
    width: 6.5,
    height: 9,
    borderRadius: 1,
    backgroundColor: GOLD,
    opacity: 0.85,
  },

  // Fan preview
  fanPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanMiniCard: {
    width: 16,
    height: 22,
    borderRadius: 3,
    backgroundColor: GOLD,
    borderWidth: 1,
    borderColor: NIGHT_CARD,
    opacity: 0.9,
  },

  // Radial preview
  radialPreview: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialMiniCard: {
    position: 'absolute',
    width: 10,
    height: 14,
    borderRadius: 2,
    backgroundColor: GOLD,
    opacity: 0.85,
  },
  radialCenterGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(242, 200, 121, 0.3)',
  },
});
