import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { EquippedCosmetics } from '@/services/characterCosmetics';
import { GOLD } from '@/theme/colors';

const BASE_HEROES = {
  hero_novice: require('@/assets/kasaba/hero_novice.jpg'),
  hero_knight: require('@/assets/kasaba/hero_knight.jpg'),
  hero_mage: require('@/assets/kasaba/hero_mage.jpg'),
};

type Props = {
  equipped: EquippedCosmetics;
  size?: number;
  style?: ViewStyle;
  showAura?: boolean;
  isAnimated?: boolean;
};

export default function CharacterAvatarView({
  equipped,
  size = 150,
  style,
  showAura = true,
  isAnimated = true,
}: Props) {
  // Breathing animation (vertical subtle chest rise and fall)
  const breathAnim = useRef(new Animated.Value(0)).current;
  // Wings flapping animation (horizontal scale and subtle rotation)
  const wingsAnim = useRef(new Animated.Value(1)).current;
  const wingsRotAnim = useRef(new Animated.Value(0)).current;
  // Cape sway animation (wind effect)
  const capeAnim = useRef(new Animated.Value(0)).current;
  // Eye blink state
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!isAnimated) return;

    // 1. Idle Breathing Loop (Nefes alma hareketi)
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: -3.5,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 2. Wings Flapping & Flutter Loop (Kanat çırpma hareketi)
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(wingsAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(wingsRotAnim, {
            toValue: 3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(wingsAnim, {
            toValue: 0.94,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(wingsRotAnim, {
            toValue: -2,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    // 3. Cape Wind Sway Loop (Pelerin rüzgar salınımı)
    Animated.loop(
      Animated.sequence([
        Animated.timing(capeAnim, {
          toValue: 4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(capeAnim, {
          toValue: -3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 4. Eye Blinking Timer Loop (Göz kırpma döngüsü)
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
    }, 3500);

    return () => {
      clearInterval(blinkInterval);
    };
  }, [breathAnim, wingsAnim, wingsRotAnim, capeAnim, isAnimated]);

  // Determine base hero silhouette
  let activeHeroKey: keyof typeof BASE_HEROES = 'hero_novice';
  if (equipped.outfit === 'outfit_knight' || equipped.wings === 'wings_holy_angel') {
    activeHeroKey = 'hero_knight';
  } else if (
    equipped.outfit === 'outfit_mage' ||
    equipped.wings === 'wings_cosmic_fairy' ||
    equipped.headwear === 'head_witch_hat'
  ) {
    activeHeroKey = 'hero_mage';
  }

  const baseImage = BASE_HEROES[activeHeroKey];

  const wingsRotation = wingsRotAnim.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const capeRotation = capeAnim.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Ambient Stardust Aura */}
      {showAura && (
        <View
          style={[
            styles.auraGlow,
            { width: size * 0.88, height: size * 0.88, borderRadius: (size * 0.88) / 2 },
          ]}
        />
      )}

      {/* BACK LAYER: Animated Cape / Pelerin (Rüzgarda Salınan) */}
      {equipped.cape && equipped.cape !== 'cape_none' && (
        <Animated.View
          style={[
            styles.capeLayer,
            {
              transform: [{ rotate: capeRotation }],
            },
          ]}
        >
          <View style={[styles.capeGraphic, { width: size * 0.55, height: size * 0.75 }]} />
        </Animated.View>
      )}

      {/* BACK LAYER: Animated Wings / Kanatlar (Nefesle Çırpınan) */}
      {equipped.wings && equipped.wings !== 'wings_none' && (
        <Animated.View
          style={[
            styles.wingsLayer,
            {
              transform: [
                { scaleX: wingsAnim },
                { scaleY: wingsAnim },
                { rotate: wingsRotation },
              ],
            },
          ]}
        >
          <View style={styles.wingsPair}>
            <MaterialCommunityIcons
              name="feather"
              size={size * 0.58}
              color={equipped.wings === 'wings_holy_angel' ? GOLD : '#C084FC'}
              style={{ transform: [{ rotate: '-35deg' }] }}
            />
            <MaterialCommunityIcons
              name="feather"
              size={size * 0.58}
              color={equipped.wings === 'wings_holy_angel' ? GOLD : '#C084FC'}
              style={{ transform: [{ scaleX: -1 }, { rotate: '-35deg' }] }}
            />
          </View>
        </Animated.View>
      )}

      {/* MAIN BODY: Idle Breathing Mannequin (Nefes Alan Gövde) */}
      <Animated.View
        style={[
          styles.mannequinBody,
          {
            transform: [{ translateY: breathAnim }],
          },
        ]}
      >
        <Image
          source={baseImage}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />

        {/* Eye Blinking Eyelid Overlay */}
        {isBlinking && (
          <View style={[styles.blinkOverlay, { top: size * 0.38, left: size * 0.38, width: size * 0.24 }]} />
        )}
      </Animated.View>

      {/* TOP LAYER: Crown / Headwear (Taç / Şapka) */}
      {equipped.headwear && equipped.headwear !== 'head_none' && (
        <Animated.View
          style={[
            styles.headwearLayer,
            {
              top: size * 0.08,
              transform: [{ translateY: breathAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={equipped.headwear === 'head_golden_crown' ? 'crown' : 'wizard-hat'}
            size={size * 0.32}
            color={GOLD}
          />
        </Animated.View>
      )}

      {/* TOP LAYER: Weapon / Wand (Silah / Kristal Asa) */}
      {equipped.weapon && equipped.weapon !== 'weapon_novice_wand' && (
        <Animated.View
          style={[
            styles.weaponLayer,
            {
              bottom: size * 0.25,
              right: size * 0.08,
              transform: [{ translateY: breathAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="sword-cross"
            size={size * 0.3}
            color="#F59E0B"
          />
        </Animated.View>
      )}

      {/* Magic Sparkle Accents */}
      <View style={styles.floatingSparkle}>
        <MaterialCommunityIcons name="star-four-points" size={14} color={GOLD} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  auraGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 25,
    elevation: 10,
  },
  mannequinBody: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wingsLayer: {
    position: 'absolute',
    top: '12%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  wingsPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -15,
  },
  capeLayer: {
    position: 'absolute',
    top: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  capeGraphic: {
    backgroundColor: 'rgba(192, 132, 252, 0.65)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  headwearLayer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  weaponLayer: {
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  blinkOverlay: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#382218',
    borderRadius: 2,
  },
  floatingSparkle: {
    position: 'absolute',
    top: '8%',
    right: '6%',
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
});
