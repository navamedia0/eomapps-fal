import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import CornerTicks from '@/components/CornerTicks';
import { getFunFortuneUsage, recordFunFortuneAttempt } from '@/services/funFortunesLimit';
import magicBallAnswers from '@/data/magic_ball_answers.json';
import { FEATURE_ICONS } from '@/assets/icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const ANSWERS: string[] = magicBallAnswers;

export default function MagicBallScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getFunFortuneUsage('kure').then(({ reachedLimit }) => {
      setLimitReached(reachedLimit);
    });
  }, []);

  const ask = useCallback(async () => {
    if (spinning) return;
    const res = await recordFunFortuneAttempt('kure');
    if (!res.allowed) {
      setLimitReached(true);
      return;
    }
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

          {limitReached ? (
            <View style={styles.limitCard}>
              <CornerTicks />
              <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={GOLD} />
              <Text style={styles.limitText}>Bugünlük bu kadar yeter, enerjini dinlendir. Yarın tekrar gel.</Text>
            </View>
          ) : (
            <Pressable onPress={ask} disabled={spinning} style={styles.orbWrap}>
              <Animated.View style={{ transform: [{ rotate: spinRotation }, { scale }] }}>
                {/* Mor sınır çizgisine kadar kırparak dıştaki siyah kare köşeleri yok eder */}
                <View style={styles.orbClip}>
                  <Image source={FEATURE_ICONS.magicBall} style={styles.orb} resizeMode="cover" />
                </View>
              </Animated.View>
            </Pressable>
          )}

          {/* Kürenin cevabı: Kürenin altında belirgin ve okunaklı kart */}
          {answer ? (
            <View style={styles.answerCard}>
              <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD_SOFT} />
              <Text style={styles.answerText}>{answer}</Text>
              <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD_SOFT} />
            </View>
          ) : null}

          <Text style={[styles.hint, answer ? styles.hintWithAnswer : null]}>
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
    marginBottom: 20,
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
    marginBottom: 28,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbClip: {
    width: 196,
    height: 196,
    borderRadius: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  orb: {
    width: 244,
    height: 244,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.45)',
    backgroundColor: 'rgba(24, 14, 48, 0.85)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    maxWidth: '92%',
  },
  answerText: {
    fontSize: 16.5,
    lineHeight: 22,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 24,
    textAlign: 'center',
  },
  hintWithAnswer: {
    marginTop: 18,
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
    marginVertical: 14,
    width: '100%',
    maxWidth: 320,
  },
  limitText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
    lineHeight: 19,
  },
});
