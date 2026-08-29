import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

type Props = { value: number; style?: StyleProp<TextStyle>; durationMs?: number };

// Bakiye ilk yüklendiğinde (mount olur olmaz) gerçek değere hemen oturur,
// sadece SONRAKİ değişikliklerde (satın alma vb.) yavaşça sayarak yükselir.
// Bunun doğru çalışması için çağıran taraf, veri gerçekten yüklenene kadar bu
// bileşeni hiç MONTE ETMEMELİ (örn. "coinsLoaded ? <AnimatedNumberText .../> :
// <Text>—</Text>") — aksi halde ilk yüklemede de sahte bir sayma animasyonu
// oynar.
export default function AnimatedNumberText({ value, style, durationMs }: Props) {
  const display = useAnimatedCounter(value, durationMs);
  return <Text style={style}>{display}</Text>;
}
