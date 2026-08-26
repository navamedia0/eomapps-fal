import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { TarotCardDef, TarotOrientation } from '@/services/tarot';
import { TAROT_CARD_IMAGES } from '@/assets/tarot';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID } from '@/theme/colors';

type Props = {
  card: TarotCardDef;
  orientation: TarotOrientation;
  size?: number;
};

export default function TarotCardFace({ card, orientation, size = 108 }: Props) {
  const image = TAROT_CARD_IMAGES[card.id];
  const rotated = orientation === 'reversed';

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { width: size, borderRadius: size * 0.11 }, rotated && styles.rotated]}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[NIGHT_CARD, NIGHT_MID]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeholder}
          >
            <Text style={[styles.placeholderName, { fontSize: size * 0.12 }]} numberOfLines={4}>
              {card.name}
            </Text>
          </LinearGradient>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  card: {
    aspectRatio: 0.62,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    overflow: 'hidden',
  },
  rotated: {
    transform: [{ rotate: '180deg' }],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  placeholderName: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
