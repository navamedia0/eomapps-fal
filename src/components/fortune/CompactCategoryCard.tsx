import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GOLD, GOLD_SOFT, TEXT_MUTED } from '@/theme/colors';

export type CompactCategoryCardProps = {
  title: string;
  subtitle: string;
  tags: string[];
  accent: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  badgeText?: string;
  imageSource: ImageSourcePropType;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function CompactCategoryCard({
  title,
  subtitle,
  tags,
  accent,
  iconName,
  badgeText,
  imageSource,
  onPress,
  style,
}: CompactCategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderColor: accent + '66' },
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* 1. ÜST SİYAH ŞERİT (BAŞLIK & İKON & ROZET) */}
      <View style={styles.topHeaderBar}>
        <View style={[styles.iconCircle, { backgroundColor: accent + '22', borderColor: accent + '66' }]}>
          <MaterialCommunityIcons name={iconName} size={18} color={accent} />
        </View>

        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: '#FDF4FF' }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {badgeText && (
          <View style={[styles.badge, { backgroundColor: accent + '22', borderColor: accent + '66' }]}>
            <Text style={[styles.badgeText, { color: accent }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      {/* 2. ORTA GÖRSEL ALANI (FOTOĞRAF) */}
      <View style={styles.middleArtworkWrap}>
        <ImageBackground source={imageSource} style={styles.bgImage} resizeMode="cover">
          <LinearGradient
            colors={[
              'rgba(6, 3, 11, 0.4)',
              'transparent',
              'rgba(6, 3, 11, 0.75)',
            ]}
            style={StyleSheet.absoluteFillObject}
          />
        </ImageBackground>
      </View>

      {/* 3. ALT SİYAH ŞERİT (ETİKETLER & İLERİ OKU) */}
      <View style={styles.bottomFooterBar}>
        <View style={styles.tagRow}>
          {tags.slice(0, 3).map((tag, idx) => (
            <View
              key={idx}
              style={[
                styles.tagPill,
                {
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(10, 5, 20, 0.82)',
                },
              ]}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chevronWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: accent + '66' }]}>
          <Ionicons name="chevron-forward" size={15} color={accent} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 145,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.2,
    marginBottom: 14,
    backgroundColor: '#06030B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  topHeaderBar: {
    backgroundColor: '#06030B',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 0.8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  middleArtworkWrap: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bottomFooterBar: {
    backgroundColor: '#06030B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 6,
  },
});
