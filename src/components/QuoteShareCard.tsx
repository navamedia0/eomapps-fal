import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { QUOTE_PALETTES } from '@/constants/quotePalettes';

type Props = { text: string; paletteIndex: number };

const CARD_SIZE = 320;

const QuoteShareCard = forwardRef<View, Props>(({ text, paletteIndex }, ref) => {
  const palette = QUOTE_PALETTES[paletteIndex % QUOTE_PALETTES.length];

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.dim} />
      <Ionicons name={palette.icon} size={200} color="rgba(255,255,255,0.12)" style={styles.watermarkIcon} />
      <View style={styles.textWrap}>
        <MaterialCommunityIcons name="star-crescent" size={20} color="rgba(255,255,255,0.85)" style={styles.sparkle} />
        <Text style={styles.quoteText}>{text}</Text>
      </View>
      <Text style={styles.brand}>✦ Mistik Rehber ✦</Text>
    </View>
  );
});

export default QuoteShareCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 10, 31, 0.16)',
  },
  watermarkIcon: {
    position: 'absolute',
    bottom: -36,
    right: -36,
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sparkle: {
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 19,
    lineHeight: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  brand: {
    position: 'absolute',
    bottom: 18,
    fontSize: 12,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
});
