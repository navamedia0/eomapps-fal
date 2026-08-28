import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Circle, Line, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, WALNUT } from '@/theme/colors';

type Props = { width?: number };

// Diamond lattice fill, generated rather than hand-authored so it scales to
// any card size — a classic "Bicycle-style" card-back texture, in the app's
// own gold-on-plum palette so it reads as part of Mistik Rehber rather than
// a generic borrowed asset.
function LatticePattern({ w, h }: { w: number; h: number }) {
  const step = 14;
  const lines: React.ReactNode[] = [];
  for (let x = -h; x < w + h; x += step) {
    lines.push(<Line key={`a-${x}`} x1={x} y1={0} x2={x + h} y2={h} stroke={GOLD} strokeOpacity={0.14} strokeWidth={1} />);
    lines.push(<Line key={`b-${x}`} x1={x} y1={h} x2={x + h} y2={0} stroke={GOLD} strokeOpacity={0.14} strokeWidth={1} />);
  }
  return <G>{lines}</G>;
}

// A proper "iskambil" (playing card) back design — double gold border, a
// woven lattice texture, four diamond accents at the compass points, and a
// star-crescent medallion at the center echoing the app's mystic motif.
// Used for the Katina (52-card) spread instead of the tarot-styled velvet
// back, since these are playing cards, not tarot cards.
export default function PlayingCardBack({ width = 92 }: Props) {
  const height = width / 0.6;
  const cx = width / 2;
  const cy = height / 2;
  const medallionR = width * 0.26;
  const diamondSize = width * 0.09;

  const compassPoints = [
    { x: cx, y: cy - medallionR - width * 0.16 },
    { x: cx, y: cy + medallionR + width * 0.16 },
    { x: cx - medallionR - width * 0.12, y: cy },
    { x: cx + medallionR + width * 0.12, y: cy },
  ];

  return (
    <View style={[styles.card, { width, height, borderRadius: width * 0.11 }]}>
      <LinearGradient
        colors={[WALNUT, NIGHT_CARD]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <LatticePattern w={width} h={height} />
        <Rect x={6} y={6} width={width - 12} height={height - 12} rx={width * 0.07} fill="none" stroke={GOLD} strokeWidth={1.4} />
        <Rect x={10} y={10} width={width - 20} height={height - 20} rx={width * 0.05} fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={0.8} />
        <Circle cx={cx} cy={cy} r={medallionR} fill={NIGHT_CARD} stroke={GOLD} strokeWidth={1.4} />
        <Circle cx={cx} cy={cy} r={medallionR - 4} fill="none" stroke={GOLD} strokeOpacity={0.5} strokeWidth={0.6} />
        {compassPoints.map((p, i) => (
          <Rect
            key={i}
            x={p.x - diamondSize / 2}
            y={p.y - diamondSize / 2}
            width={diamondSize}
            height={diamondSize}
            fill={GOLD}
            opacity={0.85}
            transform={`rotate(45 ${p.x} ${p.y})`}
          />
        ))}
      </Svg>
      <View
        pointerEvents="none"
        style={[
          styles.centerIcon,
          {
            width: medallionR * 1.4,
            height: medallionR * 1.4,
            top: cy - medallionR * 0.7,
            left: cx - medallionR * 0.7,
          },
        ]}
      >
        <MaterialCommunityIcons name="star-crescent" size={medallionR * 1.15} color={GOLD} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  centerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
