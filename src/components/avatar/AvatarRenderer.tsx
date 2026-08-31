import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATAR_ASSETS } from '@/assets/avatar/registry';
import { GOLD, GOLD_SOFT, NIGHT_CARD, VELVET_MID, WALNUT } from '@/theme/colors';
import type { AvatarGender } from '@/services/socialProfile';

type Props = {
  gender: AvatarGender | null;
  skinId?: string | null;
  hatItemId?: string | null;
  capeItemId?: string | null;
  outfitItemId?: string | null;
  pantsItemId?: string | null;
  size?: number;
  animated?: boolean;
};

export default function AvatarRenderer({
  gender,
  skinId,
  hatItemId,
  capeItemId,
  outfitItemId,
  pantsItemId,
  size = 140,
  animated = true,
}: Props) {
  const breathe = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    breatheLoop.start();
    swayLoop.start();
    return () => {
      breatheLoop.stop();
      swayLoop.stop();
    };
  }, [animated, breathe, sway]);

  useEffect(() => {
    if (!animated) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2600 + Math.random() * 2400;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(blink, { toValue: 1, duration: 70, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0, duration: 110, useNativeDriver: true }),
        ]).start(() => scheduleBlink());
      }, delay);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [animated, blink]);

  const skinAsset = skinId && AVATAR_ASSETS[skinId] ? AVATAR_ASSETS[skinId] : null;
  const baseKey = gender === 'male' ? 'base_male' : gender === 'female' ? 'base_female' : null;
  const blinkKey = gender === 'male' ? 'blink_male' : gender === 'female' ? 'blink_female' : null;

  const layers = useMemo(
    () => [
      { key: 'cape', asset: capeItemId ? AVATAR_ASSETS[capeItemId] : null },
      { key: 'base', asset: baseKey ? AVATAR_ASSETS[baseKey] : null },
      { key: 'outfit', asset: outfitItemId ? AVATAR_ASSETS[outfitItemId] : null },
      { key: 'pants', asset: pantsItemId ? AVATAR_ASSETS[pantsItemId] : null },
      { key: 'hat', asset: hatItemId ? AVATAR_ASSETS[hatItemId] : null },
    ],
    [baseKey, capeItemId, outfitItemId, pantsItemId, hatItemId],
  );
  const hasArt = skinAsset || layers.some((layer) => layer.asset);
  const blinkAsset = !skinAsset && blinkKey ? AVATAR_ASSETS[blinkKey] : null;

  const translateY = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.02] });
  const scaleY = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size, transform: [{ translateY }, { scaleY }, { rotate }] }]}>
      {hasArt ? (
        <>
          {skinAsset ? (
            <Image
              source={skinAsset}
              style={[styles.layerImage, { width: size, height: size }]}
              resizeMode="contain"
            />
          ) : (
            <>
              {layers.map((layer) =>
                layer.asset ? (
                  <Image
                    key={layer.key}
                    source={layer.asset}
                    style={[styles.layerImage, { width: size, height: size }]}
                    resizeMode="contain"
                  />
                ) : null,
              )}
              {blinkAsset ? (
                <Animated.Image
                  source={blinkAsset}
                  style={[styles.layerImage, { width: size, height: size, opacity: blink }]}
                  resizeMode="contain"
                />
              ) : null}
            </>
          )}
        </>
      ) : (
        <View style={[styles.placeholder, { borderRadius: size / 2, backgroundColor: gender === 'male' ? WALNUT : NIGHT_CARD }]}>
          <Ionicons name="sparkles-outline" size={size * 0.4} color={GOLD} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  layerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD_SOFT,
  },
});
