import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { ZODIACS, type Zodiac } from '@/services/zodiac';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { interpretZodiacCompatibility } from '@/services/readings-ai';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { getClassicCompatibility, type ClassicCompatibility } from '@/services/zodiacCompatibilityData';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import CornerTicks from '@/components/CornerTicks';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Compatibility'>;

const DEEP_AI_DURATION_SEC = 60; // 1 Dakika

const AI_STAGES = [
  {
    step: '1 / 4',
    title: 'Sinastri Haritası ve Gökyüzü Koordinatları',
    desc: 'İki burcun göksel koordinatları ve eksen çekimleri modelleniyor...',
    icon: 'compass-rose' as const,
  },
  {
    step: '2 / 4',
    title: 'Gezegen Açıları ve Duygusal Rezonans',
    desc: 'Venüs, Mars ve Ay açılarının karşılıklı çekim enerjisi hesaplanıyor...',
    icon: 'heart-pulse' as const,
  },
  {
    step: '3 / 4',
    title: 'Ruh Bağı ve Karmik Sınavlar',
    desc: 'İlişkinin güçlü tarafları ve dikkat edilmesi gereken dinamikler ayrıştırılıyor...',
    icon: 'scale-balance' as const,
  },
  {
    step: '4 / 4',
    title: 'Kişiselleştirilmiş Derin Sinastri Raporu',
    desc: 'Gelecek perspektifini aydınlatan 4 sütunlu kozmik rehberlik oluşturuluyor...',
    icon: 'script-text-outline' as const,
  },
];

function SignGrid({ selected, onSelect }: { selected: Zodiac | null; onSelect: (sign: Zodiac) => void }) {
  return (
    <View style={styles.grid}>
      {ZODIACS.map((sign) => {
        const info = ZODIAC_INFO[sign];
        const isSelected = selected === sign;
        return (
          <Pressable
            key={sign}
            onPress={() => onSelect(sign)}
            style={({ pressed }) => [
              styles.signCard,
              isSelected && styles.signCardSelected,
              pressed && styles.signCardPressed,
            ]}
          >
            <MaterialCommunityIcons
              name={info.icon as any}
              size={26}
              color={isSelected ? NIGHT_CARD : GOLD}
            />
            <Text style={[styles.signName, isSelected && styles.signNameSelected]}>
              {info.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CompatibilityScreen({ navigation }: Props) {
  const [signA, setSignA] = useState<Zodiac | null>(null);
  const [signB, setSignB] = useState<Zodiac | null>(null);

  // Klasik Analiz
  const classicData: ClassicCompatibility | null = useMemo(() => {
    if (signA && signB) {
      return getClassicCompatibility(signA, signB);
    }
    return null;
  }, [signA, signB]);

  // Yapay Zeka Derin Analizi
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [countdown, setCountdown] = useState(DEEP_AI_DURATION_SEC);
  const [deepResult, setDeepResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number } | null>(null);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  // Pulse animasyonu
  useEffect(() => {
    if (!isDeepLoading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isDeepLoading, pulse]);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });

  // Sıfırlama
  const reset = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setSignA(null);
    setSignB(null);
    setDeepResult(null);
    setIsDeepLoading(false);
    setError(null);
    setCoinFallback(null);
    setCountdown(DEEP_AI_DURATION_SEC);
  }, []);

  // 1 Dakikalık Yapay Zeka Derin Analizini Başlat
  const startDeepAiAnalysis = useCallback(async () => {
    if (!signA || !signB || isDeepLoading) return;

    setError(null);
    setCoinFallback(null);

    const spent = await spendCoins(15);
    if (!spent) {
      setCoinFallback({ coins: await getCoins() });
      return;
    }

    setIsDeepLoading(true);
    setCountdown(DEEP_AI_DURATION_SEC);

    // 60 saniyelik canlı geri sayım
    let currentRemaining = DEEP_AI_DURATION_SEC;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      currentRemaining -= 1;
      setCountdown(Math.max(0, currentRemaining));

      if (currentRemaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      }
    }, 1000);

    try {
      // Arka planda yapay zeka isteği
      const readingPromise = interpretZodiacCompatibility(
        ZODIAC_INFO[signA].name,
        ZODIAC_INFO[signB].name,
      );

      const reading = await readingPromise;

      // 60 saniyelik sürenin dolmasını bekle
      const elapsedMs = (DEEP_AI_DURATION_SEC - currentRemaining) * 1000;
      const waitRemainingMs = Math.max(0, DEEP_AI_DURATION_SEC * 1000 - elapsedMs);

      if (waitRemainingMs > 0) {
        await new Promise((res) => setTimeout(res, waitRemainingMs));
      }

      setDeepResult(reading);
    } catch (err) {
      await addCoins(15);
      const base = err instanceof Error ? err.message : 'Uyum analizi alınırken bir sorun oluştu.';
      setError(`${base} (15 coin iade edildi.)`);
    } finally {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setIsDeepLoading(false);
    }
  }, [signA, signB, isDeepLoading]);

  // Sayaç Formatı
  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [countdown]);

  const progressPercent = Math.min(
    100,
    Math.round(((DEEP_AI_DURATION_SEC - countdown) / DEEP_AI_DURATION_SEC) * 100),
  );

  const currentStage = useMemo(() => {
    const elapsed = DEEP_AI_DURATION_SEC - countdown;
    if (elapsed < 15) return AI_STAGES[0];
    if (elapsed < 30) return AI_STAGES[1];
    if (elapsed < 45) return AI_STAGES[2];
    return AI_STAGES[3];
  }, [countdown]);

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* BAŞLIK */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="heart-multiple-outline" size={32} color={GOLD} />
          <Text style={styles.headerTitle}>Burç Uyumu & Sinastri</Text>
          <Text style={styles.headerSubtitle}>
            {!signA
              ? 'Önce 1. burcu seç'
              : !signB
              ? 'Şimdi 2. burcu seç'
              : 'İki burcun kozmik rezonansı hazır'}
          </Text>
        </View>

        {/* 1. ADIM: 1. BURÇ SEÇİMİ */}
        {!signA && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>1. Burcu Seçin</Text>
            <SignGrid selected={signA} onSelect={setSignA} />
          </View>
        )}

        {/* 2. ADIM: 2. BURÇ SEÇİMİ */}
        {signA && !signB && (
          <View style={styles.stepWrap}>
            <View style={styles.selectedPillRow}>
              <View style={styles.selectedPill}>
                <MaterialCommunityIcons
                  name={ZODIAC_INFO[signA].icon as any}
                  size={18}
                  color={GOLD}
                />
                <Text style={styles.selectedPillText}>{ZODIAC_INFO[signA].name}</Text>
              </View>
              <Ionicons name="heart" size={16} color={GOLD} />
              <Text style={styles.selectedPillPrompt}>2. Burç Bekleniyor...</Text>
            </View>

            <Text style={styles.stepLabel}>2. Burcu Seçin</Text>
            <SignGrid selected={signB} onSelect={setSignB} />

            <Pressable onPress={() => setSignA(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={16} color={GOLD} />
              <Text style={styles.backBtnText}>1. Burcu Değiştir</Text>
            </Pressable>
          </View>
        )}

        {/* 3. ADIM: HER İKİ BURÇ DA SEÇİLDİĞİNDE SONUÇ EKRANI */}
        {signA && signB && classicData && (
          <View style={styles.resultContainer}>
            {/* ÜST BAŞLIK KARTI */}
            <View style={styles.pairHeaderCard}>
              <LinearGradient
                colors={['rgba(242, 200, 121, 0.15)', 'rgba(168, 85, 247, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <CornerTicks />

              <View style={styles.pairSignsRow}>
                <View style={styles.pairSignItem}>
                  <MaterialCommunityIcons
                    name={ZODIAC_INFO[signA].icon as any}
                    size={36}
                    color={GOLD}
                  />
                  <Text style={styles.pairSignName}>{ZODIAC_INFO[signA].name}</Text>
                </View>

                <View style={styles.heartPulseWrap}>
                  <Ionicons name="heart" size={28} color="#F472B6" />
                </View>

                <View style={styles.pairSignItem}>
                  <MaterialCommunityIcons
                    name={ZODIAC_INFO[signB].icon as any}
                    size={36}
                    color={GOLD}
                  />
                  <Text style={styles.pairSignName}>{ZODIAC_INFO[signB].name}</Text>
                </View>
              </View>

              {/* GENEL UYUM SKORU ROZETİ */}
              <View style={styles.scorePill}>
                <MaterialCommunityIcons name="star-crescent" size={16} color="#1A0D33" />
                <Text style={styles.scorePillText}>%{classicData.score} Uyum Puanı</Text>
              </View>

              <Text style={styles.elementDynamicText}>{classicData.elementDynamic}</Text>
            </View>

            {/* 1. BÖLÜM: KLASİK ANALİZ (ÜCRETSİZ & ANINDA) */}
            <View style={styles.classicSectionWrap}>
              <View style={styles.classicHeaderRow}>
                <MaterialCommunityIcons name="book-open-variant" size={18} color={GOLD} />
                <Text style={styles.classicSectionTitle}>KLASİK ASTROLOJİ ANALİZİ</Text>
              </View>

              {/* Aşk & Duygular */}
              <View style={styles.featureCard}>
                <CornerTicks />
                <View style={styles.featureCardTop}>
                  <MaterialCommunityIcons name="heart-outline" size={18} color="#F472B6" />
                  <Text style={styles.featureCardTitle}>Aşk ve Duygusal Uyum</Text>
                </View>
                <Text style={styles.featureCardBody}>{classicData.loveOverview}</Text>
              </View>

              {/* İletişim & Zihin */}
              <View style={styles.featureCard}>
                <CornerTicks />
                <View style={styles.featureCardTop}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={18} color="#38BDF8" />
                  <Text style={styles.featureCardTitle}>İletişim ve Zihinsel Paylaşım</Text>
                </View>
                <Text style={styles.featureCardBody}>{classicData.communication}</Text>
              </View>

              {/* Tutku & Çekim */}
              <View style={styles.featureCard}>
                <CornerTicks />
                <View style={styles.featureCardTop}>
                  <MaterialCommunityIcons name="fire" size={18} color="#F59E0B" />
                  <Text style={styles.featureCardTitle}>Tutku ve Romantik Kimya</Text>
                </View>
                <Text style={styles.featureCardBody}>{classicData.passion}</Text>
              </View>

              {/* Olası Çatışmalar & Zorluklar */}
              <View style={styles.featureCard}>
                <CornerTicks />
                <View style={styles.featureCardTop}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#EF4444" />
                  <Text style={[styles.featureCardTitle, { color: '#EF4444' }]}>
                    Zorlayıcı Noktalar & Riskler
                  </Text>
                </View>
                <Text style={styles.featureCardBody}>{classicData.challenges}</Text>
              </View>

              {/* Altın Tavsiye */}
              <View style={[styles.featureCard, { borderColor: GOLD }]}>
                <CornerTicks />
                <View style={styles.featureCardTop}>
                  <MaterialCommunityIcons name="star-crescent" size={18} color={GOLD} />
                  <Text style={[styles.featureCardTitle, { color: GOLD }]}>
                    İlişki Tavsiyesi
                  </Text>
                </View>
                <Text style={[styles.featureCardBody, { color: '#FFFFFF' }]}>
                  {classicData.advice}
                </Text>
              </View>
            </View>

            {/* YETERSİZ COIN KUTUSU */}
            {coinFallback && (
              <CoinFallbackBox
                cost={15}
                coins={coinFallback.coins}
                onContinue={startDeepAiAnalysis}
                onBuyCoins={() => navigation.navigate('CoinShop')}
                onDismiss={() => setCoinFallback(null)}
                dismissLabel="Kapat"
              />
            )}

            {/* HATA MESAJI */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* 2. BÖLÜM: 1 DAKİKALIK YAPAY ZEKA DERİN SİNASTRİ ODASI / SONUÇLARI */}
            {isDeepLoading && (
              <View style={styles.deepLoadingCard}>
                <LinearGradient
                  colors={['rgba(242, 200, 121, 0.16)', 'rgba(168, 85, 247, 0.22)', 'rgba(11, 10, 31, 0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <CornerTicks />

                <Animated.View
                  style={{
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                    marginBottom: 10,
                  }}
                >
                  <MaterialCommunityIcons name="star-crescent" size={44} color={GOLD} />
                </Animated.View>

                <Text style={styles.deepLoadingTitle}>Derin Sinastri Analizi Hazırlanıyor</Text>
                <Text style={styles.deepLoadingSub}>
                  Gezegen Haritaları ve Derinlemesine Sinastri Hesaplaması
                </Text>

                {/* Dijital Sayaç */}
                <View style={styles.countdownBadge}>
                  <Ionicons name="time-outline" size={20} color={GOLD} />
                  <Text style={styles.countdownNumber}>{formattedCountdown}</Text>
                </View>

                {/* İlerleme Çubuğu */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressPercentText}>%{progressPercent} Tamamlandı</Text>

                {/* Canlı Aşama Kartı */}
                <View style={styles.activeStageCard}>
                  <View style={styles.stageHeaderRow}>
                    <MaterialCommunityIcons name={currentStage.icon} size={16} color={GOLD} />
                    <Text style={styles.stageStepText}>{currentStage.step}</Text>
                  </View>
                  <Text style={styles.stageTitleText}>{currentStage.title}</Text>
                  <Text style={styles.stageDescText}>{currentStage.desc}</Text>
                </View>

                <Text style={styles.deepNoticeText}>
                  Lütfen sayfadan ayrılmayın. İki burcun birbirine temas eden tüm açıları ve karmik çekim haritası en ince detayına kadar hesaplanıyor.
                </Text>
              </View>
            )}

            {/* YAPAY ZEKA DERİN RAPORU AÇILDIĞINDA */}
            {deepResult && !isDeepLoading && (
              <View style={styles.aiReportCard}>
                <CornerTicks />
                <View style={styles.aiReportHeader}>
                  <MaterialCommunityIcons name="star-crescent" size={22} color={GOLD} />
                  <Text style={styles.aiReportTitle}>DERİN SİNASTRİ ANALİZ RAPORU</Text>
                </View>

                <Text style={styles.aiReportText}>{deepResult}</Text>

                <View style={styles.aiReportActions}>
                  <ShareButton text={deepResult} label="Analizi Paylaş" />
                </View>
              </View>
            )}

            {/* YAPAY ZEKA BUTONU (HENÜZ ALINMADIYSA) */}
            {!deepResult && !isDeepLoading && (
              <View style={styles.aiCtaCard}>
                <CornerTicks />
                <View style={styles.aiCtaTopRow}>
                  <MaterialCommunityIcons name="crystal-ball" size={22} color={GOLD} />
                  <Text style={styles.aiCtaTitle}>Derinlemesine Sinastri Analizi</Text>
                  <View style={styles.priceBadge}>
                    <MaterialCommunityIcons name="star-circle" size={14} color={GOLD} />
                    <Text style={styles.priceBadgeText}>15 Coin</Text>
                  </View>
                </View>

                <Text style={styles.aiCtaDesc}>
                  Klasik yorumun ötesine geçin! İki burcun gezegen açıları, ruh eşi dinamikleri ve geleçeğine dair 1 dakikalık kapsamlı, derinlemesine kişisel analiz raporu.
                </Text>

                <Pressable
                  onPress={startDeepAiAnalysis}
                  style={({ pressed }) => [styles.aiCtaButton, pressed && styles.aiCtaButtonPressed]}
                >
                  <MaterialCommunityIcons name="star-crescent" size={18} color="#1A0D33" />
                  <Text style={styles.aiCtaButtonText}>1 Dk Derin Analizi Başlat (15 Coin)</Text>
                </Pressable>
              </View>
            )}

            {/* BAŞKA ÇİFT DENE BUTONU */}
            <Pressable onPress={reset} style={styles.resetButton}>
              <Ionicons name="refresh" size={16} color={GOLD} />
              <Text style={styles.resetButtonText}>Başka Çift Dene</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 48,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  stepWrap: {
    gap: 12,
  },
  stepLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  signCard: {
    width: '31%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  signCardSelected: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  signCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  signName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  signNameSelected: {
    color: NIGHT_CARD,
    fontWeight: '800',
  },
  selectedPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    marginBottom: 8,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  selectedPillPrompt: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  backBtnText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },
  resultContainer: {
    gap: 16,
  },
  pairHeaderCard: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 18,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  pairSignsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  pairSignItem: {
    alignItems: 'center',
    gap: 6,
  },
  pairSignName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heartPulseWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(244, 114, 182, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  scorePillText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A0D33',
  },
  elementDynamicText: {
    fontSize: 12,
    color: GOLD_SOFT,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  classicSectionWrap: {
    gap: 10,
  },
  classicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  classicSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  featureCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    padding: 14,
    gap: 6,
  },
  featureCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featureCardBody: {
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_PRIMARY,
  },
  aiCtaCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.45)',
    padding: 18,
    gap: 10,
    marginTop: 6,
  },
  aiCtaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiCtaTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: GOLD,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  priceBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: GOLD,
  },
  aiCtaDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: TEXT_PRIMARY,
  },
  aiCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  aiCtaButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  aiCtaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0D33',
    letterSpacing: 0.3,
  },
  deepLoadingCard: {
    position: 'relative',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 22,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    marginTop: 6,
  },
  deepLoadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
  },
  deepLoadingSub: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 4,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  countdownNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 1,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD_SOFT,
  },
  activeStageCard: {
    backgroundColor: 'rgba(11, 10, 31, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    padding: 12,
    width: '100%',
    gap: 4,
    marginTop: 6,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageStepText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
  },
  stageTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stageDescText: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  deepNoticeText: {
    fontSize: 11,
    color: GOLD_SOFT,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    fontStyle: 'italic',
  },
  aiReportCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.95)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: GOLD,
    padding: 18,
    gap: 12,
    marginTop: 6,
  },
  aiReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
    paddingBottom: 10,
  },
  aiReportTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  aiReportText: {
    fontSize: 13.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  aiReportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    textAlign: 'center',
    marginVertical: 4,
  },
});
