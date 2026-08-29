import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import FeatureIcon from '@/components/FeatureIcon';
import CornerTicks from '@/components/CornerTicks';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { getFunFortuneUsage, recordFunFortuneAttempt } from '@/services/funFortunesLimit';
import { FEATURE_ICONS } from '@/assets/icons';
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

const ROLL_DURATION = 950;

function randomFace(): number {
  return 1 + Math.floor(Math.random() * 6);
}

// A single tumbling die — spins on two axes with a bit of pseudo-3D
// perspective and a bounce on landing, and while it's mid-air the pip
// pattern flickers through random faces (like a real die tumbling too fast
// to read) before settling on the real result the parent already rolled.
function Die({ rolling, finalValue, delay }: { rolling: boolean; finalValue: number | null; delay: number }) {
  const [face, setFace] = useState(1);
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!rolling) return;
    let cancelled = false;
    rotateX.setValue(0);
    rotateY.setValue(0);
    bounce.setValue(0);

    const spinsX = 2 + Math.floor(Math.random() * 2);
    const spinsY = 2 + Math.floor(Math.random() * 2);
    const duration = ROLL_DURATION - delay;

    const startTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(rotateX, { toValue: spinsX, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rotateY, { toValue: spinsY, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1, duration: duration * 0.6, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bounce, { toValue: 0, duration: duration * 0.4, easing: Easing.bounce, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);

    const shuffle = setInterval(() => {
      if (!cancelled) setFace(randomFace());
    }, 90);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearInterval(shuffle);
    };
  }, [rolling, delay, rotateX, rotateY, bounce]);

  useEffect(() => {
    if (!rolling && finalValue) setFace(finalValue);
  }, [rolling, finalValue]);

  const rx = rotateX.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ry = rotateY.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const lift = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  const dots = DICE_DOTS[face] ?? DICE_DOTS[1];

  return (
    <Animated.View
      style={{
        transform: [{ perspective: 500 }, { translateY: lift }, { rotateX: rx }, { rotateY: ry }],
      }}
    >
      <View style={styles.die}>
        <View style={styles.dotGrid}>
          {dots.map((active, index) => (
            <View key={index} style={styles.dotCell}>
              {active && <View style={styles.dot} />}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

export default function DiceScreen() {
  const navigation = useNavigation<any>();
  const [values, setValues] = useState<[number, number] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    getFunFortuneUsage('zar').then(({ reachedLimit }) => {
      setLimitReached(reachedLimit);
    });
  }, []);

  const roll = useCallback(async () => {
    if (rolling) return;
    const res = await recordFunFortuneAttempt('zar');
    if (!res.allowed) {
      setLimitReached(true);
      return;
    }
    setValues(null);
    setRolling(true);
    const next: [number, number] = [randomFace(), randomFace()];
    setTimeout(() => {
      setValues(next);
      setRolling(false);
    }, ROLL_DURATION);
  }, [rolling]);

  const total = values ? values[0] + values[1] : null;

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.dice.background}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Zar Falı</Text>
        <Text style={styles.subtitle}>Zarları at, şansına bak.</Text>

        <View style={styles.diceRow}>
          <Die rolling={rolling} finalValue={values ? values[0] : null} delay={0} />
          <Die rolling={rolling} finalValue={values ? values[1] : null} delay={90} />
        </View>

        {total !== null && (
          <View style={styles.resultBox}>
            <Text style={styles.totalText}>Toplam: {total}</Text>
            <Text style={styles.flavorText}>{FLAVOR_BY_TOTAL[total]}</Text>
          </View>
        )}

        {limitReached ? (
          <View style={styles.limitCard}>
            <CornerTicks />
            <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={GOLD} />
            <Text style={styles.limitText}>Bugünlük bu kadar yeter, enerjini dinlendir. Yarın tekrar gel.</Text>
          </View>
        ) : (
          <Pressable
            onPress={roll}
            disabled={rolling}
            style={({ pressed }) => [styles.rollButton, (pressed || rolling) && styles.rollButtonPressed]}
          >
            <FeatureIcon source={FEATURE_ICONS.dice} fallback={<Ionicons name="dice-outline" size={18} color={NIGHT_CARD} />} size={32} />
            <Text style={styles.rollButtonText}>{rolling ? 'Zarlar dönüyor...' : values ? 'Yeniden At' : 'Zarları At'}</Text>
          </Pressable>
        )}
      </View>

      {total !== null && (
        <ParchmentReadingResult
          visible={true}
          badge="Zar Falı Kehaneti"
          sections={[
            {
              title: `Zarların Toplamı: ${total}`,
              body: `${FLAVOR_BY_TOTAL[total]}\n\nZarların enerjisi bugün senin için ${values ? `${values[0]} ve ${values[1]}` : ''} sayılarını getirdi. Evrenin akışında adımlarını bu sezgisel rehberlikle at.`,
            },
          ]}
          shareTextPrefix="Mistik Rehber - Zar Falım"
          parchmentBg={FORTUNE_THEMES.dice.resultBg}
          accentColor={FORTUNE_THEMES.dice.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={() => setValues(null)}
        />
      )}
      {FORTUNE_THEMES.dice.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.dice.figure}
          title={FORTUNE_THEMES.dice.splashTitle}
          subtitle={FORTUNE_THEMES.dice.splashSubtitle}
          accentColor={FORTUNE_THEMES.dice.accentColor}
          onFinish={() => setShowSplash(false)}
        />
      )}
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
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  rollButtonPressed: {
    opacity: 0.85,
  },
  rollButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  limitCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    width: '100%',
    maxWidth: 300,
  },
  limitText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    lineHeight: 19,
  },
});
