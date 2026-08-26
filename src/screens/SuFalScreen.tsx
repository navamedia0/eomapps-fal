import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import messages from '@/data/su_fali_mesajlari.json';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MESSAGES: string[] = messages;

export default function SuFalScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [rippling, setRippling] = useState(false);
  const ripple = useRef(new Animated.Value(0)).current;

  const ask = useCallback(() => {
    if (rippling) return;
    setRippling(true);
    setMessage(null);
    ripple.setValue(0);

    Animated.timing(ripple, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setRippling(false);
    });
  }, [rippling, ripple]);

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.2, 0] });

  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <Text style={styles.title}>Su Falı</Text>
        <Text style={styles.subtitle}>Suya dokun, içinden bir soru geçir.</Text>

        <Pressable onPress={ask} disabled={rippling} style={styles.bowlWrap}>
          <Animated.View style={[styles.ripple, { opacity: rippleOpacity, transform: [{ scale: rippleScale }] }]} />
          <View style={styles.bowl}>
            <Ionicons name="water" size={34} color={GOLD} />
          </View>
        </Pressable>

        {message && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{message}</Text>
            <View style={styles.shareRow}>
              <ShareButton text={`Mistik Rehber - Su Falı\n\n${message}`} />
            </View>
          </View>
        )}

        <Text style={styles.hint}>{rippling ? 'Sular durulmaya çalışıyor...' : message ? 'Yeniden sormak için suya tekrar dokun.' : 'Cevap için suya dokun.'}</Text>
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 32,
    textAlign: 'center',
  },
  bowlWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ripple: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: GOLD,
  },
  bowl: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: NIGHT_MID,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
    marginBottom: 16,
    maxWidth: 320,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  shareRow: {
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});
