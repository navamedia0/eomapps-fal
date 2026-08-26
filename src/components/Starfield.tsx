import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Star = {
  key: number;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
};

function randomStars(count: number): Star[] {
  return Array.from({ length: count }, (_, key) => ({
    key,
    top: `${Math.round(Math.random() * 100)}%`,
    left: `${Math.round(Math.random() * 100)}%`,
    size: 1 + Math.random() * 1.6,
    duration: 1800 + Math.random() * 2400,
    delay: Math.random() * 3000,
  }));
}

function TwinklingStar({ star }: { star: Star }) {
  const opacity = useRef(new Animated.Value(0.15 + Math.random() * 0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: star.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          delay: star.delay,
        }),
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: star.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, star.delay, star.duration]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top: star.top as any,
          left: star.left as any,
          width: star.size,
          height: star.size,
          borderRadius: star.size,
          opacity,
        },
      ]}
    />
  );
}

type Props = { count?: number };

// Lightweight decorative twinkle layer — a handful of opacity-only Animated
// loops (native-driver, no layout thrashing), safe to drop behind any screen.
export default function Starfield({ count = 16 }: Props) {
  const stars = useMemo(() => randomStars(count), [count]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((star) => (
        <TwinklingStar key={star.key} star={star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#F5EED8',
  },
});
