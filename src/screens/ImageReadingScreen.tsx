import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, Animated, Easing } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { interpretImages, validateImage } from '@/services/readings-ai';
import { getCredits } from '@/services/credits';
import { getCoins, spendCoins } from '@/services/coins';
import { READING_COIN_COST } from '@/constants/economy';
import { saveReadingHistory } from '@/services/readingHistory';
import {
  getCategoryStatus,
  recordVideoWatched,
  recordCategoryReadingComplete,
  type ReadingCategory,
} from '@/services/readingDailyLimits';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import RewardedAdModal from '@/components/RewardedAdModal';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReadingCooldownNotice from '@/components/ReadingCooldownNotice';
import FeatureIcon from '@/components/FeatureIcon';
import { FEATURE_ICONS } from '@/assets/icons';
import { useReadingCooldown } from '@/hooks/useReadingCooldown';
import PersonInfoModal from '@/components/PersonInfoModal';
import type { PersonInfo } from '@/types/personInfo';
import { getSavedPersonInfo, savePersonInfo } from '@/services/personInfo';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ImageReading'>;

type PickedImage = { uri: string; base64: string; mimeType: string };

const MIN_IMAGES = 2;
const MAX_IMAGES = 5;

const COPY = {
  coffee: {
    iconKey: 'coffee',
    icon: 'coffee' as const,
    instruction: `Fincanının telve kalıntılarını net gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle. Sadece kahve fincanı görüntüleri kabul edilir.`,
    loading: 'Fincandaki şekiller okunuyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'Kahve Falım',
    invalidSubject: 'kahve fincanına',
  },
  palm: {
    iconKey: 'palm',
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
  const categoryKey: ReadingCategory = kind === 'coffee' ? 'kahve' : 'el';

  const [images, setImages] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [personInfo, setPersonInfo] = useState<PersonInfo | null>(null);
  const [skipPersonInfo, setSkipPersonInfo] = useState(false);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);

  // Reklam Modalı State'i
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adVideoIndex, setAdVideoIndex] = useState(1);
  const [adTotalNeeded, setAdTotalNeeded] = useState(1);

  const pulse = useRef(new Animated.Value(0)).current;
  const { remaining: cooldownRemaining, notifyStarted } = useReadingCooldown(kind === 'coffee' ? 'kahve' : 'el');

  useEffect(() => {
    getSavedPersonInfo().then((saved) => {
      if (saved && (saved.name || saved.age || saved.relationshipStatus || saved.focusArea)) {
        setPersonInfo(saved);
      }
    });
  }, []);

  const handleSavePersonInfo = (info: PersonInfo) => {
    setPersonInfo(info);
    setSkipPersonInfo(false);
    savePersonInfo(info);
  };

  const toggleSkipPersonInfo = () => {
    setSkipPersonInfo((prev) => {
      const next = !prev;
      if (next) {
        setPersonInfo(null);
      }
      return next;
    });
  };

  const hasPersonInfo = Boolean(
    personInfo &&
      (personInfo.name?.trim() ||
        personInfo.age ||
        personInfo.relationshipStatus ||
        personInfo.focusArea ||
        personInfo.occupationStatus),
  );
  const hasPersonChoice = hasPersonInfo || skipPersonInfo;
  const canInterpret = images.length >= MIN_IMAGES && hasPersonChoice && cooldownRemaining === 0;

  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
    setCoinFallback(null);
    setQueueNotice(null);
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

  const interpret = useCallback(async (payWithCoins = false, forceUnlocked = false) => {
    if (images.length < MIN_IMAGES || cooldownRemaining > 0 || !hasPersonChoice) return;
    setError(null);
    setCoinFallback(null);
    setQueueNotice(null);

    // Kategori bazlı kota ve video kontrolü
    if (!payWithCoins && !forceUnlocked) {
      const catStatus = await getCategoryStatus(categoryKey);
      if (catStatus.status === 'need_1_video') {
        setAdVideoIndex(1);
        setAdTotalNeeded(1);
        setAdModalVisible(true);
        return;
      }
      if (catStatus.status === 'need_3_videos') {
        setAdVideoIndex(catStatus.videosWatched + 1);
        setAdTotalNeeded(3);
        setAdModalVisible(true);
        return;
      }
      if (catStatus.status === 'coin_only') {
        setCoinFallback({ coins: await getCoins() });
        return;
      }
    }

    if (payWithCoins) {
      const spent = await spendCoins(READING_COIN_COST);
      if (!spent) {
        setCoinFallback({ coins: await getCoins() });
        return;
      }
    }

    // Doğrulama: Çoklu görsel gönderildiğinde paralel kontrol
    setValidating(true);
    try {
      const checkImages = images.slice(0, 2); // İlk 2 görsel yeterli
      const validations = await Promise.all(
        checkImages.map((img) => validateImage(kind, { mimeType: img.mimeType, data: img.base64 })),
      );
      const invalidCount = validations.filter((valid) => !valid).length;
      if (invalidCount === checkImages.length) {
        setError(`Yüklediğin fotoğraflar ${copy.invalidSubject} benzemiyor. Lütfen sadece uygun fotoğraflar yükle.`);
        setValidating(false);
        return;
      }
    } catch {
      // Hata durumunda doğrulamayı es geç, doğrudan yoruma ilerle
    } finally {
      setValidating(false);
    }

    setLoading(true);
    notifyStarted();

    // Akıllı Kuyruk Bilgilendirmesi: Yoğunluk anında nazik geri bildirim
    const queueTimer = setTimeout(() => {
      setQueueNotice('Sistemdeki yoğunluk nedeniyle falınız inceleniyor; hazır olduğunda sonuç burada ve Geçmiş bölümünde görünecektir...');
    }, 12000);

    try {
      // 1 ila 5 fotoğraf tek bir payload paketinde yapay zekaya gönderilir
      const interpretation = await interpretImages(
        kind,
        images.map((img) => ({ mimeType: img.mimeType, data: img.base64 })),
        skipPersonInfo ? null : personInfo,
      );
      clearTimeout(queueTimer);
      setQueueNotice(null);

      // Kategori kullanımını kaydet
      await recordCategoryReadingComplete(categoryKey, payWithCoins);

      setResult(interpretation);
      await saveReadingHistory({
        type: kind === 'coffee' ? 'kahve' : 'el',
        title: !skipPersonInfo && personInfo?.name?.trim() ? `${copy.shareTitle} (${personInfo.name.trim()})` : copy.shareTitle,
        result: interpretation,
      });
    } catch (err) {
      clearTimeout(queueTimer);
      setError(err instanceof Error ? err.message : 'Sistem yoğunluğu nedeniyle biraz zaman alabilir, lütfen birazdan tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [images, kind, categoryKey, copy.invalidSubject, copy.shareTitle, cooldownRemaining, notifyStarted, hasPersonChoice, skipPersonInfo, personInfo]);

  const handleAdComplete = useCallback(async () => {
    setAdModalVisible(false);
    const res = await recordVideoWatched(categoryKey);
    if (res.unlocked) {
      // Hak açıldı, doğrudan falı başlat
      interpret(false, true);
    } else {
      // Sıradaki video gerekiyorsa modalı sıradaki adımla tekrar aç
      setAdVideoIndex(res.watched + 1);
      setAdTotalNeeded(res.required);
      setAdModalVisible(true);
    }
  }, [categoryKey, interpret]);

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
            <FeatureIcon
              source={FEATURE_ICONS[copy.iconKey]}
              fallback={<MaterialCommunityIcons name={copy.icon} size={40} color={GOLD} />}
              size={96}
            />
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

            {/* Kişi Bilgisi Alanı */}
            <View style={styles.personSection}>
              <Pressable
                onPress={() => setIsPersonModalVisible(true)}
                style={({ pressed }) => [
                  styles.personButton,
                  hasPersonInfo && styles.personButtonFilled,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <View style={styles.personButtonLeft}>
                  <View style={[styles.personIconWrap, hasPersonInfo && styles.personIconWrapFilled]}>
                    <Ionicons
                      name={hasPersonInfo ? 'person' : 'person-add-outline'}
                      size={18}
                      color={hasPersonInfo ? NIGHT_CARD : GOLD}
                    />
                  </View>
                  <View style={styles.personButtonTextWrap}>
                    <Text style={styles.personButtonTitle}>
                      {hasPersonInfo ? `Fal Sahibi: ${personInfo?.name || 'Kişi Bilgisi Girildi'}` : 'Kişi Bilgisi Gir'}
                    </Text>
                    <Text style={styles.personButtonSubtitle} numberOfLines={1}>
                      {hasPersonInfo
                        ? [
                            personInfo?.age ? `${personInfo.age} yaş` : null,
                            personInfo?.relationshipStatus,
                            personInfo?.occupationStatus,
                            personInfo?.focusArea,
                          ]
                            .filter(Boolean)
                            .join(' • ')
                        : 'İsim, yaş, ilişki vb. (Özel yorum için)'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={hasPersonInfo ? 'create-outline' : 'chevron-forward'}
                  size={18}
                  color={GOLD}
                />
              </Pressable>

              <Pressable
                onPress={toggleSkipPersonInfo}
                style={({ pressed }) => [styles.skipToggleRow, pressed && styles.pressedFade]}
                hitSlop={8}
              >
                <Ionicons
                  name={skipPersonInfo ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={skipPersonInfo ? GOLD : TEXT_MUTED}
                />
                <Text style={[styles.skipToggleText, skipPersonInfo && styles.skipToggleTextActive]}>
                  Kişisel bilgi girmek istemiyorum (Anonim Fal)
                </Text>
              </Pressable>

              <View style={styles.infoHintRow}>
                <MaterialCommunityIcons name="information-outline" size={13} color={GOLD_SOFT} />
                <Text style={styles.infoHintText}>
                  Daha isabetli ve sana özel bir fal analizi için kişi bilgilerini girebilirsin.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => interpret()}
              disabled={!canInterpret}
              style={({ pressed }) => [
                styles.actionButton,
                (!canInterpret || pressed) && styles.actionButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons name="star-crescent" size={18} color={NIGHT_CARD} />
              <Text style={styles.actionButtonText}>Yorumla</Text>
            </Pressable>

            {!hasPersonChoice && images.length >= MIN_IMAGES && (
              <Text style={styles.personChoiceWarning}>
                Falı yorumlamak için kişi bilgisi girin veya "Bilgi girmek istemiyorum" seçeneğini işaretleyin.
              </Text>
            )}

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
            {queueNotice && (
              <View style={styles.queueNoticeCard}>
                <Ionicons name="hourglass-outline" size={16} color={GOLD} />
                <Text style={styles.queueNoticeText}>{queueNotice}</Text>
              </View>
            )}
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
      <PersonInfoModal
        visible={isPersonModalVisible}
        initialInfo={personInfo}
        onSave={handleSavePersonInfo}
        onClose={() => setIsPersonModalVisible(false)}
      />
      <RewardedAdModal
        visible={adModalVisible}
        readingTitle={copy.shareTitle}
        videoIndex={adVideoIndex}
        totalVideosNeeded={adTotalNeeded}
        onComplete={handleAdComplete}
        onCancel={() => setAdModalVisible(false)}
      />
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
  personSection: {
    width: '100%',
    marginVertical: 4,
    gap: 8,
  },
  personButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 17, 64, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  personButtonFilled: {
    backgroundColor: 'rgba(242, 200, 121, 0.14)',
    borderColor: GOLD,
  },
  personButtonLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personIconWrapFilled: {
    backgroundColor: GOLD,
  },
  personButtonTextWrap: {
    flex: 1,
  },
  personButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 2,
  },
  personButtonSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
  },
  skipToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  skipToggleText: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  skipToggleTextActive: {
    color: GOLD,
    fontWeight: '600',
  },
  personChoiceWarning: {
    fontSize: 11.5,
    color: '#F2A65A',
    textAlign: 'center',
    lineHeight: 16,
  },
  pressedFade: {
    opacity: 0.85,
  },
  queueNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 16,
    maxWidth: 340,
  },
  queueNoticeText: {
    fontSize: 11.5,
    color: GOLD_SOFT,
    flex: 1,
    lineHeight: 16,
  },
  infoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  infoHintText: {
    fontSize: 11,
    color: GOLD_SOFT,
    textAlign: 'center',
    lineHeight: 15,
  },
});
