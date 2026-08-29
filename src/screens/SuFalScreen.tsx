import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import Starfield from '@/components/Starfield';
import messages from '@/data/su_fali_mesajlari.json';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const MESSAGES: string[] = messages;
const ORB_SIZE = 210;

export default function SuFalScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [rippling, setRippling] = useState(false);
  const ripple = useRef(new Animated.Value(0)).current;
  const swirl = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(swirl, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [swirl]);

  const ask = useCallback(() => {
    if (rippling) return;
    setRippling(true);
    setMessage(null);
    ripple.setValue(0);
    flash.setValue(0);

    Animated.parallel([
      Animated.timing(ripple, { toValue: 1, duration: 1300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start(() => {
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setRippling(false);
    });
  }, [rippling, ripple, flash]);

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.25, 0] });
  const swirlRotate = swirl.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const swirlRotateReverse = swirl.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <Text style={styles.title}>Su Falı</Text>
        <Text style={styles.subtitle}>Suya dokun, içinden bir soru geçir.</Text>

        <Pressable onPress={ask} disabled={rippling} style={styles.orbTouchArea}>
          <Animated.View style={[styles.ripple, { opacity: rippleOpacity, transform: [{ scale: rippleScale }] }]} />
          <View style={styles.orb}>
            <LinearGradient colors={['#0B1E3A', '#0E2C4A', '#0A1730']} style={StyleSheet.absoluteFillObject} />
            <Animated.View style={[styles.swirlLayer, { transform: [{ rotate: swirlRotate }] }]}>
              <LinearGradient
                colors={['rgba(90, 170, 220, 0.35)', 'rgba(90, 170, 220, 0)']}
                style={styles.swirlBlobA}
              />
            </Animated.View>
            <Animated.View style={[styles.swirlLayer, { transform: [{ rotate: swirlRotateReverse }] }]}>
              <LinearGradient
                colors={['rgba(242, 200, 121, 0.22)', 'rgba(242, 200, 121, 0)']}
                style={styles.swirlBlobB}
              />
            </Animated.View>
            <Starfield count={7} />
            <Animated.View style={[styles.flash, { opacity: flashOpacity }]} pointerEvents="none" />
            <View style={styles.glassHighlight} />
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
  orbTouchArea: {
    width: ORB_SIZE + 30,
    height: ORB_SIZE + 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ripple: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 2,
    borderColor: GOLD,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  swirlLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  swirlBlobA: {
    position: 'absolute',
    top: -ORB_SIZE * 0.25,
    left: -ORB_SIZE * 0.15,
    width: ORB_SIZE * 0.95,
    height: ORB_SIZE * 0.95,
    borderRadius: ORB_SIZE,
  },
  swirlBlobB: {
    position: 'absolute',
    bottom: -ORB_SIZE * 0.3,
    right: -ORB_SIZE * 0.2,
    width: ORB_SIZE * 0.8,
    height: ORB_SIZE * 0.8,
    borderRadius: ORB_SIZE,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F0FF',
  },
  glassHighlight: {
    position: 'absolute',
    top: ORB_SIZE * 0.1,
    left: ORB_SIZE * 0.18,
    width: ORB_SIZE * 0.28,
    height: ORB_SIZE * 0.14,
    borderRadius: ORB_SIZE * 0.14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ rotate: '-25deg' }],
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
    fontSize: 15.5,
    lineHeight: 25.5,
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
