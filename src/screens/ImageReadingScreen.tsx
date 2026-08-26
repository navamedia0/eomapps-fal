import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { interpretImages, validateImage } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReadingCooldownNotice from '@/components/ReadingCooldownNotice';
import { useReadingCooldown } from '@/hooks/useReadingCooldown';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ImageReading'>;

type PickedImage = { uri: string; base64: string; mimeType: string };

const MIN_IMAGES = 2;
const MAX_IMAGES = 5;

const COPY = {
  coffee: {
    icon: 'coffee' as const,
    instruction: `Fincanının telve kalıntılarını net gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle. Sadece kahve fincanı görüntüleri kabul edilir.`,
    loading: 'Fincandaki şekiller okunuyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'Kahve Falım',
    invalidSubject: 'kahve fincanına',
  },
  palm: {
    icon: 'hand-back-right-outline' as const,
    instruction: `Avuç içini iyi ışıkta gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle. Sadece avuç içi görüntüleri kabul edilir.`,
    loading: 'Avuç çizgilerin okunuyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'El Falım',
    invalidSubject: 'avuç içine',
  },
};

export default function ImageReadingScreen({ route, navigation }: Props) {
  const { kind } = route.params;
  const copy = COPY[kind];

  const [images, setImages] = useState<PickedImage[]>([]);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const { remaining: cooldownRemaining, notifyStarted } = useReadingCooldown(kind === 'coffee' ? 'kahve' : 'el');

  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
    setCoinFallback(null);
  }, []);

  const addAssets = useCallback((assets: ImagePicker.ImagePickerAsset[]) => {
    const mapped = assets
      .filter((asset) => asset.base64)
      .map((asset) => ({ uri: asset.uri, base64: asset.base64 as string, mimeType: asset.mimeType ?? 'image/jpeg' }));
    if (mapped.length === 0) return;
    resetResult();
    setImages((prev) => [...prev, ...mapped].slice(0, MAX_IMAGES));
  }, [resetResult]);

  const pickFromLibrary = useCallback(async () => {
    if (images.length >= MAX_IMAGES) return;
    setPermissionError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionError('Galeriye erişim izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled) addAssets(result.assets);
  }, [images.length, addAssets]);

  const takePhoto = useCallback(async () => {
    if (images.length >= MAX_IMAGES) return;
    setPermissionError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionError('Kameraya erişim izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled) addAssets(result.assets);
  }, [images.length, addAssets]);

  const removeImage = useCallback((index: number) => {
    resetResult();
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, [resetResult]);

  const interpret = useCallback(async (payWithCoins = false) => {
    if (images.length < MIN_IMAGES || cooldownRemaining > 0) return;
    setError(null);
    setCoinFallback(null);

    if (!payWithCoins) {
      setValidating(true);
      try {
        const validations = await Promise.all(
          images.map((img) => validateImage(kind, { mimeType: img.mimeType, data: img.base64 })),
        );
        const invalidCount = validations.filter((valid) => !valid).length;
        if (invalidCount > 0) {
          setError(
            invalidCount === images.length
              ? `Yüklediğin fotoğraflar ${copy.invalidSubject} benzemiyor. Lütfen sadece uygun fotoğraflar yükle.`
              : `${invalidCount} fotoğraf ${copy.invalidSubject} benzemiyor gibi görünüyor. Lütfen sadece uygun fotoğraflar yükle.`,
          );
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fotoğraflar doğrulanırken bir sorun oluştu.');
        return;
      } finally {
        setValidating(false);
      }
    }

    setLoading(true);
    try {
      if (payWithCoins) {
        const spent = await spendCoins(READING_COIN_COST);
        if (!spent) {
          setCoinFallback({ coins: await getCoins() });
          return;
        }
      } else {
        const remaining = await getCredits();
        if (remaining < 1) {
          setCoinFallback({ coins: await getCoins() });
          return;
        }
      }
      notifyStarted();
      const interpretation = await interpretImages(kind, images.map((img) => ({ mimeType: img.mimeType, data: img.base64 })));
      if (!payWithCoins) await spendCredit();
      setResult(interpretation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fal yorumlanırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }, [images, kind, copy.invalidSubject, cooldownRemaining, notifyStarted]);

  const resetAll = useCallback(() => {
    setImages([]);
    resetResult();
  }, [resetResult]);

  const busy = validating || loading;

  useEffect(() => {
    if (!busy) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [busy, pulse]);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  const showPicker = !result && !loading && !validating && !coinFallback;

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showPicker && (
          <View style={styles.pickWrap}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={copy.icon} size={40} color={GOLD} />
            </View>
            <Text style={styles.instruction}>{copy.instruction}</Text>

            {permissionError && <Text style={styles.permissionError}>{permissionError}</Text>}
            {error && <Text style={styles.permissionError}>{error}</Text>}

            <View style={styles.slotGrid}>
              {Array.from({ length: MAX_IMAGES }, (_, index) => {
                const picked = images[index];
                if (picked) {
                  return (
                    <View key={index} style={styles.slot}>
                      <Image source={{ uri: picked.uri }} style={styles.slotImage} resizeMode="cover" />
                      <Pressable onPress={() => removeImage(index)} style={styles.slotRemove} hitSlop={6}>
                        <Ionicons name="close" size={12} color={NIGHT_CARD} />
                      </Pressable>
                    </View>
                  );
                }
                const isNextSlot = index === images.length;
                return (
                  <Pressable
                    key={index}
                    onPress={isNextSlot ? pickFromLibrary : undefined}
                    disabled={!isNextSlot}
                    style={[styles.slot, styles.slotEmpty, !isNextSlot && styles.slotDisabled]}
                  >
                    <Ionicons name="add" size={22} color={isNextSlot ? GOLD : GOLD_SOFT} />
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.slotHint}>{images.length}/{MAX_IMAGES} fotoğraf seçildi (en az {MIN_IMAGES})</Text>

            <Pressable onPress={takePhoto} style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.actionButtonPressed]}>
              <Ionicons name="camera-outline" size={18} color={GOLD} />
              <Text style={styles.actionButtonSecondaryText}>Fotoğraf Çek</Text>
            </Pressable>
            <Pressable onPress={pickFromLibrary} style={({ pressed }) => [styles.actionButtonSecondary, pressed && styles.actionButtonPressed]}>
              <Ionicons name="images-outline" size={18} color={GOLD} />
              <Text style={styles.actionButtonSecondaryText}>Galeriden Seç (Çoklu)</Text>
            </Pressable>

            <Pressable
              onPress={() => interpret()}
              disabled={images.length < MIN_IMAGES || cooldownRemaining > 0}
              style={({ pressed }) => [
                styles.actionButton,
                (images.length < MIN_IMAGES || cooldownRemaining > 0 || pressed) && styles.actionButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
              <Text style={styles.actionButtonText}>Yorumla</Text>
            </Pressable>

            <ReadingCooldownNotice remaining={cooldownRemaining} />
          </View>
        )}

        {validating && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <Ionicons name="shield-checkmark-outline" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>{copy.validating}</Animated.Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <MaterialCommunityIcons name="star-crescent" size={32} color={GOLD} />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>{copy.loading}</Animated.Text>
          </View>
        )}

        {coinFallback && (
          <CoinFallbackBox
            cost={READING_COIN_COST}
            coins={coinFallback.coins}
            onContinue={() => interpret(true)}
            onBuyCoins={() => navigation.navigate('CoinShop')}
            onDismiss={() => navigation.navigate('Home')}
          />
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{result}</Text>
            <View style={styles.resultActionsRow}>
              <ShareButton text={`Mistik Rehber - ${copy.shareTitle}\n\n${result}`} />
              <Pressable
                onPress={resetAll}
                style={({ pressed }) => [styles.actionButton, styles.newReadingButton, pressed && styles.actionButtonPressed]}
              >
                <Ionicons name="refresh" size={18} color={NIGHT_CARD} />
                <Text style={styles.actionButtonText}>Yeni Fal Bak</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  pickWrap: {
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionError: {
    fontSize: 12.5,
    color: '#E08A8A',
    textAlign: 'center',
    marginBottom: 4,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  slot: {
    width: 62,
    height: 62,
    borderRadius: 12,
    overflow: 'hidden',
  },
  slotImage: {
    width: 62,
    height: 62,
  },
  slotRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: {
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NIGHT_CARD,
  },
  slotDisabled: {
    opacity: 0.35,
  },
  slotHint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: GOLD,
    letterSpacing: 0.8,
    fontStyle: 'italic',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
  },
  retryButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    gap: 16,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newReadingButton: {
    flex: 1.6,
    flexBasis: 0,
  },
});
