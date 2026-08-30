import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Pressable,
  Dimensions,
  Vibration,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RUNE_ASSETS } from '@/assets/runes';
import RuneStoneItem from './RuneStoneItem';
import SparkleBurst from '@/components/effects/SparkleBurst';
import { type Rune } from '@/services/runeEngine';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_MUTED, TEXT_PRIMARY } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  runes: Rune[];
  positions: string[];
  onComplete?: () => void;
  onInspectRune?: (rune: Rune, positionLabel: string) => void;
};

export default function RunePouchExperience({
  runes,
  positions,
  onComplete,
  onInspectRune,
}: Props) {
  // Stages: 'waiting_touch' (A1) -> 'pouring' (A2) -> 'settled' (A3/A4)
  const [stage, setStage] = useState<'waiting_touch' | 'pouring' | 'settled'>('waiting_touch');
  const [revealedCount, setRevealedCount] = useState<number>(0);

  // A1 Breath Animation
  const breathAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pouchGlowAnim = useRef(new Animated.Value(0.3)).current;

  // A2 Pouring Animation
  const pouchRotateAnim = useRef(new Animated.Value(0)).current;
  const pouchFadeAnim = useRef(new Animated.Value(1)).current;

  // Individual Stone Animation Arrays
  const stoneDropAnims = useRef<Animated.Value[]>(runes.map(() => new Animated.Value(0))).current;
  const stoneRevealedAnims = useRef<Animated.Value[]>(runes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Start continuous breathing animation for A1
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.03,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1.0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pouchGlowAnim, {
          toValue: 0.8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pouchGlowAnim, {
          toValue: 0.25,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    breathLoop.start();
    glowLoop.start();

    return () => {
      breathLoop.stop();
      glowLoop.stop();
    };
  }, []);

  const handlePouchPress = () => {
    if (stage !== 'waiting_touch') return;

    try {
      Vibration.vibrate(40);
    } catch {
      // ignore
    }

    // A1 Shake on tap
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.7, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -0.7, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      startPouringSequence();
    });
  };

  const startPouringSequence = () => {
    setStage('pouring');

    // Rotate and tip the pouch
    Animated.parallel([
      Animated.timing(pouchRotateAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(pouchFadeAnim, {
        toValue: 0.4,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Cascading stones drop sequence
    runes.forEach((_, index) => {
      const delay = index * 210;

      setTimeout(() => {
        try {
          Vibration.vibrate(25);
        } catch {
          // ignore
        }

        // Stone drop animation (parabolic gravity + bounce)
        Animated.spring(stoneDropAnims[index], {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start(() => {
          // A3: 250ms delay, then reveal glyph with flip
          setTimeout(() => {
            Animated.timing(stoneRevealedAnims[index], {
              toValue: 1,
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start(() => {
              setRevealedCount((prev) => {
                const next = prev + 1;
                if (next === runes.length) {
                  setTimeout(() => {
                    setStage('settled');
                    onComplete?.();
                  }, 500);
                }
                return next;
              });
            });
          }, 250);
        });
      }, delay);
    });
  };

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-6deg', '0deg', '6deg'],
  });

  const pouchTiltInterpolation = pouchRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '55deg'],
  });

  return (
    <View style={styles.container}>
      {/* Pouch Hero Area (A1 / A2) */}
      <View style={styles.pouchArea}>
        <Pressable
          onPress={handlePouchPress}
          disabled={stage !== 'waiting_touch'}
          style={({ pressed }) => [styles.pouchTouchWrapper, pressed && styles.pouchPressed]}
        >
          <Animated.View
            style={[
              styles.pouchAnimatedContainer,
              {
                transform: [
                  { scale: breathAnim },
                  { rotate: stage === 'waiting_touch' ? shakeInterpolation : pouchTiltInterpolation },
                ],
                opacity: pouchFadeAnim,
              },
            ]}
          >
            {/* Glowing Aura leaking from pouch */}
            <Animated.View
              style={[
                styles.pouchAura,
                {
                  opacity: pouchGlowAnim,
                },
              ]}
            />
            <Image source={RUNE_ASSETS.pouchClosed} style={styles.pouchImage} resizeMode="contain" />
          </Animated.View>
        </Pressable>

        {stage === 'waiting_touch' && (
          <View style={styles.promptBadge}>
            <MaterialCommunityIcons name="gesture-tap" size={18} color="#38BDF8" />
            <Text style={styles.promptText}>Kutsal Keseye Dokun ve Taşları Dök</Text>
          </View>
        )}
      </View>

      {/* Stone Cascade / Spread Area (A2 / A3 / A4) */}
      {stage !== 'waiting_touch' && (
        <View style={styles.stonesGrid}>
          {runes.map((rune, index) => {
            const isRevealed = revealedCount > index;
            const dropAnim = stoneDropAnims[index];

            const translateY = dropAnim.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [-60, -80, 0],
            });

            const scale = dropAnim.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0.4, 1.1, 1],
            });

            const opacity = dropAnim.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 1, 1],
            });

            return (
              <Animated.View
                key={`${rune.id}-${index}`}
                style={[
                  styles.stoneSlot,
                  {
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <Text style={styles.positionLabel} numberOfLines={2}>
                  {positions[index] || `${index + 1}. Rün`}
                </Text>

                <View style={styles.stoneItemWrap}>
                  <SparkleBurst active={isRevealed} color="#38BDF8" />
                  <RuneStoneItem
                    rune={rune}
                    size="md"
                    revealed={isRevealed}
                    isReversed={rune.isReversed}
                    onPress={() => onInspectRune?.(rune, positions[index])}
                  />
                </View>

                {isRevealed && (
                  <View style={styles.stoneInfoBadge}>
                    <Text style={styles.stoneNameText}>
                      {rune.name} {rune.isReversed ? '(TERS)' : ''}
                    </Text>
                    <Text style={styles.elementText}>Element: {rune.element}</Text>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 16,
  },
  pouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  pouchTouchWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pouchAnimatedContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pouchImage: {
    width: '100%',
    height: '100%',
  },
  pouchAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(56, 189, 248, 0.45)',
    top: 15,
  },
  pouchPressed: {
    transform: [{ scale: 0.96 }],
  },
  promptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginTop: 10,
  },
  promptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0F2FE',
  },
  stonesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
  },
  stoneSlot: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 60) / 3,
    minWidth: 90,
    gap: 6,
  },
  positionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
    textAlign: 'center',
    minHeight: 26,
  },
  stoneItemWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneInfoBadge: {
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  stoneNameText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  elementText: {
    fontSize: 9.5,
    color: TEXT_MUTED,
  },
});
