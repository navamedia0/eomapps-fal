import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Image, type ImageContentFit, type ImageSource } from 'expo-image';

type Props = {
  source: ImageSource | number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: ImageContentFit;
  children?: ReactNode;
};

// react-native'in çekirdek Image/ImageBackground'ı yerel require() edilen
// görselleri her mount'ta yeniden decode eder — bu uygulamada her fal
// ekranının kendine ait 500KB-1.3MB'lık bir arka planı olduğu için (ve bazı
// ekranlar aynı anda birden fazla büyük görsel gösterdiği için) ekranlar
// arası geçişte ve kaydırırken gözle görülür takılmaya yol açıyordu.
// expo-image bellek+disk önbelleği ve çok daha hızlı decode sağlıyor —
// ImageBackground'ın birebir karşılığı olmadığı için bu ince sarmalayıcı
// aynı API şeklini (source/style/imageStyle/children) koruyor.
export default function CachedImageBackground({ source, style, imageStyle, resizeMode = 'cover', children }: Props) {
  return (
    <View style={style}>
      <Image source={source} style={[StyleSheet.absoluteFillObject, imageStyle]} contentFit={resizeMode} cachePolicy="memory-disk" />
      {children}
    </View>
  );
}
