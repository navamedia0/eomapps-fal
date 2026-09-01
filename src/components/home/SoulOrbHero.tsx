import { useEffect, useRef } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP } from '@/theme/colors';

const ORBIT_ICONS: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
  'star-crescent',
  'cards-playing-outline',
  'moon-waning-crescent',
  'zodiac-leo',
  'crystal-ball',
  'numeric',
];

const ORBIT_RADIUS = 78;
const BUBBLE_SIZE = 32;
const DRAG_SENSITIVITY = 0.6;
// Geniş bir aralık: sürükleyerek biriken açı bu sınırları asla pratikte
// aşmaz, sadece interpolate'in her değeri 1:1 dereceye çevirmesi için var.
const ANGLE_RANGE = 200000;

// Anasayfanın statik banner görselinin yerini alan, sürüklenerek
// döndürülebilen "ruh küresi" hero'su.
export default function SoulOrbHero() {
  const autoAngle = useRef(new Animated.Value(0)).current;
  const dragAngle = useRef(new Animated.Value(0)).current;
  const dragBaseRef = useRef(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(autoAngle, {
        toValue: 360,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [autoAngle]);

  const totalAngle = Animated.add(autoAngle, dragAngle);
  const rotateStyle = totalAngle.interpolate({
    inputRange: [-ANGLE_RANGE, ANGLE_RANGE],
    outputRange: [`${-ANGLE_RANGE}deg`, `${ANGLE_RANGE}deg`],
  });
  const counterRotateStyle = totalAngle.interpolate({
    inputRange: [-ANGLE_RANGE, ANGLE_RANGE],
    outputRange: [`${ANGLE_RANGE}deg`, `${-ANGLE_RANGE}deg`],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragAngle.stopAnimation((value) => {
          dragBaseRef.current = value;
        });
      },
      onPanResponderMove: (_evt, gesture) => {
        dragAngle.setValue(dragBaseRef.current + gesture.dx * DRAG_SENSITIVITY);
      },
    }),
  ).current;

  return (
    <View style={styles.wrap} {...panResponder.panHandlers}>
      <View style={styles.sphereCore}>
        <LinearGradient
          colors={['#1E1E22', '#141417', '#000000']}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <MaterialCommunityIcons name="star-four-points" size={30} color={GOLD} />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.orbitRing, { transform: [{ rotate: rotateStyle }] }]}
      >
        {ORBIT_ICONS.map((iconName, index) => {
          const slotAngle = (360 / ORBIT_ICONS.length) * index;
          return (
            <View key={iconName} style={[styles.orbitSlot, { transform: [{ rotate: `${slotAngle}deg` }] }]}>
              <View style={{ transform: [{ translateY: -ORBIT_RADIUS }] }}>
                <Animated.View
                  style={[
                    styles.bubble,
                    { transform: [{ rotate: counterRotateStyle }, { rotate: `${-slotAngle}deg` }] },
                  ]}
                >
                  <MaterialCommunityIcons name={iconName} size={16} color={GOLD} />
                </Animated.View>
              </View>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const SPHERE_SIZE = 84;

const styles = StyleSheet.create({
  wrap: {
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sphereCore: {
    width: SPHERE_SIZE,
    height: SPHERE_SIZE,
    borderRadius: SPHERE_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
  },
  orbitRing: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitSlot: {
    position: 'absolute',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: 'rgba(30, 30, 32, 0.92)',
    borderWidth: 1.2,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
});
