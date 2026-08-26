import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { GOLD, GOLD_SOFT, NIGHT_CARD } from '@/theme/colors';

const SIZE = 260;
const CENTER = SIZE / 2;
const OUTER_R = 112;
const SIGN_LABEL_R = 94;
const MARKER_R = 72;
const INNER_R = 54;

const SUN_COLOR = '#E5C87A';
const MOON_COLOR = '#B9C4E0';

// Index order matches ZODIACS in @/services/zodiac (Koc, Boga, Ikizler, ...).
const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

function pointAt(longitudeDeg: number, radius: number) {
  const rad = (longitudeDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.sin(rad), y: CENTER - radius * Math.cos(rad) };
}

type Props = {
  sunLongitude: number;
  moonLongitude: number;
  risingLongitude: number;
};

export default function NatalChartWheel({ sunLongitude, moonLongitude, risingLongitude }: Props) {
  const segments = Array.from({ length: 12 }, (_, i) => i * 30);
  const sun = pointAt(sunLongitude, MARKER_R);
  const moon = pointAt(moonLongitude, MARKER_R);
  const rising = pointAt(risingLongitude, MARKER_R);

  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Circle cx={CENTER} cy={CENTER} r={OUTER_R} stroke={GOLD_SOFT} strokeWidth={1} fill={NIGHT_CARD} fillOpacity={0.5} />
      <Circle cx={CENTER} cy={CENTER} r={INNER_R} stroke={GOLD_SOFT} strokeWidth={1} fill="none" />

      {segments.map((deg) => {
        const outer = pointAt(deg, OUTER_R);
        const inner = pointAt(deg, INNER_R);
        return <Line key={deg} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={GOLD_SOFT} strokeWidth={1} />;
      })}

      {segments.map((deg, i) => {
        const pos = pointAt(deg + 15, SIGN_LABEL_R);
        return (
          <SvgText key={i} x={pos.x} y={pos.y} fontSize={15} fill={GOLD} textAnchor="middle" alignmentBaseline="middle">
            {ZODIAC_GLYPHS[i]}
          </SvgText>
        );
      })}

      <Line x1={CENTER} y1={CENTER} x2={sun.x} y2={sun.y} stroke={SUN_COLOR} strokeWidth={1.5} />
      <Circle cx={sun.x} cy={sun.y} r={11} fill="#0B0F2E" stroke={SUN_COLOR} strokeWidth={1.5} />
      <SvgText x={sun.x} y={sun.y} fontSize={12} fill={SUN_COLOR} textAnchor="middle" alignmentBaseline="middle">
        ☉
      </SvgText>

      <Line x1={CENTER} y1={CENTER} x2={moon.x} y2={moon.y} stroke={MOON_COLOR} strokeWidth={1.5} />
      <Circle cx={moon.x} cy={moon.y} r={11} fill="#0B0F2E" stroke={MOON_COLOR} strokeWidth={1.5} />
      <SvgText x={moon.x} y={moon.y} fontSize={12} fill={MOON_COLOR} textAnchor="middle" alignmentBaseline="middle">
        ☽
      </SvgText>

      <Line x1={CENTER} y1={CENTER} x2={rising.x} y2={rising.y} stroke={GOLD} strokeWidth={1.5} />
      <Circle cx={rising.x} cy={rising.y} r={13} fill="#0B0F2E" stroke={GOLD} strokeWidth={1.5} />
      <SvgText x={rising.x} y={rising.y} fontSize={9} fill={GOLD} textAnchor="middle" alignmentBaseline="middle">
        ASC
      </SvgText>
    </Svg>
  );
}
