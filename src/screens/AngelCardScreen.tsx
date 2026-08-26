import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import { getDailyAngelCard, hasTodaysAngelCard, type AngelCard } from '@/services/angelCardCache';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AngelCard'>;

type Phase = 'checking' | 'mood' | 'reveal';

const MOODS: Array<{ key: string; emoji: string; label: string }> = [
  { key: 'mutlu', emoji: '😊', label: 'Mutluyum' },
  { key: 'uzgun', emoji: '😔', label: 'Üzgünüm' },
  { key: 'kaygili', emoji: '😟', label: 'Kaygılıyım' },
  { key: 'yorgun', emoji: '😴', label: 'Yorgunum' },
  { key: 'kizgin', emoji: '😡', label: 'Kızgınım' },
  { key: 'karisik', emoji: '🤯', label: 'Karışığım' },
];

export default function AngelCardScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [card, setCard] = useState<AngelCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hasTodaysAngelCard().then((has) => {
      if (has) {
        getDailyAngelCard().then((c) => {
          setCard(c);
          setPhase('reveal');
        });
      } else {
        setPhase('mood');
      }
    });
  }, []);

  const chooseMood = useCallback((moodKey?: string) => {
    getDailyAngelCard(moodKey).then((c) => {
      setCard(c);
      setPhase('reveal');
    });
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    if (phase === 'reveal' && !revealed) loop.start();
    return () => loop.stop();
  }, [phase, revealed, glow]);

  const reveal = useCallback(() => {
    if (revealed) return;
    setRevealed(true);
    Animated.timing(flip, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [flip, revealed]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const cardScale = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.92, 1] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  if (phase === 'checking') {
    return <MysticTableBackground><View style={styles.wrap} /></MysticTableBackground>;
  }

  if (phase === 'mood') {
    return (
      <MysticTableBackground>
        <View style={styles.wrap}>
          <Text style={styles.title}>Bugün nasıl hissediyorsun?</Text>
          <Text style={styles.subtitle}>Sana en uygun kartı seçmeme yardımcı olur.</Text>

          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <Pressable key={mood.key} onPress={() => chooseMood(mood.key)} style={styles.moodChip}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => chooseMood(undefined)} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Sadece kartımı göster</Text>
          </Pressable>
        </View>
      </MysticTableBackground>
    );
  }

  return (
    <MysticTableBackground>
      <View style={styles.wrap}>
        <Text style={styles.title}>Günün İlham Kartı</Text>
        <Text style={styles.subtitle}>Kalbini aç ve karta dokun.</Text>

        <Pressable onPress={reveal} disabled={revealed} style={styles.cardWrap}>
          <Animated.View style={[styles.card, styles.cardBack, { opacity: backOpacity, transform: [{ scale: cardScale }] }]}>
            <Animated.View style={{ opacity: revealed ? 1 : glowOpacity }}>
              <MaterialCommunityIcons name="star-crescent" size={44} color={GOLD} />
            </Animated.View>
            <Text style={styles.backHint}>Dokunmak için hazır ol</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { opacity: frontOpacity, transform: [{ scale: cardScale }] },
            ]}
            pointerEvents="none"
          >
            {card && (
              <>
                <Ionicons name="rose-outline" size={36} color={GOLD} />
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardMessage}>{card.message}</Text>
              </>
            )}
          </Animated.View>
        </Pressable>

        {revealed && card && (
          <>
            <Text style={styles.comeBackHint}>Yeni bir kart için yarın tekrar gel ✨</Text>
            <View style={styles.actionsRow}>
              <ShareButton text={`Mistik Rehber - Günün İlham Kartı: ${card.name}\n\n${card.message}`} />
              <Pressable
                onPress={() => navigation.navigate('Home')}
                style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
              >
                <Ionicons name="home-outline" size={16} color={GOLD} />
                <Text style={styles.newButtonText}>Ana Sayfaya Dön</Text>
              </Pressable>
            </View>
          </>
        )}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 36,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  moodChip: {
    width: '29%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 11,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textDecorationLine: 'underline',
  },
  cardWrap: {
    width: '100%',
    aspectRatio: 0.68,
    maxWidth: 260,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: NIGHT_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 20,
  },
  cardBack: {},
  backHint: {
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  cardFront: {},
  cardName: {
    fontSize: 19,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  cardMessage: {
    fontSize: 13.5,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  comeBackHint: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 28,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1.6,
    flexBasis: 0,
  },
  newButtonPressed: {
    opacity: 0.85,
  },
  newButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
});
