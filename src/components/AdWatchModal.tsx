import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = { visible: boolean; durationSeconds?: number; onComplete: () => void };

export default function AdWatchModal({ visible, durationSeconds = 5, onComplete }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(durationSeconds);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: durationSeconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    const timeout = setTimeout(() => {
      onCompleteRef.current();
    }, durationSeconds * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [visible, durationSeconds, progress]);

  const widthPct = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Ionicons name="play-circle" size={48} color={GOLD} />
          <Text style={styles.title}>Reklam gösteriliyor...</Text>
          <Text style={styles.countdown}>{secondsLeft}</Text>
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { width: widthPct }]} />
          </View>
          <Text style={styles.hint}>Ödülünü almak için bekle</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 14,
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  countdown: {
    fontSize: 40,
    fontWeight: '700',
    color: GOLD,
  },
  barTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 3,
  },
  hint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
});
