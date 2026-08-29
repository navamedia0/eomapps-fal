import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Image, type ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GOLD, GOLD_SOFT, NIGHT_DEEP } from '@/theme/colors';

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
  const scale = useSharedValue(0.65);
  const glowScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const floatY = useSharedValue(15);

  useEffect(() => {
    if (!visible) return;

    // Reset
    opacity.value = 0;
    scale.value = 0.65;
    glowScale.value = 0.8;
    textOpacity.value = 0;
    floatY.value = 15;

    // 1. Fade in and spring scale the figure
    opacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1.0, { damping: 12, stiffness: 100 });
    floatY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });

    // 2. Glow pulse
    glowScale.value = withSequence(
      withTiming(1.25, { duration: 450, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.0, { duration: 450, easing: Easing.inOut(Easing.sin) }),
    );

    // 3. Text fade in
    textOpacity.value = withTiming(1, { duration: 350 });

    // 4. Hold briefly, then exit smoothly
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }, 1100);

    return () => clearTimeout(timer);
  }, [visible, onFinish, opacity, scale, glowScale, textOpacity, floatY]);

  const figureAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.7,
    transform: [{ scale: glowScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(9, 4, 20, 0.96)', 'rgba(15, 6, 32, 0.98)', 'rgba(6, 2, 14, 0.99)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Ambient Glow Aura */}
        <Animated.View style={[styles.glowCircle, { backgroundColor: accentColor }, glowAnimStyle]} />

        {/* Floating Mascot / Tulip Figure */}
        <Animated.View style={[styles.figureWrap, figureAnimStyle]}>
          <Image source={figureSource} style={styles.figureImage} resizeMode="contain" />
        </Animated.View>

        {/* Ethereal Title & Subtitle */}
        <Animated.View style={[styles.textWrap, textAnimStyle]}>
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
        </Animated.View>
      </View>
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
    width: 240,
    height: 240,
    borderRadius: 120,
    filter: [{ blur: 40 }],
    opacity: 0.35,
  },
  figureWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  figureImage: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  accentLine: {
    width: 40,
    height: 2.5,
    borderRadius: 2,
    marginTop: 8,
  },
});
