import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { scrollY?: Animated.Value };

// A soft pulsing / slowly rotating light layered over the crystal orb in the
// general background photo, so it reads as genuinely alive rather than a
// static picture. When scrollY is supplied it also drifts slightly with
// scroll for a subtle parallax depth cue.
export default function OrbGlow({ scrollY }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }),
    );
    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const parallax = scrollY
    ? scrollY.interpolate({ inputRange: [0, 400], outputRange: [0, -30], extrapolate: 'clamp' })
    : 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { transform: [{ translateY: parallax }] }]}
    >
      <Animated.View style={{ opacity: glowOpacity, transform: [{ scale: glowScale }] }}>
        <LinearGradient
          colors={['rgba(140, 200, 255, 0.55)', 'rgba(90, 150, 255, 0.18)', 'rgba(90, 150, 255, 0)']}
          style={styles.glow}
        />
      </Animated.View>
      <Animated.View style={[styles.swirl, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.swirlGradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

const ORB_SIZE = 150;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    marginLeft: -ORB_SIZE / 2,
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  swirl: {
    position: 'absolute',
    width: ORB_SIZE * 0.6,
    height: ORB_SIZE * 0.6,
    borderRadius: (ORB_SIZE * 0.6) / 2,
    overflow: 'hidden',
  },
  swirlGradient: {
    width: '100%',
    height: '100%',
  },
});
