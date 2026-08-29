import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Modal, Image, Pressable, type ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GOLD } from '@/theme/colors';

type Props = {
  visible: boolean;
  figureSource: ImageSourcePropType;
  title: string;
  subtitle?: string;
  accentColor?: string;
  onFinish: () => void;
};

export default function EkolEntranceSplash({
  visible,
  figureSource,
  title,
  subtitle,
  accentColor = GOLD,
  onFinish,
}: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);
  const glowOpacity = useSharedValue(0.2);
  const textOpacity = useSharedValue(0);
  const floatY = useSharedValue(15);

  const handleFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const handleSkip = useCallback(() => {
    cancelAnimation(opacity);
    cancelAnimation(scale);
    cancelAnimation(glowOpacity);
    cancelAnimation(textOpacity);
    cancelAnimation(floatY);
    opacity.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) {
        runOnJS(handleFinish)();
      }
    });
  }, [opacity, scale, glowOpacity, textOpacity, floatY, handleFinish]);

  useEffect(() => {
    if (!visible) return;

    // Reset initial values
    opacity.value = 0;
    scale.value = 0.7;
    glowOpacity.value = 0.2;
    textOpacity.value = 0;
    floatY.value = 15;

    // 1. Slow, majestic float-in
    opacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1.0, { damping: 14, stiffness: 70 });
    floatY.value = withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) });

    // 2. Ultra-lightweight pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // 3. Text fade in smoothly
    textOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });

    // 4. Hold on screen then smoothly fade out
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(handleFinish)();
        }
      });
    }, 4200);

    return () => clearTimeout(timer);
  }, [visible, handleFinish, opacity, scale, glowOpacity, textOpacity, floatY]);

  const figureAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * glowOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable onPress={handleSkip} style={styles.container}>
        <LinearGradient
          colors={['rgba(9, 4, 20, 0.96)', 'rgba(15, 6, 32, 0.98)', 'rgba(6, 2, 14, 0.99)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* High-Performance Radial Glow Aura (No slow CSS blur filters) */}
        <Animated.View
          style={[styles.glowCircle, { borderColor: accentColor }, glowAnimStyle]}
          renderToHardwareTextureAndroid={true}
        />

        {/* Floating Mascot / Tulip Figure */}
        <Animated.View
          style={[styles.figureWrap, figureAnimStyle]}
          renderToHardwareTextureAndroid={true}
        >
          <Image source={figureSource} style={styles.figureImage} resizeMode="contain" />
        </Animated.View>

        {/* Ethereal Title & Subtitle */}
        <Animated.View style={[styles.textWrap, textAnimStyle]}>
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
        </Animated.View>

        {/* Subtle Tap to Skip Indicator */}
        <Text style={styles.skipHint}>Atlamak için dokunun</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    opacity: 0.35,
  },
  figureWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  figureImage: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#F1F5F9',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  accentLine: {
    width: 48,
    height: 3,
    borderRadius: 2,
    marginTop: 8,
  },
  skipHint: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
});
