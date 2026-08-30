import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ImageStyle, ImageSourcePropType, ImageResizeMode } from 'react-native';
import { ImageBackground } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  children?: ReactNode;
};

// expo-image sürümü yerel modül derlemesi (native rebuild) istediği için
// telefonda "Cannot find native module 'ExpoImage'" hatası verdi — şimdilik
// çekirdek react-native ImageBackground'a geri dönüldü. expo-image'a
// geçmek istersek önce dev client'ı yeniden derlememiz (eas build veya
// `npx expo run:android`) gerekiyor.
export default function CachedImageBackground({ source, style, imageStyle, resizeMode = 'cover', children }: Props) {
  return (
    <ImageBackground source={source} style={style} imageStyle={imageStyle} resizeMode={resizeMode}>
      {children}
    </ImageBackground>
  );
}
