import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const PHASES = [
  { label: 'Nefes Al', scaleTo: 1.4 },
  { label: 'Tut', scaleTo: 1.4 },
  { label: 'Ver', scaleTo: 1 },
  { label: 'Tut', scaleTo: 1 },
];
const PHASE_SECONDS = 4;
const CYCLE_SECONDS = PHASES.length * PHASE_SECONDS;
const DURATION_OPTIONS = [1, 3, 5];

export default function BreathingExerciseScreen() {
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const totalSeconds = selectedMinutes * 60;
  const cyclePos = elapsedSeconds % CYCLE_SECONDS;
  const phaseIndexNow = Math.floor(cyclePos / PHASE_SECONDS);
  const phaseSecondsLeft = PHASE_SECONDS - (cyclePos % PHASE_SECONDS);
  const currentPhase = PHASES[phaseIndexNow];

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          setRunning(false);
          setCompleted(true);
          return totalSeconds;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, totalSeconds]);

  useEffect(() => {
    if (!running) return;
    Animated.timing(scale, {
      toValue: currentPhase.scaleTo,
      duration: PHASE_SECONDS * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndexNow, running]);

  const start = useCallback(() => {
    setElapsedSeconds(0);
    setCompleted(false);
    scale.setValue(1);
    setRunning(true);
  }, [scale]);

  const stop = useCallback(() => {
    setRunning(false);
    setElapsedSeconds(0);
    setCompleted(false);
    scale.setValue(1);
  }, [scale]);

  const remainingLabel = `${Math.floor((totalSeconds - elapsedSeconds) / 60)}:${String((totalSeconds - elapsedSeconds) % 60).padStart(2, '0')}`;

  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <Text style={styles.title}>Nefes Egzersizi</Text>
        <Text style={styles.subtitle}>4-4-4-4 kutu nefes tekniği</Text>

        <View style={styles.circleWrap}>
          <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
            {running ? (
              <>
                <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
                <Text style={styles.phaseCountdown}>{phaseSecondsLeft}</Text>
              </>
            ) : (
              <Ionicons name="leaf-outline" size={36} color={GOLD} />
            )}
          </Animated.View>
        </View>

        {running && <Text style={styles.remainingText}>Kalan süre: {remainingLabel}</Text>}

        {completed && <Text style={styles.completedText}>Harika, egzersizi tamamladın 🌙</Text>}

        {!running && (
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => setSelectedMinutes(minutes)}
                style={[styles.durationChip, selectedMinutes === minutes && styles.durationChipSelected]}
              >
                <Text style={[styles.durationChipText, selectedMinutes === minutes && styles.durationChipTextSelected]}>
                  {minutes} dk
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={running ? stop : start}
          style={({ pressed }) => [styles.actionButton, running && styles.stopButton, pressed && styles.actionButtonPressed]}
        >
          <Ionicons name={running ? 'stop-circle-outline' : 'play-circle-outline'} size={20} color={running ? GOLD : NIGHT_CARD} />
          <Text style={[styles.actionButtonText, running && styles.stopButtonText]}>{running ? 'Durdur' : 'Başla'}</Text>
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
    marginBottom: 32,
  },
  circleWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  phaseCountdown: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  remainingText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginBottom: 24,
  },
  completedText: {
    fontSize: 13.5,
    color: GOLD,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  durationChip: {
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  durationChipSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  durationChipText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },
  durationChipTextSelected: {
    color: NIGHT_CARD,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  stopButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  stopButtonText: {
    color: GOLD,
  },
});
