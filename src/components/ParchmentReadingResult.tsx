import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageBackground,
  Dimensions,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShareButton from '@/components/ShareButton';
import type { ReadingSection } from '@/utils/parseNumberedSections';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  badge: string;
  sections: ReadingSection[];
  shareTextPrefix: string;
  parchmentBg: ImageSourcePropType;
  accentColor?: string;
  onHomePress: () => void;
  onNewReadingPress: () => void;
};

export default function ParchmentReadingResult({
  visible,
  badge,
  sections,
  shareTextPrefix,
  parchmentBg,
  accentColor = '#B45309',
  onHomePress,
  onNewReadingPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSection = sections[sectionIndex] || { title: badge, body: '' };
  const isLast = sectionIndex === sections.length - 1;

  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.96);

  // Slow, majestic typewriter effect per section
  useEffect(() => {
    if (!visible || !currentSection.body) return;

    if (typingTimer.current) clearInterval(typingTimer.current);

    contentOpacity.value = 0;
    contentScale.value = 0.96;
    contentOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    contentScale.value = withSpring(1, { damping: 14, stiffness: 120 });

    const fullBody = currentSection.body;
    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    // Smooth, slow majestic pace: 1-2 chars every 35ms
    const stepSize = Math.max(1, Math.min(2, Math.floor(fullBody.length / 120)));
    typingTimer.current = setInterval(() => {
      charIndex += stepSize;
      if (charIndex >= fullBody.length) {
        setDisplayedText(fullBody);
        setIsTyping(false);
        if (typingTimer.current) clearInterval(typingTimer.current);
      } else {
        setDisplayedText(fullBody.slice(0, charIndex));
      }
    }, 32);

    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, [sectionIndex, visible, currentSection.body, contentOpacity, contentScale]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const handleNext = () => {
    if (isTyping) {
      // Instant reveal on tap
      if (typingTimer.current) clearInterval(typingTimer.current);
      setDisplayedText(currentSection.body);
      setIsTyping(false);
      return;
    }
    if (!isLast) {
      setSectionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (sectionIndex > 0) {
      setSectionIndex((prev) => prev - 1);
    }
  };

  if (!visible) return null;

  const fullReadingText = sections.map((s) => `${s.title}\n${s.body}`).join('\n\n');

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Full-Screen Cropped Royal Parchment Background */}
      <ImageBackground
        source={parchmentBg}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }]}>
          {/* Top VIP Navigation Bar */}
          <View style={styles.topBar}>
            <Pressable onPress={onHomePress} style={styles.homeBtn} hitSlop={10}>
              <Ionicons name="home" size={17} color="#451A03" />
              <Text style={styles.homeBtnText}>Ana Sayfa</Text>
            </Pressable>

            <View style={styles.badgePill}>
              <MaterialCommunityIcons name="feather" size={15} color="#92400E" />
              <Text style={styles.badgePillText}>{badge}</Text>
            </View>

            <Pressable onPress={onNewReadingPress} style={styles.newReadingBtn} hitSlop={10}>
              <Ionicons name="refresh" size={16} color="#451A03" />
              <Text style={styles.newReadingBtnText}>Yeni Fal</Text>
            </Pressable>
          </View>

          {/* Section Indicator Dots */}
          {sections.length > 1 && (
            <View style={styles.dotsRow}>
              {sections.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === sectionIndex && styles.dotActive,
                    i === sectionIndex && { backgroundColor: accentColor, width: 22 },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Main Parchment Scrollable Reading Content */}
          <Animated.View style={[styles.parchmentContentWrap, animatedContentStyle]}>
            <ScrollView
              contentContainerStyle={styles.parchmentScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Ornate Section Title */}
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionTitle}>{currentSection.title}</Text>
                <View style={[styles.titleUnderline, { backgroundColor: accentColor }]} />
              </View>

              {/* Ink-on-Parchment Body Text */}
              <Text style={styles.parchmentBody}>
                {displayedText}
                {isTyping && <Text style={{ color: accentColor }}> ✒️</Text>}
              </Text>
            </ScrollView>
          </Animated.View>

          {/* Bottom Action Footer with Highly Visible Prominent Buttons */}
          <View style={styles.bottomBar}>
            {/* Back / Share Button */}
            {sectionIndex > 0 ? (
              <Pressable onPress={handlePrev} style={styles.prevBtn}>
                <Ionicons name="chevron-back" size={18} color="#451A03" />
                <Text style={styles.prevBtnText}>Önceki</Text>
              </Pressable>
            ) : (
              <View style={styles.shareWrap}>
                <ShareButton
                  text={`${shareTextPrefix}\n\n${currentSection.title}\n${currentSection.body}`}
                  label="Bu Kartı Paylaş"
                />
              </View>
            )}

            {/* Next / Full Share Button */}
            {!isLast ? (
              <Pressable
                onPress={handleNext}
                style={[styles.primaryActionBtn, { backgroundColor: accentColor }]}
              >
                <Text style={styles.primaryActionBtnText}>
                  {isTyping ? 'Tamamını Gör' : 'Devamını Gör'}
                </Text>
                <Ionicons
                  name={isTyping ? 'flash' : 'chevron-forward'}
                  size={17}
                  color="#FFFBEB"
                />
              </Pressable>
            ) : (
              <View style={styles.shareAllWrap}>
                <ShareButton
                  text={`${shareTextPrefix}\n\n${fullReadingText}`}
                  label="🌟 Tümünü Paylaş"
                />
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  homeBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#451A03',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#B45309',
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.3,
  },
  newReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  newReadingBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#451A03',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B45309',
    opacity: 0.35,
  },
  dotActive: {
    opacity: 1,
    height: 6,
    borderRadius: 3,
  },
  parchmentContentWrap: {
    flex: 1,
    marginHorizontal: 14,
    marginVertical: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 251, 235, 0.45)',
    borderRadius: 24,
  },
  parchmentScroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  sectionHeaderWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#291402',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 24,
  },
  titleUnderline: {
    width: 52,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },
  parchmentBody: {
    fontSize: 15,
    color: '#1C0D02',
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'justify',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  prevBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#451A03',
  },
  shareWrap: {
    flex: 1,
  },
  shareAllWrap: {
    flex: 1,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryActionBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFBEB',
    letterSpacing: 0.4,
  },
});
