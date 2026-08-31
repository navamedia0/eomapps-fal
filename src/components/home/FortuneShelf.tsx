import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ImageBackground,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FeatureIcon from '@/components/FeatureIcon';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY } from '@/theme/colors';

export type ShelfItem = {
  key: string;
  title: string;
  // Fotoğraf-kart: verilirse kart tam-kapak görsel olarak render edilir.
  imageSource?: ImageSourcePropType;
  // Rozet-kart: imageSource yoksa, FEATURE_ICONS rozet sanatı + vektör yedek ikon.
  iconSource?: ImageSourcePropType;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

type Props = { title: string; items: ShelfItem[] };

export default function FortuneShelf({ title, items }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item) =>
          item.imageSource ? (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.photoCard, pressed && styles.cardPressed]}
            >
              <ImageBackground source={item.imageSource} style={styles.photoImageWrap} imageStyle={styles.photoImage}>
                <LinearGradient
                  colors={['transparent', 'rgba(8, 7, 8, 0.55)', 'rgba(8, 7, 8, 0.94)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.photoTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </ImageBackground>
            </Pressable>
          ) : (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.badgeCard, pressed && styles.cardPressed]}
            >
              <FeatureIcon
                source={item.iconSource}
                fallback={
                  <MaterialCommunityIcons
                    name={item.iconName ?? 'star-four-points-outline'}
                    size={22}
                    color={GOLD}
                  />
                }
                size={46}
              />
              <Text style={styles.badgeTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          ),
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  row: {
    gap: 10,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  photoCard: {
    width: 108,
    height: 148,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
  },
  photoImageWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
  },
  photoImage: {
    resizeMode: 'cover',
  },
  photoTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFEFB',
    lineHeight: 14,
  },
  badgeCard: {
    width: 84,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  badgeTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 13,
  },
});
