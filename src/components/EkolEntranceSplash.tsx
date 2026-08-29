import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Image, type ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
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
  const scale = useSharedValue(0.6);
  const glowScale = useSharedValue(0.75);
  const textOpacity = useSharedValue(0);
  const floatY = useSharedValue(20);

  useEffect(() => {
    if (!visible) return;

    // Reset initial values
    opacity.value = 0;
    scale.value = 0.6;
    glowScale.value = 0.75;
    textOpacity.value = 0;
    floatY.value = 20;

    // 1. Slow, majestic float-in (1.8 seconds)
    opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1.0, { damping: 14, stiffness: 60 });
    floatY.value = withTiming(0, { duration: 1600, easing: Easing.out(Easing.cubic) });

    // 2. Slow breathing glow pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // 3. Text fade in smoothly
    textOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });

    // 4. Hold on screen for ~3.2 seconds so user enjoys the mascot, then smoothly fade out
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 650, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      });
    }, 4500);

    return () => clearTimeout(timer);
  }, [visible, onFinish, opacity, scale, glowScale, textOpacity, floatY]);

  const figureAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: floatY.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.75,
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
    width: 260,
    height: 260,
    borderRadius: 130,
    filter: [{ blur: 45 }],
    opacity: 0.4,
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
});
