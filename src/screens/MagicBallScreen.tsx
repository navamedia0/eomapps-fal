import { useCallback, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TextInput, Pressable, StyleSheet, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import magicBallAnswers from '@/data/magic_ball_answers.json';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const ANSWERS: string[] = magicBallAnswers;

export default function MagicBallScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const ask = useCallback(() => {
    if (spinning) return;
    setAnswer(null);
    setSpinning(true);
    spin.setValue(0);

    Animated.parallel([
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.85, duration: 200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.08, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start(() => {
      setAnswer(ANSWERS[Math.floor(Math.random() * ANSWERS.length)]);
      setSpinning(false);
    });
  }, [spin, scale, spinning]);

  const spinRotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.wrap}>
          <Text style={styles.title}>Sihirli Küre</Text>
          <Text style={styles.subtitle}>Zihninde bir evet/hayır sorusu tut, küreye dokun.</Text>

          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Sorunu buraya yazabilirsin (isteğe bağlı)"
            placeholderTextColor={TEXT_MUTED}
            style={styles.input}
            editable={!spinning}
          />

          <Pressable onPress={ask} disabled={spinning} style={styles.orbWrap}>
            <Animated.View style={{ transform: [{ rotate: spinRotation }, { scale }] }}>
              <LinearGradient colors={[NIGHT_MID, NIGHT_DEEP]} style={styles.orb}>
                <View style={styles.orbInnerRing}>
                  {answer ? (
                    <Text style={styles.orbAnswerText}>{answer}</Text>
                  ) : (
                    <Ionicons name="sparkles" size={30} color={GOLD} />
                  )}
                </View>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <Text style={styles.hint}>
            {spinning ? 'Küre cevabı arıyor...' : answer ? 'Yeni bir soru için küreye tekrar dokun.' : 'Cevap için küreye dokun.'}
          </Text>
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
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
    marginBottom: 36,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  orbInnerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  orbAnswerText: {
    fontSize: 14.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 28,
    textAlign: 'center',
  },
});
