import { View, StyleSheet } from 'react-native';
import { GOLD_SOFT } from '@/theme/colors';

const TICK = 14;

// Ornamental corner brackets used on "big box" mystic content cards, adapted
// from the Cosmic Gold content-block reference design.
export default function CornerTicks() {
  return (
    <>
      <View style={[styles.tick, styles.topLeft]} pointerEvents="none" />
      <View style={[styles.tick, styles.topRight]} pointerEvents="none" />
      <View style={[styles.tick, styles.bottomLeft]} pointerEvents="none" />
      <View style={[styles.tick, styles.bottomRight]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  tick: {
    position: 'absolute',
    width: TICK,
    height: TICK,
    borderColor: GOLD_SOFT,
  },
  topLeft: { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1, borderTopLeftRadius: 6 },
  topRight: { top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1, borderTopRightRadius: 6 },
  bottomLeft: { bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1, borderBottomLeftRadius: 6 },
  bottomRight: { bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1, borderBottomRightRadius: 6 },
});
