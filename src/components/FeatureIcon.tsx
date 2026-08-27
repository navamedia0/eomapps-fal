import { Image, View, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  source?: ImageSourcePropType;
  fallback: React.ReactNode;
  size?: number;
};

// Dış siyah/karanlık kare çerçeveyi kırparak yalnızca mor yuvarlatılmış neon çerçeveyi
// ve içindeki simgeyi gösterir. Simgeler küçültülmez, aksine gereksiz dış siyahlıklar
// atıldığı için görsel çok daha büyük, dolgun ve canlı görünür.
export default function FeatureIcon({ source, fallback, size = 44 }: Props) {
  if (!source) {
    return (
      <View style={[styles.circleWrap, { width: size, height: size, borderRadius: size / 2 }]}>{fallback}</View>
    );
  }

  const innerSize = Math.round(size * 1.26);

  return (
    <View style={[styles.imageWrap, { width: size, height: size, borderRadius: Math.round(size * 0.27) }]}>
      <Image
        source={source}
        style={[styles.image, { width: innerSize, height: innerSize }]}
        resizeMode="cover"
      />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    // Resim tam merkezlenir; dıştaki siyah kenarlıklar imageWrap'in yuvarlak sınırında kırpılır
  },
});
