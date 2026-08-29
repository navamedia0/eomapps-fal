import { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import CornerTicks from '@/components/CornerTicks';
import ShareButton from '@/components/ShareButton';
import SparkleBurst from '@/components/effects/SparkleBurst';
import type { ReadingSection } from '@/utils/parseNumberedSections';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

// Percentage maxHeight can't resolve reliably against a shrink-to-fit parent
// (the "stage" View has no explicit height), so the card's cap is computed
// from the actual screen height instead — otherwise long sections would
// render unconstrained and push past the visible area on some devices.
const SCREEN_H = Dimensions.get('window').height;

type Props = {
  badge: string;
  sections: ReadingSection[];
  shareTextPrefix: string;
};

const SWAP_MS = 150;
const SHRINK_MS = 180;

// Full-screen "ödül kartı" reveal: one centered card at a time inside a
// darkened modal, popping in with a scale+glow+sparkle burst (sandık açılışı
// hissi). Tapping the backdrop shrinks the card down to a small pill instead
// of dismissing it outright; tapping the pill replays the same reveal.
export default function ReadingCardStack({ badge, sections, shareTextPrefix }: Props) {
  const [index, setIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [burstFlag, setBurstFlag] = useState(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardScale = useSharedValue(0.5);
  const cardOpacity = useSharedValue(0);
  const glow = useSharedValue(0);

  const reveal = () => {
    cardOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 11, stiffness: 130 });
    glow.value = 0;
    glow.value = withSequence(withTiming(1, { duration: 220 }), withTiming(0, { duration: 560 }));
    setBurstFlag((f) => !f);
  };

  useEffect(() => {
    if (!minimized) reveal();
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized]);

  const goTo = (next: number) => {
    cardOpacity.value = withTiming(0, { duration: SWAP_MS });
    cardScale.value = withTiming(0.82, { duration: SWAP_MS });
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => {
      setIndex(next);
      reveal();
    }, SWAP_MS);
  };

  const handleMinimize = () => {
    cardOpacity.value = withTiming(0, { duration: SHRINK_MS });
    cardScale.value = withTiming(0.25, { duration: SHRINK_MS });
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => setMinimized(true), SHRINK_MS);
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.8,
    transform: [{ scale: 0.8 + glow.value * 0.55 }],
  }));

  const section = sections[index];
  const isLast = index === sections.length - 1;
  const fullReadingText = sections.map((s) => `${s.title}\n${s.body}`).join('\n\n');

  return (
    <>
      <Modal visible={!minimized} transparent animationType="fade" statusBarTranslucent onRequestClose={handleMinimize}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleMinimize} />

          <View style={styles.stage} pointerEvents="box-none">
            <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
            <SparkleBurst active={burstFlag} count={14} radius={100} />

            <Animated.View style={[styles.card, cardStyle]}>
              <CornerTicks />
              <View style={styles.badgeRow}>
                <Ionicons name="sparkles" size={14} color={GOLD} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>

              <View style={styles.dotsRow}>
                {sections.map((_, i) => (
                  <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                ))}
              </View>

              <ScrollView style={styles.textScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </ScrollView>

              <View style={styles.footerRow}>
                <ShareButton text={`${shareTextPrefix}\n\n${section.title}\n${section.body}`} label="Bu Kartı Paylaş" />
                {!isLast ? (
                  <Pressable onPress={() => goTo(index + 1)} style={styles.nextButton}>
                    <Text style={styles.nextButtonText}>Devamını Gör</Text>
                    <Ionicons name="chevron-forward" size={16} color="#1a0d33" />
                  </Pressable>
                ) : (
                  <ShareButton text={`${shareTextPrefix}\n\n${fullReadingText}`} label="Tümünü Paylaş" />
                )}
              </View>

              {index > 0 && (
                <Pressable onPress={() => goTo(index - 1)} style={styles.backButton} hitSlop={10}>
                  <Ionicons name="chevron-back" size={14} color={TEXT_MUTED} />
                  <Text style={styles.backButtonText}>Öncekine dön</Text>
                </Pressable>
              )}
            </Animated.View>
          </View>

          <Text style={styles.hint}>Kartı küçültmek için dışına dokun</Text>
        </View>
      </Modal>

      {minimized && (
        <View style={styles.pillLayer} pointerEvents="box-none">
          <Pressable onPress={() => setMinimized(false)} style={styles.pill}>
            <Ionicons name="sparkles" size={16} color={GOLD} />
            <Text style={styles.pillText}>
              {index + 1}/{sections.length} · Kartı Göster
            </Text>
            <Ionicons name="chevron-up" size={14} color={GOLD} />
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 3, 16, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  stage: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: GOLD,
  },
  card: {
    position: 'relative',
    width: '100%',
    backgroundColor: NIGHT_CARD,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    padding: 22,
    minHeight: 320,
    maxHeight: SCREEN_H * 0.82,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: '700', color: GOLD, letterSpacing: 0.3 },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GOLD_SOFT },
  dotActive: { backgroundColor: GOLD, width: 18 },
  textScroll: { flexGrow: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: GOLD, marginBottom: 10, lineHeight: 23 },
  sectionBody: { fontSize: 15.5, lineHeight: 25.5, color: TEXT_PRIMARY, paddingBottom: 4 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  nextButton: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 12,
  },
  nextButtonText: { fontSize: 12.5, fontWeight: '800', color: '#1a0d33' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginTop: 12, padding: 4 },
  backButtonText: { fontSize: 12, color: TEXT_MUTED },
  hint: {
    position: 'absolute',
    bottom: 36,
    fontSize: 11.5,
    color: 'rgba(224, 217, 245, 0.5)',
  },
  pillLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1.2,
    borderColor: GOLD,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pillText: { fontSize: 12.5, fontWeight: '700', color: TEXT_PRIMARY },
});
