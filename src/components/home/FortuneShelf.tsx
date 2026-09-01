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
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

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

type Props = {
  title: string;
  badgeText?: string;
  onSeeAllPress?: () => void;
  items: ShelfItem[];
};

export default function FortuneShelf({ title, badgeText = 'Tümünü Gör', onSeeAllPress, items }: Props) {
  const displayBadge = onSeeAllPress ? (badgeText || 'Tümünü Gör') : badgeText;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {displayBadge && (
          onSeeAllPress ? (
            <Pressable
              onPress={onSeeAllPress}
              style={({ pressed }) => [styles.badge, styles.badgeInteractive, pressed && styles.badgePressed]}
              hitSlop={6}
            >
              <Text style={styles.badgeLabel}>{displayBadge}</Text>
              <MaterialCommunityIcons name="chevron-right" size={13} color={GOLD} />
            </Pressable>
          ) : (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{displayBadge}</Text>
            </View>
          )
        )}
      </View>
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
                    size={28}
                    color={GOLD}
                  />
                }
                size={54}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  badge: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeInteractive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
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
    width: 108,
    height: 148,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  badgeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFEFB',
    textAlign: 'center',
    lineHeight: 15,
  },
});
