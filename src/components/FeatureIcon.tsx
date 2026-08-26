import { Image, View, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { GOLD_SOFT } from '@/theme/colors';

type Props = {
  source?: ImageSourcePropType;
  fallback: React.ReactNode;
  size?: number;
};

// Renders a custom gold/cosmic feature image when one is available for this
// key, falling back to the existing Ionicons-in-circle look otherwise — so
// features without custom art keep working unchanged.
export default function FeatureIcon({ source, fallback, size = 44 }: Props) {
  if (!source) {
    return (
      <View style={[styles.circleWrap, { width: size, height: size, borderRadius: size / 2 }]}>{fallback}</View>
    );
  }

  return (
    <View style={[styles.imageWrap, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Image source={source} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  circleWrap: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
