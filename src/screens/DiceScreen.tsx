import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const DICE_DOTS: Record<number, boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

const FLAVOR_BY_TOTAL: Record<number, string> = {
  2: 'Çok düşük bir başlangıç ama her şey buradan yükselir.',
  3: 'Küçük bir şans kıpırtısı seni bekliyor.',
  4: 'Dengeli bir gün, sürprizlere açık ol.',
  5: 'Enerjin orta karar ama niyetin güçlü.',
  6: 'Küçük bir fırsat kapını çalabilir.',
  7: 'Klasik şans sayısı! Bugün senden yana.',
  8: 'İyiye işaret, ilerleme zamanı.',
  9: 'Bolluk ve bereket enerjisi seninle.',
  10: 'Güçlü bir gün, cesur adımlar at.',
  11: 'Beklenmedik bir güzellik kapıda.',
  12: 'Zarların en yükseği! Bugün şanslı gününde olabilirsin.',
};

function DiceFace({ value }: { value: number }) {
  const dots = DICE_DOTS[value] ?? DICE_DOTS[1];
  return (
    <View style={styles.die}>
      <View style={styles.dotGrid}>
        {dots.map((active, index) => (
          <View key={index} style={styles.dotCell}>
            {active && <View style={styles.dot} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DiceScreen() {
  const [values, setValues] = useState<[number, number] | null>(null);
  const [rolling, setRolling] = useState(false);
  const rotate = useRef(new Animated.Value(0)).current;

  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setValues(null);
    rotate.setValue(0);

    Animated.timing(rotate, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setValues([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
      setRolling(false);
    });
  }, [rolling, rotate]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });
  const total = values ? values[0] + values[1] : null;

  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <Text style={styles.title}>Zar Falı</Text>
        <Text style={styles.subtitle}>Zarları at, şansına bak.</Text>

        <Animated.View style={[styles.diceRow, { transform: [{ rotate: spin }] }]}>
          <DiceFace value={values ? values[0] : 1} />
          <DiceFace value={values ? values[1] : 1} />
        </Animated.View>

        {total !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.totalText}>Toplam: {total}</Text>
            <Text style={styles.flavorText}>{FLAVOR_BY_TOTAL[total]}</Text>
          </View>
        )}

        <Pressable onPress={roll} disabled={rolling} style={({ pressed }) => [styles.rollButton, pressed && styles.rollButtonPressed]}>
          <Ionicons name="dice-outline" size={18} color={NIGHT_CARD} />
          <Text style={styles.rollButtonText}>{values ? 'Yeniden At' : 'Zarları At'}</Text>
        </Pressable>
      </View>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginBottom: 36,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 28,
  },
  die: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 10,
  },
  dotGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dotCell: {
    width: '33.33%',
    height: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD,
  },
  resultBox: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    maxWidth: 300,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  flavorText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 19,
  },
  rollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  rollButtonPressed: {
    opacity: 0.85,
  },
  rollButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
});
