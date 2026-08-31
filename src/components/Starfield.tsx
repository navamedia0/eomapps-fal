import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Star = {
  key: number;
  top: string;
  left: string;
  size: number;
  phase: 'a' | 'b';
};

function generateFixedStars(count: number): Star[] {
  return Array.from({ length: count }, (_, key) => ({
    key,
    top: `${Math.round((key * 137.5) % 96 + 2)}%`,
    left: `${Math.round((key * 223.1) % 94 + 3)}%`,
    size: 1 + (key % 3) * 0.7,
    phase: key % 2 === 0 ? 'a' : 'b',
  }));
}

export default function Starfield({ count = 14 }: { count?: number }) {
  const phaseA = useRef(new Animated.Value(0.2)).current;
  const phaseB = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(phaseA, { toValue: 0.95, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(phaseA, { toValue: 0.2, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(phaseB, { toValue: 0.15, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(phaseB, { toValue: 0.85, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );

    loopA.start();
    loopB.start();

    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [phaseA, phaseB]);

  const stars = useMemo(() => generateFixedStars(count), [count]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((star) => {
        const opacity = star.phase === 'a' ? phaseA : phaseB;
        return (
          <Animated.View
            key={star.key}
            style={[
              styles.star,
              {
                top: star.top as any,
                left: star.left as any,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#FFFEFB',
  },
});
