import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  /** The real symbol this reel must land on. */
  finalSymbol: string;
  /** Pool of symbols to flash through while "spinning" (casino reel blur). */
  spinPool: string[];
  /** Stagger offset in ms before this reel starts — lets multiple reels land one after another. */
  delay?: number;
  /** Glow ring color shown on landing. */
  glowColor?: string;
  /** Fires once the reel has landed on finalSymbol. */
  onSettled?: () => void;
  /** Renders the current symbol; isSettled tells you whether it's the real, final draw. */
  renderSymbol: (symbol: string, isSettled: boolean) => ReactNode;
};

/**
 * Slot-reel / case-opening style reveal: rapidly cycles through random symbols,
 * decelerates, and locks onto the real result with a glow + bounce.
 */
export default function ReelRevealFX({ finalSymbol, spinPool, delay = 0, glowColor = '#F2C879', onSettled, renderSymbol }: Props) {
  const [displaySymbol, setDisplaySymbol] = useState(spinPool[0] ?? finalSymbol);
  const [settled, setSettled] = useState(false);

  const containerOpacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const glow = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setSettled(false);

    containerOpacity.value = withDelay(delay, withTiming(1, { duration: 140 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }));

    // Fewer, more widely-spaced ticks: each tick forces a re-render (setState),
    // and with several reels spinning at once (e.g. a 5-stone rune cross) their
    // JS-thread ticks used to overlap heavily and drop frames. This keeps the
    // same decelerating feel with ~30% less render churn.
    const totalTicks = 9;
    let tickCount = 0;

    const tick = () => {
      if (cancelled) return;
      tickCount++;
      const progress = tickCount / totalTicks;
      const nextInterval = 60 + progress * progress * 170; // decelerating "reel" rhythm

      if (tickCount < totalTicks) {
        const pool = spinPool.length > 0 ? spinPool : [finalSymbol];
        setDisplaySymbol(pool[Math.floor(Math.random() * pool.length)]);
        timer = setTimeout(tick, nextInterval);
      } else {
        setDisplaySymbol(finalSymbol);
        setSettled(true);
        scale.value = withSequence(
          withTiming(1.3, { duration: 130, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 260, easing: Easing.out(Easing.back(1.8)) }),
        );
        glow.value = withSequence(withTiming(1, { duration: 150 }), withTiming(0.35, { duration: 550 }));
        onSettled?.();
      }
    };

    timer = setTimeout(tick, delay + 90);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalSymbol]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    shadowOpacity: glow.value,
  }));

  return (
    <Animated.View style={containerStyle}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glowRing, { borderColor: glowColor, shadowColor: glowColor }, glowStyle]}
      />
      {renderSymbol(displaySymbol, settled)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 999,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
});
