import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GOLD, GOLD_SOFT, NIGHT_MID, BORDO_DEEP } from '@/theme/colors';

const VELVET_TEXTURE = require('../../assets/textures/velvet.jpg');

type Props = {
  selected: boolean;
  positionLabel?: number;
  disabled?: boolean;
  onPress: () => void;
  customImage?: ImageSourcePropType | null;
};

export default function TarotCardBack({ selected, positionLabel, disabled, onPress, customImage }: Props) {
  const lift = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(lift, { toValue: selected ? -10 : 0, useNativeDriver: true, friction: 6, tension: 60 }),
      Animated.spring(scale, { toValue: selected ? 1.08 : 1, useNativeDriver: true, friction: 6, tension: 60 }),
      Animated.timing(glow, { toValue: selected ? 1 : 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [selected, lift, scale, glow]);

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <Animated.View
          style={[
            { transform: [{ translateY: lift }, { scale }] },
            disabled && !selected && styles.disabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />
          {customImage ? (
            <View style={[styles.card, styles.customCard]}>
              <Image source={customImage} style={styles.customImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.card, styles.customCard]}>
              <Image source={VELVET_TEXTURE} style={styles.customImage} resizeMode="cover" />
              <View style={styles.velvetTint} />
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={20}
                color={selected ? GOLD : GOLD_SOFT}
              />
            </View>
          )}
          {selected && positionLabel && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{positionLabel}</Text>
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 0.6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCard: {
    overflow: 'hidden',
  },
  customImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  velvetTint: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: BORDO_DEEP,
    opacity: 0.45,
  },
  glow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 14,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: NIGHT_MID,
  },
});
