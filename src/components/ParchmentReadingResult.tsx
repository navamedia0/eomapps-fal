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
import { GOLD, NIGHT_CARD } from '@/theme/colors';

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

  // Typewriter effect per section
  useEffect(() => {
    if (!visible || !currentSection.body) return;

    if (typingTimer.current) clearInterval(typingTimer.current);

    contentOpacity.value = 0;
    contentScale.value = 0.96;
    contentOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    contentScale.value = withSpring(1, { damping: 14, stiffness: 120 });

    const fullBody = currentSection.body;
    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    // Stream text in chunks for smooth speed
    const stepSize = Math.max(2, Math.floor(fullBody.length / 40));
    typingTimer.current = setInterval(() => {
      charIndex += stepSize;
      if (charIndex >= fullBody.length) {
        setDisplayedText(fullBody);
        setIsTyping(false);
        if (typingTimer.current) clearInterval(typingTimer.current);
      } else {
        setDisplayedText(fullBody.slice(0, charIndex));
      }
    }, 25);

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
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
          {/* Top VIP Header Navigation */}
          <View style={styles.topBar}>
            <Pressable onPress={onHomePress} style={styles.homeBtn} hitSlop={10}>
              <Ionicons name="home" size={18} color="#4A2E12" />
              <Text style={styles.homeBtnText}>Ana Sayfa</Text>
            </Pressable>

            <View style={styles.badgePill}>
              <MaterialCommunityIcons name="feather" size={14} color="#78350F" />
              <Text style={styles.badgePillText}>{badge}</Text>
            </View>

            <Pressable onPress={onNewReadingPress} style={styles.newReadingBtn} hitSlop={10}>
              <Ionicons name="refresh" size={16} color="#4A2E12" />
              <Text style={styles.newReadingBtnText}>Yeni Fal</Text>
            </Pressable>
          </View>

          {/* Section Dots */}
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

          {/* Bottom Action Footer */}
          <View style={styles.bottomBar}>
            {/* Back Button */}
            {sectionIndex > 0 ? (
              <Pressable onPress={handlePrev} style={styles.prevBtn}>
                <Ionicons name="chevron-back" size={18} color="#78350F" />
                <Text style={styles.prevBtnText}>Önceki</Text>
              </Pressable>
            ) : (
              <ShareButton
                text={`${shareTextPrefix}\n\n${currentSection.title}\n${currentSection.body}`}
                label="Paylaş"
              />
            )}

            {/* Next / Finish Button */}
            {!isLast ? (
              <Pressable
                onPress={handleNext}
                style={[styles.nextBtn, { backgroundColor: accentColor }]}
              >
                <Text style={styles.nextBtnText}>
                  {isTyping ? 'Tamamını Gör' : 'Devamını Gör'}
                </Text>
                <Ionicons
                  name={isTyping ? 'flash' : 'chevron-forward'}
                  size={16}
                  color="#FFFBEB"
                />
              </Pressable>
            ) : (
              <ShareButton
                text={`${shareTextPrefix}\n\n${fullReadingText}`}
                label="Tümünü Paylaş"
              />
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
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(254, 243, 199, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  homeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4A2E12',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
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
    backgroundColor: 'rgba(254, 243, 199, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  newReadingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A2E12',
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
    backgroundColor: '#D97706',
    opacity: 0.4,
  },
  dotActive: {
    opacity: 1,
    height: 6,
    borderRadius: 3,
  },
  parchmentContentWrap: {
    flex: 1,
    marginHorizontal: 18,
    marginVertical: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(254, 243, 199, 0.25)',
    borderRadius: 20,
  },
  parchmentScroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sectionHeaderWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#3B1F04',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 23,
  },
  titleUnderline: {
    width: 48,
    height: 2.5,
    borderRadius: 2,
    marginTop: 6,
  },
  parchmentBody: {
    fontSize: 14.5,
    color: '#261403',
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'justify',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFBEB',
    letterSpacing: 0.4,
  },
});
