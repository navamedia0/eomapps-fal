import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

type ParticleProps = {
  active: boolean;
  angle: number;
  radius: number;
  color: string;
  delay: number;
};

function Particle({ active, angle, radius, color, delay }: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [active, delay, progress]);

  const style = useAnimatedStyle(() => {
    const dx = Math.cos(angle) * radius * progress.value;
    const dy = Math.sin(angle) * radius * progress.value;
    return {
      opacity: 1 - progress.value,
      transform: [{ translateX: dx }, { translateY: dy }, { scale: 1 - progress.value * 0.5 }],
    };
  });

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

type Props = {
  /** Toggle true to fire the burst; component re-fires each time it flips to true. */
  active: boolean;
  color?: string;
  count?: number;
  radius?: number;
};

/** Small radiating particle burst — a lightweight, dependency-free stand-in for a Lottie "win" effect. */
export default function SparkleBurst({ active, color = '#F2C879', count = 10, radius = 46 }: Props) {
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ angle: (i / count) * Math.PI * 2, delay: (i % 3) * 18 })),
    [count],
  );

  return (
    <View pointerEvents="none" style={styles.center}>
      {particles.map((p, i) => (
        <Particle key={i} active={active} angle={p.angle} radius={radius} color={color} delay={p.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
