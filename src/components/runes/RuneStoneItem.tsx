import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, Pressable, StyleProp, ViewStyle } from 'react-native';
import { RUNE_ASSETS } from '@/assets/runes';
import { isSymmetricRune, type Rune } from '@/services/runeEngine';

export type RuneStoneSize = 'sm' | 'md' | 'lg' | 'mini';

type Props = {
  rune?: Rune | { id: string; name?: string; symbol: string; element?: string; isReversed?: boolean };
  size?: RuneStoneSize;
  revealed?: boolean;
  isReversed?: boolean;
  glowColor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  showElementGlow?: boolean;
};

const SIZES: Record<RuneStoneSize, { width: number; height: number; glyphSize: number; borderRadius: number }> = {
  mini: { width: 44, height: 50, glyphSize: 20, borderRadius: 10 },
  sm: { width: 56, height: 64, glyphSize: 26, borderRadius: 14 },
  md: { width: 74, height: 84, glyphSize: 34, borderRadius: 18 },
  lg: { width: 96, height: 108, glyphSize: 44, borderRadius: 24 },
};

function RuneStoneItemComponent({
  rune,
  size = 'md',
  revealed = false,
  isReversed = false,
  glowColor = '#38BDF8',
  onPress,
  style,
  showElementGlow = true,
}: Props) {
  const dim = SIZES[size];
  const flipAnim = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const actualReversed = rune ? ('isReversed' in rune ? !!rune.isReversed : isReversed) : isReversed;
  const symmetric = rune ? isSymmetricRune(rune.id) : false;
  const shouldShowReversed = actualReversed && !symmetric;

  useEffect(() => {
    if (revealed) {
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 450,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      flipAnim.setValue(0);
    }
  }, [revealed]);

  const glyphColor = shouldShowReversed ? '#F2A65A' : glowColor;

  const content = (
    <View style={[styles.container, { width: dim.width, height: dim.height }, style]}>
      {/* Stone Blank Textured Background */}
      <Image
        source={RUNE_ASSETS.stoneBlank}
        style={[
          styles.stoneImage,
          {
            width: dim.width,
            height: dim.height,
          },
        ]}
        resizeMode="contain"
      />

      {/* Radial Spark Glow on Reveal */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.revealGlowHalo,
          {
            borderRadius: dim.borderRadius + 8,
            backgroundColor: glyphColor,
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.25],
                }),
              },
            ],
          },
        ]}
      />

      {/* Center Rune Glyph Overlay */}
      {revealed && rune && (
        <Animated.View
          style={[
            styles.glyphContainer,
            {
              opacity: flipAnim,
              transform: [
                {
                  scale: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
                {
                  rotate: shouldShowReversed ? '180deg' : '0deg',
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.glyphText,
              {
                fontSize: dim.glyphSize,
                color: glyphColor,
                textShadowColor: glyphColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              },
            ]}
          >
            {rune.symbol}
          </Text>
        </Animated.View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const RuneStoneItem = React.memo(RuneStoneItemComponent);
export default RuneStoneItem;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  stoneImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  revealGlowHalo: {
    ...StyleSheet.absoluteFillObject,
    margin: -4,
  },
  glyphContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glyphText: {
    fontWeight: '900',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
