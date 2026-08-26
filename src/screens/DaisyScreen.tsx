import { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TextInput, Pressable, StyleSheet, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MIN_PETALS = 9;
const MAX_PETALS = 17;

function randomPetalCount(): number {
  return MIN_PETALS + Math.floor(Math.random() * (MAX_PETALS - MIN_PETALS + 1));
}

export default function DaisyScreen() {
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [totalPetals, setTotalPetals] = useState(randomPetalCount());
  const [plucked, setPlucked] = useState(0);
  const pop = useRef(new Animated.Value(1)).current;

  const remaining = totalPetals - plucked;
  const finished = started && remaining === 0;
  const currentLabel = plucked % 2 === 0 ? 'Seviyor' : 'Sevmiyor';

  const begin = useCallback(() => {
    setTotalPetals(randomPetalCount());
    setPlucked(0);
    setStarted(true);
  }, []);

  const pluck = useCallback(() => {
    if (!started || remaining === 0) return;
    setPlucked((prev) => prev + 1);
    pop.setValue(1.15);
    Animated.timing(pop, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [started, remaining, pop]);

  const reset = useCallback(() => {
    setStarted(false);
    setPlucked(0);
  }, []);

  const questionLine = useMemo(() => {
    const target = name.trim();
    return target ? `${target} beni seviyor mu?` : 'Seni gerçekten seviyor mu?';
  }, [name]);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <Pressable onPress={begin} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
                <Ionicons name="flower-outline" size={18} color={NIGHT_CARD} />
                <Text style={styles.actionButtonText}>Papatyayı Kopar</Text>
              </Pressable>
            </>
          )}

          {started && (
            <>
              <Text style={styles.questionLine}>{questionLine}</Text>

              <Pressable onPress={pluck} disabled={finished} style={styles.flowerWrap}>
                <Animated.View style={{ transform: [{ scale: pop }] }}>
                  <Ionicons name="flower" size={110} color={GOLD} />
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
    marginBottom: 28,
    fontStyle: 'italic',
  },
  flowerWrap: {
    marginBottom: 20,
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
});
