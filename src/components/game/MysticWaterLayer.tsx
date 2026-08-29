import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

type Props = {
  width: number;
  height: number;
};

export default function MysticWaterLayer({ width, height }: Props) {
  // Cascading UV water stream offset animations
  const streamOffset1 = useRef(new Animated.Value(0)).current;
  const streamOffset2 = useRef(new Animated.Value(0)).current;
  const shimmerPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Primary Waterfall Flow Loop (fast stream)
    Animated.loop(
      Animated.timing(streamOffset1, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      }),
    ).start();

    // Secondary River Basin Flow Loop (slower stream)
    Animated.loop(
      Animated.timing(streamOffset2, {
        toValue: 1,
        duration: 3800,
        useNativeDriver: true,
      }),
    ).start();

    // Bioluminescent Shimmer Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPulse, {
          toValue: 0.85,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerPulse, {
          toValue: 0.35,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [streamOffset1, streamOffset2, shimmerPulse]);

  const translateYStream1 = streamOffset1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 28],
  });

  const translateYStream2 = streamOffset2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Waterfall 1: Upper Left Cascade */}
      <Animated.View
        style={[
          styles.waterfallStream,
          {
            top: '52%',
            left: '32%',
            height: 50,
            width: 14,
            transform: [{ translateY: translateYStream1 }],
            opacity: shimmerPulse,
          },
        ]}
      />

      {/* Waterfall 2: Upper Right Cascade */}
      <Animated.View
        style={[
          styles.waterfallStream,
          {
            top: '60%',
            left: '84%',
            height: 60,
            width: 16,
            transform: [{ translateY: translateYStream1 }],
            opacity: shimmerPulse,
          },
        ]}
      />

      {/* Waterfall 3: Lower Left River Basin */}
      <Animated.View
        style={[
          styles.riverBasinStream,
          {
            top: '74%',
            left: '22%',
            height: 45,
            width: 20,
            transform: [{ translateY: translateYStream2 }],
            opacity: shimmerPulse,
          },
        ]}
      />

      {/* Luminous Bioluminescent Water Sparkles */}
      <Animated.View style={[styles.sparkleDot, { top: '55%', left: '34%', opacity: shimmerPulse }]} />
      <Animated.View style={[styles.sparkleDot, { top: '64%', left: '86%', opacity: shimmerPulse }]} />
      <Animated.View style={[styles.sparkleDot, { top: '78%', left: '25%', opacity: shimmerPulse }]} />
      <Animated.View style={[styles.sparkleDot, { top: '88%', left: '60%', opacity: shimmerPulse }]} />
      <Animated.View style={[styles.sparkleDot, { top: '92%', left: '78%', opacity: shimmerPulse }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  waterfallStream: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.45)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  riverBasinStream: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.4)',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  sparkleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
});
