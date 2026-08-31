import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { QUOTE_PALETTES } from '@/constants/quotePalettes';

type Props = { text: string; paletteIndex: number };

const CARD_SIZE = 340;

const QuoteShareCard = forwardRef<View, Props>(({ text, paletteIndex }, ref) => {
  const palette = QUOTE_PALETTES[paletteIndex % QUOTE_PALETTES.length];

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {/* Gradyan Arkaplan */}
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Karartma ve Yıldız Işıltısı Katmanı */}
      <View style={styles.dim} />

      {/* Arka Plan Büyük Filigran Simgesi */}
      <Ionicons name={palette.icon} size={220} color="rgba(255,255,255,0.10)" style={styles.watermarkIcon} />

      {/* İç Zarif Yaldızlı Çerçeve */}
      <View style={styles.innerFrame}>
        {/* Üst Ay-Yıldız Simgesi */}
        <MaterialCommunityIcons
          name="star-crescent"
          size={24}
          color="rgba(255, 201, 60, 0.95)"
          style={styles.sparkle}
        />

        {/* Ana Söz Metni */}
        <View style={styles.textWrap}>
          <Text style={styles.quoteText}>{text}</Text>
        </View>

        {/* Alt Marka İmzası */}
        <View style={styles.brandRow}>
          <View style={styles.brandLine} />
          <Ionicons name="moon" size={12} color="rgba(255, 201, 60, 0.9)" />
          <Text style={styles.brand}>MİSTİK REHBER</Text>
          <Ionicons name="star" size={10} color="rgba(255, 201, 60, 0.9)" />
          <View style={styles.brandLine} />
        </View>
      </View>
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
    padding: 18,
    borderRadius: 28,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 7, 8, 0.22)',
  },
  watermarkIcon: {
    position: 'absolute',
    bottom: -40,
    right: -40,
  },
  innerFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  sparkle: {
    marginTop: 4,
    shadowColor: '#f2c879',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginVertical: 'auto',
  },
  quoteText: {
    fontSize: 18.5,
    lineHeight: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '80%',
    justifyContent: 'center',
  },
  brandLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  brand: {
    fontSize: 11,
    letterSpacing: 1.8,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '800',
  },
});
