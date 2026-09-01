import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import ReadingCardStack from '@/components/ReadingCardStack';
import ParchmentReadingResult from '@/components/ParchmentReadingResult';
import { parseNumberedSections } from '@/utils/parseNumberedSections';
import { interpretImages, validateImage } from '@/services/readings-ai';
import { ApiRequestError } from '@/services/http';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { READING_COIN_COST, DEEP_IMAGE_READING_COIN_COST } from '@/constants/economy';
import { saveReadingHistory } from '@/services/readingHistory';
import {
  getCategoryStatus,
  recordCategoryReadingComplete,
  type ReadingCategory,
} from '@/services/readingDailyLimits';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import RewardedAdModal from '@/components/RewardedAdModal';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import ReadingCooldownNotice from '@/components/ReadingCooldownNotice';
import FeatureIcon from '@/components/FeatureIcon';
import EkolEntranceSplash from '@/components/EkolEntranceSplash';
import { FEATURE_ICONS } from '@/assets/icons';
import { FORTUNE_THEMES } from '@/constants/fortuneThemes';
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
    title: 'Kahve Falı',
    instruction: `Fincanının telve kalıntılarını net gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle. Sadece kahve fincanı görüntüleri kabul edilir.`,
    loading: 'Fincandaki şekiller okunuyor...',
    loadingDeep: 'Fincan topografyası ve 4 boyutlu sembol haritası inceleniyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'Kahve Falım',
    invalidSubject: 'kahve fincanına',
  },
  palm: {
    iconKey: 'palm',
    icon: 'hand-back-right-outline' as const,
    title: 'El Falı',
    instruction: `Avuç içini iyi ışıkta gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle. Sadece avuç içi görüntüleri kabul edilir.`,
    loading: 'Avuç çizgilerin okunuyor...',
    loadingDeep: 'Palmistri çizgileri, tepeler ve mikro kıvrımlar analiz ediliyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'El Falım',
    invalidSubject: 'avuç içine',
  },
  face: {
    iconKey: 'face',
    icon: 'face-man-profile' as const,
    title: 'Yüz Falı (İlmi Sima)',
    instruction: `Yüzünü önden, iyi ışıkta ve net gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle. Sadece net insan yüzü görüntüleri kabul edilir.`,
    loading: 'Yüz hatların ve sima enerjin okunuyor...',
    loadingDeep: 'İlmi Sima, Mian Xiang 12 kader sarayı ve hatlar analiz ediliyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'Yüz Falım (İlmi Sima)',
    invalidSubject: 'insan yüzüne',
  },
  tea: {
    iconKey: 'tea',
    icon: 'leaf' as const,
    title: 'Çay Yaprağı Falı (Tasseografi)',
    instruction: `Fincan dibindeki çay yapraklarını ve tortusunu net gösteren ${MIN_IMAGES}-${MAX_IMAGES} arası fotoğraf ekle.`,
    loading: 'Çay yapraklarındaki semboller okunuyor...',
    loadingDeep: 'Tasseografi desenleri ve kulp topografyası inceleniyor...',
    validating: 'Fotoğraflar doğrulanıyor...',
    shareTitle: 'Çay Yaprağı Falım',
    invalidSubject: 'çay fincanına',
  },
};

export default function ImageReadingScreen({ route, navigation }: Props) {
  const { kind } = route.params;
  const copy = COPY[kind];
  const theme = FORTUNE_THEMES[kind] || FORTUNE_THEMES.coffee;
  const categoryKey: ReadingCategory = kind === 'coffee' ? 'kahve' : kind === 'palm' ? 'el' : kind === 'face' ? 'yuz' : 'kahve';

  const [images, setImages] = useState<PickedImage[]>([]);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'deep'>('standard');
  const [activeReadingMode, setActiveReadingMode] = useState<'standard' | 'deep'>('standard');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const resultSections = useMemo(() => (result ? parseNumberedSections(result) : null), [result]);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [personInfo, setPersonInfo] = useState<PersonInfo | null>(null);
  const [skipPersonInfo, setSkipPersonInfo] = useState(false);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);

  // Reklam Modalı State'i
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adVideoIndex, setAdVideoIndex] = useState(1);
  const [adTotalNeeded, setAdTotalNeeded] = useState(1);
  const [showSplash, setShowSplash] = useState(true);

  const pulse = useRef(new Animated.Value(0)).current;
  const { remaining: cooldownRemaining, notifyCongested } = useReadingCooldown(
    kind === 'coffee' ? 'kahve' : kind === 'palm' ? 'el' : 'yuz',
  );

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
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!res.canceled) addAssets(res.assets);
  }, [images.length, addAssets]);

  const takePhoto = useCallback(async () => {
    if (images.length >= MAX_IMAGES) return;
    setPermissionError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionError('Kameraya erişim izni verilmedi.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!res.canceled) addAssets(res.assets);
  }, [images.length, addAssets]);

  const removeImage = useCallback((index: number) => {
    resetResult();
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, [resetResult]);

  const interpret = useCallback(
    async (payWithCoins = false, forceUnlocked = false, forcedMode?: 'standard' | 'deep') => {
      const modeToRun = forcedMode || selectedMode;
      if (images.length < MIN_IMAGES || cooldownRemaining > 0 || !hasPersonChoice) return;
      setError(null);
      setCoinFallback(null);
      setQueueNotice(null);
      setActiveReadingMode(modeToRun);

      // DERİN MOD: Coin harcaması gerektirir (20 Coin)
      if (modeToRun === 'deep') {
        const spent = await spendCoins(DEEP_IMAGE_READING_COIN_COST);
        if (!spent) {
          setCoinFallback({ coins: await getCoins(), cost: DEEP_IMAGE_READING_COIN_COST });
          return;
        }
      } else {
        // STANDART MOD: Kategori bazlı kota ve video kontrolü
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
            setCoinFallback({ coins: await getCoins(), cost: READING_COIN_COST });
            return;
          }
        }

        if (payWithCoins) {
          const spent = await spendCoins(READING_COIN_COST);
          if (!spent) {
            setCoinFallback({ coins: await getCoins(), cost: READING_COIN_COST });
            return;
          }
        }
      }

      // Doğrulama: İlk 2 görseli kontrol et
      setValidating(true);
      try {
        const checkImages = images.slice(0, 2);
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
        // Doğrulama hatasında akışı kesme
      } finally {
        setValidating(false);
      }

      setLoading(true);

      const queueTimer = setTimeout(() => {
        setQueueNotice('Sistemdeki yoğunluk nedeniyle falınız inceleniyor; hazır olduğunda sonuç burada ve Geçmiş bölümünde görünecektir...');
      }, 12000);

      const isPaid = modeToRun === 'deep' || payWithCoins;

      try {
        const interpretation = await interpretImages(
          kind,
          images.map((img) => ({ mimeType: img.mimeType, data: img.base64 })),
          skipPersonInfo ? null : personInfo,
          modeToRun,
          isPaid,
        );
        clearTimeout(queueTimer);
        setQueueNotice(null);

        if (modeToRun === 'standard') {
          await recordCategoryReadingComplete(categoryKey, payWithCoins);
        }

        setResult(interpretation);
        await saveReadingHistory({
          type: kind === 'coffee' ? 'kahve' : kind === 'palm' ? 'el' : 'yuz',
          title: !skipPersonInfo && personInfo?.name?.trim()
            ? `${copy.shareTitle} [${modeToRun === 'deep' ? 'Detaylı' : 'Standart'}] (${personInfo.name.trim()})`
            : `${copy.shareTitle} [${modeToRun === 'deep' ? 'Detaylı' : 'Standart'}]`,
          result: interpretation,
        });
      } catch (err) {
        clearTimeout(queueTimer);
        // Ücret alınmış (derin mod her zaman, standart modda coin ile
        // ödendiyse) ama sonuç teslim edilemediyse iade et.
        const spentAmount = modeToRun === 'deep' ? DEEP_IMAGE_READING_COIN_COST : payWithCoins ? READING_COIN_COST : 0;
        if (spentAmount > 0) await addCoins(spentAmount);
        const refundNote = spentAmount > 0 ? ` (${spentAmount} coin iade edildi.)` : '';
        if (err instanceof ApiRequestError && err.congestion) {
          notifyCongested(err.retryAfterSeconds ?? 30);
          setError(err.message + refundNote);
        } else {
          setError(
            (err instanceof Error ? err.message : 'Sistem yoğunluğu nedeniyle biraz zaman alabilir, lütfen birazdan tekrar deneyin.') +
              refundNote,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [images, kind, categoryKey, selectedMode, copy.invalidSubject, copy.shareTitle, cooldownRemaining, notifyCongested, hasPersonChoice, skipPersonInfo, personInfo],
  );

  const handleAdComplete = useCallback(async () => {
    setAdModalVisible(false);
    await interpret(false, true, 'standard');
  }, [interpret]);

  const resetAll = useCallback(() => {
    setImages([]);
    resetResult();
  }, [resetResult]);

  const busy = loading || validating;

  useEffect(() => {
    if (!busy) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [busy, pulse]);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  const showPicker = !result && !loading && !validating && !coinFallback;
  const customBg = theme.background;

  return (
    <MysticTableBackground customBackground={customBg}>
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
            </View>

            {/* Analiz Modu Seçimi: Standart vs Derinlemesine Detaylı */}
            <View style={styles.modeSection}>
              <Text style={styles.modeSectionTitle}>Analiz Seviyesini Seç:</Text>
              <View style={styles.modeCardsRow}>
                <Pressable
                  onPress={() => setSelectedMode('standard')}
                  style={[
                    styles.modeCard,
                    selectedMode === 'standard' && styles.modeCardActive,
                  ]}
                >
                  <View style={styles.modeCardHeader}>
                    <MaterialCommunityIcons name="star-crescent" size={16} color={selectedMode === 'standard' ? GOLD : TEXT_MUTED} />
                    <Text style={[styles.modeCardTitle, selectedMode === 'standard' && styles.modeCardTitleActive]}>
                      Standart Yorum
                    </Text>
                  </View>
                  <Text style={styles.modeCardDesc}>Günlük ücretsiz hakkın veya video ile hızlı ve duru fal yorumu.</Text>
                  <View style={styles.modeBadgeFree}>
                    <Text style={styles.modeBadgeFreeText}>Ücretsiz / Video</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedMode('deep')}
                  style={[
                    styles.modeCard,
                    styles.modeCardDeep,
                    selectedMode === 'deep' && styles.modeCardDeepActive,
                  ]}
                >
                  <View style={styles.modeCardHeader}>
                    <MaterialCommunityIcons name="crown" size={18} color={GOLD} />
                    <Text style={[styles.modeCardTitle, styles.modeCardDeepTitle]}>
                      Kapsamlı Derin
                    </Text>
                  </View>
                  <Text style={styles.modeCardDesc}>4 Boyutlu detaylı rapor, vadeler, kombinasyonlar & derin külliyat.</Text>
                  <View style={styles.modeBadgeCoin}>
                    <Text style={styles.modeBadgeCoinText}>20 Coin</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Yorumlama Butonu */}
            <Pressable
              onPress={() => interpret(selectedMode === 'deep', false, selectedMode)}
              disabled={!canInterpret}
              style={({ pressed }) => [
                styles.actionButton,
                selectedMode === 'deep' && styles.actionButtonDeep,
                (!canInterpret || pressed) && styles.actionButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons
                name={selectedMode === 'deep' ? 'crown' : 'star-crescent'}
                size={18}
                color={NIGHT_CARD}
              />
              <Text style={styles.actionButtonText}>
                {selectedMode === 'deep' ? 'Kapsamlı Derin Analiz Yap (20 Coin)' : 'Falı Yorumla (Standart)'}
              </Text>
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
              <MaterialCommunityIcons
                name={activeReadingMode === 'deep' ? 'crown' : 'star-crescent'}
                size={36}
                color={GOLD}
              />
            </Animated.View>
            <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>
              {activeReadingMode === 'deep' ? copy.loadingDeep : copy.loading}
            </Animated.Text>
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
            cost={coinFallback.cost}
            coins={coinFallback.coins}
            onContinue={() => interpret(true, false, selectedMode)}
            onBuyCoins={() => navigation.navigate('CoinShop')}
            onDismiss={() => navigation.navigate('Home')}
          />
        )}

        {result && !resultSections && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeaderBadge}>
              <MaterialCommunityIcons
                name={activeReadingMode === 'deep' ? 'crown' : 'star-crescent'}
                size={16}
                color={GOLD}
              />
              <Text style={styles.resultHeaderBadgeText}>
                {activeReadingMode === 'deep' ? 'Kapsamlı Derin Mistik Analiz Raporu' : 'Standart Fal Yorumu'}
              </Text>
            </View>

            <Text style={styles.resultText}>{result}</Text>

            {/* Standart modda yapıldıysa Derin Analize Yükseltme Kartı */}
            {activeReadingMode === 'standard' && (
              <View style={styles.deepUpgradeCard}>
                <View style={styles.deepUpgradeTop}>
                  <MaterialCommunityIcons name="crown" size={22} color={GOLD} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deepUpgradeTitle}>Daha Derin ve Kapsamlı Analiz İster misin?</Text>
                    <Text style={styles.deepUpgradeSubtitle}>
                      Fotoğraflarını tekrar yüklemeden 4 boyutlu aşk düğümleri, kariyer bereket kapıları ve kilit vadeleri hemen çöz.
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => interpret(true, false, 'deep')}
                  style={({ pressed }) => [styles.deepUpgradeButton, pressed && styles.actionButtonPressed]}
                >
                  <MaterialCommunityIcons name="crown" size={16} color={NIGHT_CARD} />
                  <Text style={styles.deepUpgradeButtonText}>Kapsamlı Derin Analize Yükselt (20 Coin)</Text>
                </Pressable>
              </View>
            )}

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

        {result && resultSections && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeaderBadge}>
              <MaterialCommunityIcons name="crown" size={16} color={GOLD} />
              <Text style={styles.resultHeaderBadgeText}>Kapsamlı Derin Mistik Analiz Raporu</Text>
            </View>

            <Pressable
              onPress={resetAll}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            >
              <Ionicons name="refresh" size={18} color={NIGHT_CARD} />
              <Text style={styles.actionButtonText}>Yeni Fal Bak</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {result && resultSections ? (
        <ParchmentReadingResult
          visible={true}
          badge={copy.shareTitle}
          sections={resultSections}
          shareTextPrefix={`Mistik Rehber - ${copy.shareTitle}`}
          parchmentBg={theme.resultBg}
          accentColor={theme.accentColor}
          onHomePress={() => navigation.navigate('Home')}
          onNewReadingPress={resetAll}
        />
      ) : null}
      {theme.figure && (
        <EkolEntranceSplash
          visible={showSplash}
          figureSource={theme.figure}
          title={theme.splashTitle}
          subtitle={theme.splashSubtitle}
          accentColor={theme.accentColor}
          onFinish={() => setShowSplash(false)}
        />
      )}
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
    paddingBottom: 88,
  },
  pickWrap: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  instruction: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#E4E4E7',
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionError: {
    fontSize: 12.5,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 4,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: {
    borderWidth: 1.5,
    borderColor: 'rgba(229, 169, 60, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141418',
  },
  slotDisabled: {
    opacity: 0.35,
  },
  slotHint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    marginBottom: 2,
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
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDeep: {
    backgroundColor: '#F5C862',
    shadowColor: '#F5C862',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    backgroundColor: '#27272A',
    opacity: 0.5,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#18181D',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.4)',
    borderRadius: 14,
    paddingVertical: 13,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#000000',
  },
  actionButtonSecondaryText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeSection: {
    width: '100%',
    marginVertical: 4,
    gap: 8,
  },
  modeSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.4,
    marginLeft: 2,
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#16161B',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  modeCardActive: {
    borderColor: GOLD,
    backgroundColor: '#211C12',
  },
  modeCardDeep: {
    backgroundColor: '#161324',
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  modeCardDeepActive: {
    borderColor: '#C084FC',
    backgroundColor: '#25173B',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeCardTitleActive: {
    color: GOLD,
  },
  modeCardDeepTitle: {
    color: '#C084FC',
  },
  modeCardDesc: {
    fontSize: 10.5,
    color: TEXT_MUTED,
    lineHeight: 14,
    flex: 1,
  },
  modeBadgeFree: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  modeBadgeFreeText: {
    fontSize: 10,
    color: '#D4D4D8',
    fontWeight: '700',
  },
  modeBadgeCoin: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(229, 169, 60, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  modeBadgeCoinText: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '800',
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
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    gap: 16,
  },
  resultHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  resultHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
  },
  resultText: {
    fontSize: 15.5,
    lineHeight: 25.5,
    color: TEXT_PRIMARY,
  },
  deepUpgradeCard: {
    backgroundColor: 'rgba(38, 22, 75, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 200, 98, 0.5)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 6,
  },
  deepUpgradeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  deepUpgradeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F5C862',
    marginBottom: 3,
  },
  deepUpgradeSubtitle: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  deepUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5C862',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  deepUpgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: NIGHT_CARD,
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
    backgroundColor: '#18181D',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 169, 60, 0.4)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  personButtonFilled: {
    backgroundColor: '#201A10',
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
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
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
    fontWeight: '800',
    color: GOLD,
    marginBottom: 2,
  },
  personButtonSubtitle: {
    fontSize: 11.5,
    color: '#A1A1AA',
  },
  skipToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(24, 24, 29, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipToggleText: {
    fontSize: 12,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  skipToggleTextActive: {
    color: GOLD,
    fontWeight: '800',
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
    backgroundColor: 'rgba(30, 30, 32, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.35)',
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
});
