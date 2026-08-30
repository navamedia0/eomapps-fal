import type { ReactNode } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Starfield from '@/components/Starfield';
import OrbGlow from '@/components/tarot/OrbGlow';
import { GOLD, NIGHT_DEEP } from '@/theme/colors';

const COSMIC_BG = require('../../assets/backgrounds/genelarkaplan.webp');

const BACKGROUNDS = {
  general: COSMIC_BG,
  tarot: COSMIC_BG,
};

export type BackgroundVariant = keyof typeof BACKGROUNDS;

type Decor = {
  icon: 'star-crescent' | 'crystal-ball';
  size: number;
  opacity: number;
  top?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
};

const TABLE_DECOR: Decor[] = [
  { icon: 'star-crescent', size: 22, opacity: 0.55, bottom: '3%', left: '5%' },
  { icon: 'star-crescent', size: 16, opacity: 0.45, bottom: '4%', right: '7%' },
  { icon: 'star-crescent', size: 22, opacity: 0.45, top: '4%', right: '8%' },
  { icon: 'crystal-ball', size: 20, opacity: 0.3, top: '5%', left: '7%' },
];

type Props = { children: ReactNode; variant?: BackgroundVariant; customBackground?: any; scrollY?: Animated.Value };

export default function MysticTableBackground({ children, variant = 'general', customBackground, scrollY }: Props) {
  return (
    <View style={styles.flex}>
      <Image
        source={customBackground || BACKGROUNDS[variant]}
        contentFit="cover"
        cachePolicy="memory-disk"
        style={styles.bgImage}
      />
      <LinearGradient
        colors={['rgba(11, 10, 31, 0.45)', 'rgba(11, 10, 31, 0.75)', 'rgba(11, 10, 31, 0.94)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.28)', 'rgba(139, 92, 246, 0)']}
        style={styles.candleGlow}
        pointerEvents="none"
      />
      {variant === 'general' && scrollY && <OrbGlow scrollY={scrollY} />}
      <Starfield count={14} />
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        {TABLE_DECOR.map((item, index) => (
          <MaterialCommunityIcons
            key={index}
            name={item.icon}
            size={item.size}
            color={GOLD}
            style={{
              position: 'absolute',
              opacity: item.opacity,
              top: item.top,
              bottom: item.bottom,
              left: item.left,
              right: item.right,
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: NIGHT_DEEP },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  candleGlow: {
    position: 'absolute',
    top: -100,
    left: '20%',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});
