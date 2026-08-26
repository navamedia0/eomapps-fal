import { Image, View, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  source?: ImageSourcePropType;
  fallback: React.ReactNode;
  size?: number;
};

// Renders a custom Cosmic Indigo feature image when one is available for
// this key, falling back to the existing Ionicons-in-circle look otherwise.
// The custom art already bakes in its own rounded frame + glow border, so it
// is rendered edge-to-edge with no extra chrome layered on top — doubling up
// a border/background here would just shrink the visible artwork.
export default function FeatureIcon({ source, fallback, size = 44 }: Props) {
  if (!source) {
    return (
      <View style={[styles.circleWrap, { width: size, height: size, borderRadius: size / 2 }]}>{fallback}</View>
    );
  }

  return (
    <View style={[styles.imageWrap, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <Image source={source} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  circleWrap: {
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
