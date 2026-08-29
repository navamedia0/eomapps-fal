import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Phase = 'gate' | 'loading' | 'ready';

type Props = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  buttonLabel?: string;
  loadingLines?: string[];
  minLoadMs?: number;
  // 'loading' — bir önceki ekranda zaten bir "başla" butonuna basıldıysa
  // (ör. Keşif Salonu'nun giriş ekranı), burada tekrar buton göstermeden
  // doğrudan yükleme adımından başlar.
  initialPhase?: Phase;
  // Verilirse gate/loading aşamalarında sol üstte küçük, saydam bir "geri dön"
  // butonu gösterir. 'ready' aşamasında gösterilmez — içerik (children) kendi
  // çıkış kontrolünü kendi HUD'unda yönetir (ör. Keşif Salonu'nun savaş HUD'u).
  onExit?: () => void;
  children: ReactNode;
};

export default function GameEntryGate({
  title,
  subtitle,
  icon,
  buttonLabel = 'Başla',
  loadingLines = ['Hazırlanıyor…'],
  minLoadMs = 2600,
  initialPhase = 'gate',
  onExit,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [loadingLine] = useState(() => loadingLines[Math.floor(Math.random() * loadingLines.length)]);
  const progress = useRef(new Animated.Value(0)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (phase !== 'loading') return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: minLoadMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) setPhase('ready');
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, minLoadMs]);

  useEffect(() => {
    if (phase !== 'ready') return;
    Animated.parallel([
      Animated.timing(enterOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(enterScale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'ready') {
    return <Animated.View style={[styles.flex, { opacity: enterOpacity, transform: [{ scale: enterScale }] }]}>{children}</Animated.View>;
  }

  return (
    <MysticTableBackground>
      {onExit && (
        <Pressable onPress={onExit} style={[styles.exitButton, { top: insets.top + 8 }]} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={GOLD} />
        </Pressable>
      )}
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={44} color={GOLD} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {phase === 'gate' && (
          <Pressable
            onPress={() => setPhase('loading')}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="play" size={18} color="#1a0d33" />
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        )}

        {phase === 'loading' && (
          <View style={styles.loadingWrap}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
              />
            </View>
            <Text style={styles.loadingText}>{loadingLine}</Text>
          </View>
        )}
      </View>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  exitButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 17, 64, 0.8)',
    borderWidth: 1.4,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 14,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1.4,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginTop: 8,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a0d33',
  },
  loadingWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
  loadingText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
});
