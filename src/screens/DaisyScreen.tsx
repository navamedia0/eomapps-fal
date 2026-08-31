import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, TextInput, Pressable, StyleSheet, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
import { getFunFortuneUsage, recordFunFortuneAttempt } from '@/services/funFortunesLimit';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MIN_PETALS = 13;
const MAX_PETALS = 20;
const FLOWER_SIZE = 240;
const PETAL_WIDTH = 15;
const PETAL_HEIGHT = 52;
const PETAL_TOP_OFFSET = FLOWER_SIZE / 2 - PETAL_HEIGHT - 26;

function randomPetalCount(): number {
  return MIN_PETALS + Math.floor(Math.random() * (MAX_PETALS - MIN_PETALS + 1));
}

type PetalProps = { angle: number; anim: Animated.Value };

function Petal({ angle, anim }: PetalProps) {
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-55, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={[styles.petalPivot, { transform: [{ rotate: `${angle}deg` }] }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.petal,
          {
            top: PETAL_TOP_OFFSET,
            opacity: anim,
            transform: [{ translateY }, { scale }],
          },
        ]}
      />
    </View>
  );
}

export default function DaisyScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [totalPetals, setTotalPetals] = useState(randomPetalCount());
  const [plucked, setPlucked] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const pop = useRef(new Animated.Value(1)).current;
  const petalAnimsRef = useRef<Animated.Value[]>([]);

  useEffect(() => {
    getFunFortuneUsage('papatya').then(({ reachedLimit }) => {
      setLimitReached(reachedLimit);
    });
  }, []);

  const remaining = totalPetals - plucked;
  const finished = started && remaining === 0;
  const currentLabel = plucked % 2 === 0 ? 'Seviyor' : 'Sevmiyor';

  const begin = useCallback(async () => {
    const res = await recordFunFortuneAttempt('papatya');
    if (!res.allowed) {
      setLimitReached(true);
      return;
    }
    const count = randomPetalCount();
    petalAnimsRef.current = Array.from({ length: count }, () => new Animated.Value(1));
    setTotalPetals(count);
    setPlucked(0);
    setStarted(true);
  }, []);

  const pluck = useCallback(() => {
    if (!started || remaining === 0) return;
    const anim = petalAnimsRef.current[plucked];
    if (anim) {
      Animated.timing(anim, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
    pop.setValue(1.1);
    Animated.timing(pop, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    setPlucked((prev) => prev + 1);
  }, [started, remaining, plucked, pop]);

  const reset = useCallback(() => {
    setStarted(false);
    setPlucked(0);
  }, []);

  const questionLine = useMemo(() => {
    const target = name.trim();
    return target ? `${target} beni seviyor mu?` : 'Seni gerçekten seviyor mu?';
  }, [name]);

  return (
    <MysticTableBackground customBackground={FORTUNE_THEMES.daisy.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.wrap}>
          <Text style={styles.title}>Papatya Falı</Text>

          {!started && (
            <>
              <Text style={styles.subtitle}>Kimi düşünüyorsun? (isteğe bağlı)</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="İsim yazabilirsin"
                placeholderTextColor={TEXT_MUTED}
                style={styles.input}
              />
              {limitReached ? (
                <View style={styles.limitCard}>
                  <CornerTicks />
                  <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={GOLD} />
                  <Text style={styles.limitText}>Bugünlük bu kadar yeter, enerjini dinlendir. Yarın tekrar gel.</Text>
                </View>
              ) : (
                <Pressable onPress={begin} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                  <Ionicons name="flower-outline" size={18} color={NIGHT_CARD} />
                  <Text style={styles.actionButtonText}>Papatyayı Kopar</Text>
                </Pressable>
              )}
            </>
          )}

          {started && (
            <>
              <Text style={styles.questionLine}>{questionLine}</Text>

              <Pressable onPress={pluck} disabled={finished} style={styles.flowerWrap}>
                {Array.from({ length: totalPetals }, (_, index) => (
                  <Petal key={index} angle={(360 / totalPetals) * index} anim={petalAnimsRef.current[index]} />
                ))}
                <Animated.View style={[styles.flowerCenter, { transform: [{ scale: pop }] }]}>
                  <View style={styles.flowerCenterInner} />
                </Animated.View>
              </Pressable>

              <Text style={[styles.label, currentLabel === 'Sevmiyor' && styles.labelNegative]}>
                {finished ? currentLabel : remaining > 0 ? currentLabel : ''}
              </Text>

              {!finished && <Text style={styles.remainingHint}>{remaining} yaprak kaldı</Text>}

              {finished && (
                <View style={styles.resultBox}>
                  <Ionicons
                    name={currentLabel === 'Seviyor' ? 'heart' : 'heart-dislike-outline'}
                    size={26}
                    color={currentLabel === 'Seviyor' ? GOLD : TEXT_MUTED}
                  />
                  <Text style={styles.resultText}>
                    {currentLabel === 'Seviyor'
                      ? 'Son yaprak "seviyor" dedi. Kalbin bugün rahat olsun.'
                      : 'Son yaprak "sevmiyor" dedi. Ama unutma, bu sadece bir oyun — kalbin en doğru cevabı zaten biliyor.'}
                  </Text>
                  <Pressable onPress={reset} style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.actionButtonPressed]}>
                    <Ionicons name="refresh" size={16} color={GOLD} />
                    <Text style={styles.actionButtonSecondaryText}>Yeniden Dene</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {finished && (
        <ParchmentReadingResult
          visible={true}
          badge="Papatya Falı Kehaneti"
          sections={[
            {
              title: `Papatya Cevabı: ${currentLabel}`,
              body: currentLabel === 'Seviyor'
                ? 'Son yaprak "seviyor" dedi. Kalbin bugün rahat olsun. Gönlündeki kişinin hisleri ve evrenin saf enerjisi seninle rezonans içinde.'
                : 'Son yaprak "sevmiyor" dedi. Ama unutma, bu sadece bir oyun — kalbin en derin gerçeği ve doğru cevabı zaten biliyor.',
            },
          ]}
          shareTextPrefix="Mistik Rehber - Papatya Falım"
          parchmentBg={FORTUNE_THEMES.daisy.resultBg}
          accentColor={FORTUNE_THEMES.daisy.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={reset}
        />
      )}
      {FORTUNE_THEMES.daisy.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={FORTUNE_THEMES.daisy.figure}
          title={FORTUNE_THEMES.daisy.splashTitle}
          subtitle={FORTUNE_THEMES.daisy.splashSubtitle}
          accentColor={FORTUNE_THEMES.daisy.accentColor}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  questionLine: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  flowerWrap: {
    width: FLOWER_SIZE,
    height: FLOWER_SIZE,
    marginBottom: 20,
  },
  petalPivot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FLOWER_SIZE,
    height: FLOWER_SIZE,
  },
  petal: {
    position: 'absolute',
    left: FLOWER_SIZE / 2 - PETAL_WIDTH / 2,
    width: PETAL_WIDTH,
    height: PETAL_HEIGHT,
    borderRadius: PETAL_WIDTH,
    backgroundColor: '#FFFEFB',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  flowerCenter: {
    position: 'absolute',
    top: FLOWER_SIZE / 2 - 28,
    left: FLOWER_SIZE / 2 - 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  flowerCenterInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#B8862E',
    opacity: 0.4,
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
    minHeight: 30,
  },
  labelNegative: {
    color: TEXT_MUTED,
  },
  remainingHint: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 8,
  },
  resultBox: {
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 18,
    padding: 20,
  },
  resultText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  actionButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: GOLD,
  },
  limitCard: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 32, 0.92)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    width: '100%',
  },
  limitText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    lineHeight: 19,
  },
});
