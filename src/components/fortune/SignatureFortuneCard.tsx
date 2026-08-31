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
import { GOLD, GOLD_SOFT, NIGHT_CARD } from '@/theme/colors';

export type SignatureFortuneCardProps = {
  title: string;
  subtitle: string;
  tags: string[];
  accent: string;
  badgeText?: string;
  badgeColor?: string;
  ctaText?: string;
  imageSource: ImageSourcePropType;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function SignatureFortuneCard({
  title,
  subtitle,
  tags,
  accent,
  badgeText,
  badgeColor,
  ctaText = 'Masaya Geç & Fal Bak →',
  imageSource,
  onPress,
  style,
}: SignatureFortuneCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        { borderColor: accent + '66' },
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {/* 1. ÜST SİYAH ŞERİT (BAŞLIK & ROZET) */}
      <View style={styles.topHeaderBar}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: '#FDF4FF' }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {badgeText && (
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: (badgeColor || accent) + '22',
                borderColor: (badgeColor || accent) + '66',
              },
            ]}
          >
            <Ionicons name="sparkles" size={11} color={badgeColor || accent} />
            <Text style={[styles.badgeText, { color: badgeColor || accent }]}>
              {badgeText}
            </Text>
          </View>
        )}
      </View>

      {/* 2. ORTA GÖRSEL ALANI (FOTOĞRAF & ETİKET KAPSÜLLERİ) */}
      <View style={styles.middleArtworkWrap}>
        <ImageBackground source={imageSource} style={styles.bgImage} resizeMode="cover">
          {/* Üst ve Alt Geçiş Karartması */}
          <LinearGradient
            colors={[
              'rgba(6, 3, 11, 0.45)',
              'transparent',
              'rgba(6, 3, 11, 0.85)',
            ]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Etiket Kapsülleri (Tags) */}
          <View style={styles.tagRow}>
            {tags.slice(0, 4).map((tag, idx) => (
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
        </ImageBackground>
      </View>

      {/* 3. ALT SİYAH ŞERİT (AKSİYON BUTONU) */}
      <View style={styles.bottomFooterBar}>
        <View
          style={[
            styles.actionPill,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: accent + '66',
            },
          ]}
        >
          <MaterialCommunityIcons name="cards-playing" size={15} color={accent} />
          <Text style={[styles.actionText, { color: accent }]}>{ctaText}</Text>
          <Ionicons name="arrow-forward" size={13} color={accent} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 235,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.2,
    marginBottom: 16,
    backgroundColor: '#06030B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  topHeaderBar: {
    backgroundColor: '#06030B',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 2,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.9,
  },
  badgeText: {
    fontSize: 11,
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
    justifyContent: 'flex-end',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bottomFooterBar: {
    backgroundColor: '#06030B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
