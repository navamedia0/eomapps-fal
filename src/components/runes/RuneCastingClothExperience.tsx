import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { getAllRunes, isSymmetricRune, type Rune } from '@/services/runeEngine';
import { TEXT_MUTED, TEXT_PRIMARY } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 24 Elder Futhark Spacious Circular Altar Coordinates
function generateSpaciousAltarPositions(radiusOuter: number, radiusMid: number): Array<{ x: number; y: number; rot: string }> {
  const positions: Array<{ x: number; y: number; rot: string }> = [];

  // Outer Circle (14 stones)
  for (let i = 0; i < 14; i++) {
    const angleDeg = (i * 360) / 14 - 90;
    const rad = (angleDeg * Math.PI) / 180;
    const x = Math.round(Math.cos(rad) * radiusOuter);
    const y = Math.round(Math.sin(rad) * radiusOuter);
    const rot = `${Math.round(angleDeg + 90)}deg`;
    positions.push({ x, y, rot });
  }

  // Middle Circle (8 stones)
  for (let i = 0; i < 8; i++) {
    const angleDeg = (i * 360) / 8 - 65;
    const rad = (angleDeg * Math.PI) / 180;
    const x = Math.round(Math.cos(rad) * radiusMid);
    const y = Math.round(Math.sin(rad) * radiusMid);
    const rot = `${Math.round(angleDeg + 45)}deg`;
    positions.push({ x, y, rot });
  }

  // Center Core (2 stones)
  positions.push({ x: -16, y: -4, rot: '-8deg' });
  positions.push({ x: 16, y: 4, rot: '10deg' });

  return positions;
}

type Props = {
  requiredCount: number;
  positions: string[];
  onSelectionComplete: (selectedRunes: Rune[]) => void;
  onInspectRune?: (rune: Rune, positionLabel: string) => void;
  accentColor?: string;
};

export default function RuneCastingClothExperience({
  requiredCount,
  positions,
  onSelectionComplete,
  onInspectRune,
  accentColor = '#38BDF8',
}: Props) {
  const [allRunesPool, setAllRunesPool] = useState<Rune[]>([]);
  const [selectedRunes, setSelectedRunes] = useState<Rune[]>([]);
  const [pickedIndices, setPickedIndices] = useState<Set<number>>(new Set());
  const [activePressIndex, setActivePressIndex] = useState<number | null>(null);

  // Dynamic Altar Radius based on screen size (spacious and readable)
  const altarSize = Math.min(SCREEN_WIDTH - 24, 370);
  const stonePositions = useMemo(
    () => generateSpaciousAltarPositions(altarSize * 0.32, altarSize * 0.17),
    [altarSize],
  );

  // Animation values for flying arc stone
  const arcFlightAnim = useRef(new Animated.Value(0)).current;
  const [flyingStone, setFlyingStone] = useState<{ rune: Rune; targetIndex: number } | null>(null);

  useEffect(() => {
    // Shuffle all 24 runes for organic draw
    const all = [...getAllRunes()].sort(() => Math.random() - 0.5);
    setAllRunesPool(all);
    setSelectedRunes([]);
    setPickedIndices(new Set());
  }, [requiredCount]);

  const handleSelectStone = (rune: Rune, poolIndex: number) => {
    if (pickedIndices.has(poolIndex) || selectedRunes.length >= requiredCount || flyingStone) return;

    try {
      Vibration.vibrate(35);
    } catch {
      // ignore
    }

    // Determine orientation (reversed or upright) - symmetric stays upright
    const symmetric = isSymmetricRune(rune.id);
    const isReversed = !symmetric && Math.random() < 0.35;
    const finalRune: Rune = { ...rune, isReversed };

    const targetSlotIndex = selectedRunes.length;
    setPickedIndices((prev) => new Set([...prev, poolIndex]));
    setFlyingStone({ rune: finalRune, targetIndex: targetSlotIndex });

    // Arc Flight Animation (parabolic curve upwards and into slot)
    arcFlightAnim.setValue(0);
    Animated.timing(arcFlightAnim, {
      toValue: 1,
      duration: 480,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      try {
        Vibration.vibrate(20);
      } catch {
        // ignore
      }

      const nextSelected = [...selectedRunes, finalRune];
      setSelectedRunes(nextSelected);
      setFlyingStone(null);

      if (nextSelected.length === requiredCount) {
        setTimeout(() => {
          onSelectionComplete(nextSelected);
        }, 500);
      }
    });
  };

  const isComplete = selectedRunes.length >= requiredCount;

  return (
    <View style={styles.container}>
      {/* Top Section: Slots & Progress */}
      <View style={styles.slotsHeader}>
        <View style={styles.badgeRow}>
          <MaterialCommunityIcons name="hand-pointing-up" size={18} color={accentColor} />
          <Text style={[styles.slotsTitle, { color: accentColor }]}>
            {isComplete
              ? 'Tüm Taşlar Seçildi ve Dizildi'
              : `Seçim Ritüeli: (${selectedRunes.length} / ${requiredCount}) Taş Çek`}
          </Text>
        </View>
        <Text style={styles.slotsSubtitle}>
          {isComplete
            ? 'Açılım hazır. Masadaki dizilimi ve rün yorumlarını inceleyebilirsin.'
            : 'Döküm bezindeki taşlara dokunarak iç sesinin seçtiği taşı açılım masasına kaldır.'}
        </Text>
      </View>

      {/* Target Spread Slots (Receiving table) */}
      <View style={styles.targetSpreadRow}>
        {Array.from({ length: requiredCount }).map((_, i) => {
          const placedRune = selectedRunes[i];
          const isCurrentTarget = flyingStone && flyingStone.targetIndex === i;

          return (
            <View key={i} style={styles.slotBox}>
              <Text style={[styles.slotPositionText, { color: accentColor }]} numberOfLines={2}>
                {positions[i] || `${i + 1}. Taş`}
              </Text>

              <View style={styles.slotRing}>
                {placedRune ? (
                  <RuneStoneItem
                    rune={placedRune}
                    size="sm"
                    revealed={true}
                    isReversed={placedRune.isReversed}
                    onPress={() => onInspectRune?.(placedRune, positions[i])}
                  />
                ) : (
                  <View
                    style={[
                      styles.emptySlot,
                      isCurrentTarget && [styles.emptySlotActive, { borderColor: accentColor }],
                    ]}
                  >
                    <Text style={[styles.emptySlotNumber, { color: accentColor + '80' }]}>{i + 1}</Text>
                  </View>
                )}
              </View>

              {placedRune && (
                <Text style={styles.placedRuneName} numberOfLines={1}>
                  {placedRune.name}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Altar / Wide Circular Casting Cloth with 24 Scattered Stones */}
      {!isComplete && (
        <View style={[styles.altarContainer, { width: altarSize, height: altarSize }]}>
          {/* Broad Circular Mat without outer wooden table frame */}
          <Image source={RUNE_ASSETS.castingMat} style={styles.altarImage} resizeMode="contain" />

          {/* Broad Scattered Stones Cluster */}
          <View style={styles.scatterCluster}>
            {allRunesPool.map((rune, index) => {
              if (pickedIndices.has(index)) return null;

              const pos = stonePositions[index % stonePositions.length];
              const isPressed = activePressIndex === index;

              return (
                <Pressable
                  key={`${rune.id}-${index}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPressIn={() => setActivePressIndex(index)}
                  onPressOut={() => setActivePressIndex(null)}
                  onPress={() => handleSelectStone(rune, index)}
                  style={({ pressed }) => [
                    styles.scatterStoneWrapper,
                    {
                      transform: [
                        { translateX: pos.x },
                        { translateY: pos.y },
                        { rotate: pos.rot },
                        { scale: isPressed || pressed ? 1.25 : 1.0 },
                      ],
                    },
                  ]}
                >
                  <RuneStoneItem rune={rune} size="mini" revealed={false} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Flying Arc Stone Animation */}
      {flyingStone && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flyingStoneContainer,
            {
              transform: [
                {
                  translateY: arcFlightAnim.interpolate({
                    inputRange: [0, 0.45, 1],
                    outputRange: [130, -50, -200],
                  }),
                },
                {
                  scale: arcFlightAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1.15, 1.35, 1.0],
                  }),
                },
              ],
              opacity: arcFlightAnim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0.8, 1, 1, 0],
              }),
            },
          ]}
        >
          <RuneStoneItem rune={flyingStone.rune} size="sm" revealed={true} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  slotsHeader: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotsTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  slotsSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 16,
  },
  targetSpreadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 6,
  },
  slotBox: {
    alignItems: 'center',
    width: 68,
    gap: 4,
  },
  slotPositionText: {
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 22,
  },
  slotRing: {
    width: 58,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: 52,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  emptySlotNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  placedRuneName: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  altarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  altarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 190,
  },
  scatterCluster: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scatterStoneWrapper: {
    position: 'absolute',
    padding: 6,
  },
  flyingStoneContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
});
