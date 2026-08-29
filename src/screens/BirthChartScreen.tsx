import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  calculateBirthChart,
  type BirthChart,
  type DetailedBirthChart,
} from '@/services/astrology';
import { interpretBirthChart } from '@/services/readings-ai';
import { getCredits, spendCredit } from '@/services/credits';
import { getCoins, spendCoins, addCoins } from '@/services/coins';
import { READING_COIN_COST, DETAILED_BIRTH_CHART_COIN_COST } from '@/constants/economy';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import { resolveBirthDate } from '@/utils/resolveBirthDate';
import { ZODIAC_INFO } from '@/constants/zodiacInfo';
import { TURKISH_CITIES } from '@/constants/turkishCities';
import BirthDataForm, { EMPTY_BIRTH_FORM, type BirthFormValue } from '@/components/BirthDataForm';
import NatalChartWheel from '@/components/NatalChartWheel';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import ShareButton from '@/components/ShareButton';
import FeatureIcon from '@/components/FeatureIcon';
import CornerTicks from '@/components/CornerTicks';
import { FEATURE_ICONS } from '@/assets/icons';
import {
  getActiveBirthChartJob,
  startBirthChartBackgroundJob,
  clearActiveBirthChartJob,
  runJobExecution,
  type BirthChartJob,
} from '@/services/birthChartJob';
import { saveReadingHistory } from '@/services/readingHistory';
import { GOLD, GOLD_SOFT, NIGHT_CARD, NIGHT_MID, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BirthChart'>;

type AnalysisMode = 'basic' | 'detailed';
type ResultTab = 'wheel' | 'planets' | 'aspects' | 'report';

const DETAILED_DURATION_SEC = 180; // 3 Dakika

const DETAILED_STAGES = [
  {
    step: 'Adım 1/5',
    title: 'NASA Gök Efemerisleri & 10 Gezegen Dereceleri',
    desc: 'Güneş, Ay ve 8 gezegenin ekliptik koordinatları NASA efemeris verileriyle taranıyor...',
    icon: 'satellite-variant' as const,
  },
  {
    step: 'Adım 2/5',
    title: '12 Ev Sistemi & Ufuk Aksları (ASC & MC)',
    desc: 'Yükselen, Alçalan ve Tepe Noktası kadrana yerleştiriliyor, 12 yaşam evi hesaplanıyor...',
    icon: 'chart-arc' as const,
  },
  {
    step: 'Adım 3/5',
    title: 'Gezegen Açıları & Pars Fortunae (Şans Noktası)',
    desc: 'Kavuşum, üçgen ve kare açılar taranıyor; antik formülle Şans Noktanız çıkarılıyor...',
    icon: 'clover' as const,
  },
  {
    step: 'Adım 4/5',
    title: 'Venüs-Mars Sinastri & Ruh Eşi Uyumu',
    desc: '7. Ev evlilik aksı ve aşk uyumunuz taranıyor, kader bağları hesaplanıyor...',
    icon: 'heart-pulse' as const,
  },
  {
    step: 'Adım 5/5',
    title: 'Karmik Ay Düğümleri & Başyapıt Rapor',
    desc: 'Ruhun yaşam amacı mühürleniyor ve 5 bölümlü detaylı astroloji dosyanız tamamlanıyor...',
    icon: 'star-shooting' as const,
  },
];

export default function BirthChartScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(width - 48, 360);

  const [form, setForm] = useState<BirthFormValue>(EMPTY_BIRTH_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [isDetailedLoading, setIsDetailedLoading] = useState(false);
  const [countdown, setCountdown] = useState(DETAILED_DURATION_SEC);
  const [activeTab, setActiveTab] = useState<ResultTab>('wheel');

  const [basicChart, setBasicChart] = useState<BirthChart | null>(null);
  const [detailedChart, setDetailedChart] = useState<DetailedBirthChart | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number; mode: AnalysisMode } | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UYGULAMA AÇILDIĞINDA VEYA EKRANA DÖNÜLDÜĞÜNDE ARKA PLANDAKİ İŞİ KONTROL ET
  useEffect(() => {
    let isMounted = true;

    async function checkPendingJob() {
      const job = await getActiveBirthChartJob();
      if (!job || !isMounted) return;

      const now = Date.now();
      const remainingMs = job.targetFinishAt - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (job.status === 'completed' && job.detailedChart && job.aiReport) {
        if (remainingSec <= 0) {
          // Süre dolmuş, analiz hazır!
          setDetailedChart(job.detailedChart);
          setResult(job.aiReport);
          setLoading(false);
          setIsDetailedLoading(false);
        } else {
          // Analiz bitti ama 3 dakikalık süre henüz bitmedi, geri sayımı sürdür
          setLoading(true);
          setIsDetailedLoading(true);
          setCountdown(remainingSec);
          startCountdownTimer(job.targetFinishAt, job);
        }
      } else if (job.status === 'processing') {
        setLoading(true);
        setIsDetailedLoading(true);
        setCountdown(remainingSec > 0 ? remainingSec : 0);
        startCountdownTimer(job.targetFinishAt, job);

        // Arka plan işi bir şekilde durmuşsa tekrar tetikle
        runJobExecution(job)
          .then((updated) => {
            if (isMounted && updated.detailedChart && updated.aiReport) {
              if (Date.now() >= updated.targetFinishAt) {
                setDetailedChart(updated.detailedChart);
                setResult(updated.aiReport);
                setLoading(false);
                setIsDetailedLoading(false);
              }
            }
          })
          .catch((err) => {
            if (isMounted) setError(err.message);
          });
      }
    }

    checkPendingJob();

    return () => {
      isMounted = false;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const startCountdownTimer = (targetFinishAt: number, currentJob: BirthChartJob) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(async () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetFinishAt - now) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

        // Son durumu al
        const latest = await getActiveBirthChartJob();
        if (latest?.status === 'completed' && latest.detailedChart && latest.aiReport) {
          setDetailedChart(latest.detailedChart);
          setResult(latest.aiReport);
          setLoading(false);
          setIsDetailedLoading(false);
        } else if (currentJob.detailedChart && currentJob.aiReport) {
          setDetailedChart(currentJob.detailedChart);
          setResult(currentJob.aiReport);
          setLoading(false);
          setIsDetailedLoading(false);
        }
      }
    }, 1000);
  };

  const calculate = useCallback(
    async (mode: AnalysisMode, payWithCoins = false) => {
      setFormError(null);
      setError(null);
      setCoinFallback(null);

      const resolved = resolveBirthDate(form);
      if (!resolved.date) {
        setFormError(resolved.error);
        return;
      }
      const city = TURKISH_CITIES[form.cityIndex!];
      const birthData = { date: resolved.date, latitude: city.latitude, longitude: city.longitude };

      setLoading(true);

      let spentAmount = 0; // senkron olarak (arka plan işi tetiklenmeden önce) hata olursa iade edilecek

      try {
        if (mode === 'detailed') {
          // Detaylı analiz coin kontrolü
          const coinsAvailable = await getCoins();
          if (coinsAvailable < DETAILED_BIRTH_CHART_COIN_COST) {
            setCoinFallback({ coins: coinsAvailable, cost: DETAILED_BIRTH_CHART_COIN_COST, mode: 'detailed' });
            setLoading(false);
            return;
          }

          const spent = await spendCoins(DETAILED_BIRTH_CHART_COIN_COST);
          if (!spent) {
            setCoinFallback({ coins: await getCoins(), cost: DETAILED_BIRTH_CHART_COIN_COST, mode: 'detailed' });
            setLoading(false);
            return;
          }
          spentAmount = DETAILED_BIRTH_CHART_COIN_COST;

          // 3 Dakikalık Özel Bekleme ve Arka Plan İşi Başlat
          setIsDetailedLoading(true);
          setCountdown(DETAILED_DURATION_SEC);

          const birthDateFormatted = `${resolved.date.toLocaleDateString('tr-TR')}${
            form.unknownTime ? '' : ` ${form.hour}:${form.minute}`
          }`;
          const newJob = await startBirthChartBackgroundJob(birthData, city.name, birthDateFormatted);

          startCountdownTimer(newJob.targetFinishAt, newJob);
        } else {
          // Genel analiz (standart kredi veya fallback coin)
          if (payWithCoins) {
            const spent = await spendCoins(READING_COIN_COST);
            if (!spent) {
              setCoinFallback({ coins: await getCoins(), cost: READING_COIN_COST, mode: 'basic' });
              setLoading(false);
              return;
            }
            spentAmount = READING_COIN_COST;
          } else {
            const remaining = await getCredits();
            if (remaining < 1) {
              setCoinFallback({ coins: await getCoins(), cost: READING_COIN_COST, mode: 'basic' });
              setLoading(false);
              return;
            }
          }

          const basic = calculateBirthChart(birthData);
          const aiText = await interpretBirthChart(
            ZODIAC_INFO[basic.sunSign].name,
            ZODIAC_INFO[basic.moonSign].name,
            ZODIAC_INFO[basic.risingSign].name,
          );

          if (!payWithCoins) await spendCredit();

          // Genel analizi de geçmişe kaydet
          await saveReadingHistory({
            type: 'dogumHaritasi',
            title: `Doğum Haritası (Genel · ${city.name})`,
            result: aiText,
            metadata: {
              basicChart: basic,
              isDetailed: false,
            },
          });

          setBasicChart(basic);
          setDetailedChart(null);
          setResult(aiText);
          setLoading(false);
        }
      } catch (err) {
        let message = err instanceof Error ? err.message : 'Doğum haritası oluşturulurken bir sorun oluştu.';
        if (spentAmount > 0) {
          await addCoins(spentAmount);
          message += ` (${spentAmount} coin iade edildi.)`;
        }
        setError(message);
        setLoading(false);
        setIsDetailedLoading(false);
      }
    },
    [form],
  );

  const reset = useCallback(async () => {
    await clearActiveBirthChartJob();
    setBasicChart(null);
    setDetailedChart(null);
    setResult(null);
    setError(null);
    setCoinFallback(null);
    setIsDetailedLoading(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading, pulse]);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  const showForm = !basicChart && !detailedChart && !loading && !coinFallback && !error;

  // 3 Dakikalık aşama indeksi (0-4)
  const currentStageIndex = useMemo(() => {
    const elapsed = DETAILED_DURATION_SEC - countdown;
    if (elapsed < 36) return 0;
    if (elapsed < 71) return 1;
    if (elapsed < 106) return 2;
    if (elapsed < 146) return 3;
    return 4;
  }, [countdown]);

  const currentStage = DETAILED_STAGES[currentStageIndex];

  // Dakika ve saniye formatlama (örn: 02:45)
  const formattedCountdown = useMemo(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [countdown]);

  const progressPercent = Math.min(100, Math.round(((DETAILED_DURATION_SEC - countdown) / DETAILED_DURATION_SEC) * 100));

  // Detaylı rapor bölümlerini ayrıştırma
  const parsedReportSections = useMemo(() => {
    if (!result || !detailedChart) return null;
    const headers = [
      '1. BÜYÜK ÜÇLÜ VE RUHUN KİMLİĞİ:',
      '2. AŞK, İLİŞKİLER VE ÇEKİM HARİTASI:',
      '3. KARİYER, PARA VE BAŞARI POTANSİYELİ:',
      '4. KARMİK DERSLER VE HAYAT SINAVLARI:',
      '5. ELEMENT DENGESİ VE MİSTİK YAŞAM REHBERİ:',
    ];

    const sections: { title: string; body: string }[] = [];
    let remaining = result;

    for (let i = 0; i < headers.length; i++) {
      const currentHeader = headers[i];
      const nextHeader = headers[i + 1];

      const startIdx = remaining.indexOf(currentHeader);
      if (startIdx !== -1) {
        const bodyStart = startIdx + currentHeader.length;
        const endIdx = nextHeader ? remaining.indexOf(nextHeader) : remaining.length;
        const content = remaining.slice(bodyStart, endIdx !== -1 ? endIdx : undefined).trim();
        sections.push({
          title: currentHeader.replace(':', ''),
          body: content,
        });
      }
    }

    return sections.length > 0 ? sections : [{ title: 'Doğum Haritası Raporu', body: result }];
  }, [result, detailedChart]);

  return (
    <MysticTableBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* FORM ALANI */}
          {showForm && (
            <View style={styles.formWrap}>
              <FeatureIcon
                source={FEATURE_ICONS.birthChart}
                fallback={<MaterialCommunityIcons name="chart-donut" size={36} color={GOLD} />}
                size={88}
              />
              <Text style={styles.headerMainTitle}>Doğum Haritası</Text>
              <Text style={styles.instruction}>
                Doğduğun andaki gökyüzü haritanı ve kader planını keşfetmek için doğum bilgilerini gir.
              </Text>

              <BirthDataForm value={form} onChange={setForm} />

              {formError && <Text style={styles.formErrorText}>{formError}</Text>}

              {/* İKİ SEÇENEKLİ ANALİZ BUTONLARI */}
              <View style={styles.buttonsContainer}>
                {/* 1. SEÇENEK: EN DETAYLI HARİTA VE BURÇ ANALİZİ (PREMIUM / NASA STANDARTLARI) */}
                <Pressable
                  onPress={() => calculate('detailed')}
                  style={({ pressed }) => [styles.detailedCardBtn, pressed && styles.pressed]}
                >
                  <LinearGradient
                    colors={['rgba(242, 200, 121, 0.22)', 'rgba(168, 85, 247, 0.28)', 'rgba(26, 16, 52, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <CornerTicks />

                  <View style={styles.detailedBadgeRow}>
                    <View style={styles.nasaBadge}>
                      <MaterialCommunityIcons name="satellite-variant" size={13} color="#1A0D33" />
                      <Text style={styles.nasaBadgeText}>NASA Standartlarında</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <MaterialCommunityIcons name="star-circle" size={15} color={GOLD} />
                      <Text style={styles.priceBadgeText}>25 Coin</Text>
                    </View>
                  </View>

                  <View style={styles.detailedTitleRow}>
                    <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
                    <Text style={styles.detailedTitle}>En Detaylı Harita & Burç Analizi</Text>
                  </View>

                  <Text style={styles.detailedDesc}>
                    Gerçek gökyüzü koordinatları, 10 gezegenin tam dereceleri, 12 ev yerleşimi, gezegen açıları,
                    Aşk & Ruh Eşi uyumu, Şans Noktası, Ay Düğümleri ve hayatın tüm alanlarını kapsayan en kapsamlı
                    profesyonel analiz.
                  </Text>

                  <View style={styles.detailedCtaButton}>
                    <Text style={styles.detailedCtaText}>3 Dk Kapsamlı Analizi Başlat (25 Coin)</Text>
                  </View>
                </Pressable>

                {/* 2. SEÇENEK: HARİTAMI ÇIKAR (GENEL) */}
                <Pressable
                  onPress={() => calculate('basic')}
                  style={({ pressed }) => [styles.basicButton, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="compass-outline" size={18} color={GOLD} />
                  <Text style={styles.basicButtonText}>Haritamı Çıkar (Genel)</Text>
                </Pressable>
                <Text style={styles.basicHint}>Ücretsiz günlük kredi ile Güneş, Ay ve Yükselen özeti</Text>
              </View>
            </View>
          )}

          {/* 3 DAKİKALIK ÖZEL DETAYLI YÜKLENME ODASI */}
          {loading && isDetailedLoading && (
            <View style={styles.deepLoadingCard}>
              <LinearGradient
                colors={['rgba(242, 200, 121, 0.16)', 'rgba(168, 85, 247, 0.22)', 'rgba(11, 10, 31, 0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <CornerTicks />

              {/* Dönen Ay-Yıldız İkonu */}
              <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }], marginBottom: 12 }}>
                <MaterialCommunityIcons name="star-crescent" size={48} color={GOLD} />
              </Animated.View>

              <Text style={styles.deepLoadingMainTitle}>Kozmik Doğum Haritası Hazırlanıyor</Text>
              <Text style={styles.deepLoadingSubtitle}>
                NASA Gök Efemerisleri & Derin Astroloji Analiz Odası
              </Text>

              {/* Büyük Geri Sayım Sayacı */}
              <View style={styles.countdownBadge}>
                <Ionicons name="time-outline" size={20} color={GOLD} />
                <Text style={styles.countdownNumber}>{formattedCountdown}</Text>
              </View>

              {/* Canlı İlerleme Çubuğu */}
              <View style={styles.deepProgressBarTrack}>
                <View style={[styles.deepProgressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressPercentText}>%{progressPercent} Tamamlandı</Text>

              {/* Canlı Aşama Kartı */}
              <View style={styles.activeStageCard}>
                <View style={styles.stageHeaderRow}>
                  <MaterialCommunityIcons name={currentStage.icon} size={18} color={GOLD} />
                  <Text style={styles.stageStepText}>{currentStage.step}</Text>
                </View>
                <Text style={styles.stageTitleText}>{currentStage.title}</Text>
                <Text style={styles.stageDescText}>{currentStage.desc}</Text>
              </View>

              <Text style={styles.deepLoadingNotice}>
                Lütfen sayfadan ayrılmayın. Bu çalışma yüzeysel bir fal değil; doğum anınızın tüm koordinatlarını
                haritalandıran ve geleceğe ışık tutan en detaylı profesyonel astroloji analizidir.
              </Text>
            </View>
          )}

          {/* GENEL ANALİZ İÇİN STANDART YÜKLENİYOR */}
          {loading && !isDetailedLoading && (
            <View style={styles.loadingWrap}>
              <Animated.View style={{ opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
                <MaterialCommunityIcons name="star-crescent" size={42} color={GOLD} />
              </Animated.View>
              <Animated.Text style={[styles.loadingText, { opacity: pulseOpacity }]}>
                Güneş, Ay ve Yükselen koordinatları hesaplanıyor...
              </Animated.Text>
            </View>
          )}

          {/* HATA DURUMU */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={24} color="#E08A8A" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => calculate('basic')} style={styles.retryButton}>
                <Ionicons name="refresh" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </Pressable>
            </View>
          )}

          {/* COIN FALLBACK KUTUSU */}
          {coinFallback && (
            <CoinFallbackBox
              cost={coinFallback.cost}
              coins={coinFallback.coins}
              onContinue={() => calculate(coinFallback.mode, true)}
              onBuyCoins={() => navigation.navigate('CoinShop')}
              onDismiss={() => navigation.navigate('Home')}
            />
          )}

          {/* DETAYLI PROFESYONEL SONUÇ EKRANI */}
          {detailedChart && result && (
            <View style={styles.detailedResultWrap}>
              {/* Üst Bilgi Başlığı */}
              <View style={styles.resultHeaderCard}>
                <CornerTicks />
                <View style={styles.resultHeaderTitleRow}>
                  <MaterialCommunityIcons name="star-crescent" size={20} color={GOLD} />
                  <Text style={styles.resultHeaderTitle}>Profesyonel Doğum Haritası</Text>
                </View>
                <Text style={styles.resultHeaderSubtitle}>
                  NASA Standartlarında Gerçek Gökyüzü Koordinatları & 5 Derin Analiz
                </Text>
              </View>

              {/* 4 SEKME GEZİNTİSİ */}
              <View style={styles.tabsRow}>
                <Pressable
                  style={[styles.tabButton, activeTab === 'wheel' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('wheel')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'wheel' && styles.tabButtonTextActive]}>
                    🌌 Harita Çarkı
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, activeTab === 'planets' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('planets')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'planets' && styles.tabButtonTextActive]}>
                    🪐 Gezegenler & Evler
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, activeTab === 'aspects' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('aspects')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'aspects' && styles.tabButtonTextActive]}>
                    📐 Açılar ({detailedChart.aspects.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
                  onPress={() => setActiveTab('report')}
                >
                  <Text style={[styles.tabButtonText, activeTab === 'report' && styles.tabButtonTextActive]}>
                    📜 Detaylı Analiz
                  </Text>
                </Pressable>
              </View>

              {/* SEKME 1: ÇARK & ÖZET */}
              {activeTab === 'wheel' && (
                <View style={styles.tabContentWrap}>
                  {/* Büyütülmüş ve Mor Kutulardan Arındırılmış Zodyak Çarkı */}
                  <View style={styles.wheelCard}>
                    <NatalChartWheel
                      sunLongitude={detailedChart.sunLongitude}
                      moonLongitude={detailedChart.moonLongitude}
                      risingLongitude={detailedChart.risingLongitude}
                      planets={detailedChart.planets}
                      aspects={detailedChart.aspects}
                      houses={detailedChart.houses}
                      size={wheelSize}
                    />
                  </View>

                  {/* Büyük Üçlü Kartları */}
                  <Text style={styles.sectionTitle}>BÜYÜK ÜÇLÜ</Text>
                  <View style={styles.signRow}>
                    <View style={styles.signCard}>
                      <MaterialCommunityIcons
                        name={ZODIAC_INFO[detailedChart.sunSign].icon as any}
                        size={28}
                        color="#F59E0B"
                      />
                      <Text style={styles.signCardLabel}>Güneş ☉</Text>
                      <Text style={styles.signCardValue}>{ZODIAC_INFO[detailedChart.sunSign].name}</Text>
                    </View>
                    <View style={styles.signCard}>
                      <MaterialCommunityIcons
                        name={ZODIAC_INFO[detailedChart.moonSign].icon as any}
                        size={28}
                        color="#CBD5E1"
                      />
                      <Text style={styles.signCardLabel}>Ay ☽</Text>
                      <Text style={styles.signCardValue}>{ZODIAC_INFO[detailedChart.moonSign].name}</Text>
                    </View>
                    <View style={styles.signCard}>
                      <MaterialCommunityIcons
                        name={ZODIAC_INFO[detailedChart.risingSign].icon as any}
                        size={28}
                        color={GOLD}
                      />
                      <Text style={styles.signCardLabel}>Yükselen ASC</Text>
                      <Text style={styles.signCardValue}>{ZODIAC_INFO[detailedChart.risingSign].name}</Text>
                    </View>
                  </View>

                  {/* Element Dağılımı Barları */}
                  <View style={styles.statsCard}>
                    <CornerTicks />
                    <View style={styles.statsHeader}>
                      <MaterialCommunityIcons name="fire" size={18} color={GOLD} />
                      <Text style={styles.statsTitle}>
                        Element Dengesi (Baskın: {detailedChart.elements.dominant})
                      </Text>
                    </View>
                    <View style={styles.barsList}>
                      {[
                        { name: 'Ateş', val: detailedChart.elements.fire.percentage, color: '#EF4444' },
                        { name: 'Toprak', val: detailedChart.elements.earth.percentage, color: '#10B981' },
                        { name: 'Hava', val: detailedChart.elements.air.percentage, color: '#38BDF8' },
                        { name: 'Su', val: detailedChart.elements.water.percentage, color: '#818CF8' },
                      ].map((el) => (
                        <View key={el.name} style={styles.barItem}>
                          <View style={styles.barLabelRow}>
                            <Text style={styles.barName}>{el.name}</Text>
                            <Text style={styles.barPercent}>%{el.val}</Text>
                          </View>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${el.val}%`, backgroundColor: el.color }]} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Nitelik Dağılımı */}
                  <View style={styles.statsCard}>
                    <CornerTicks />
                    <View style={styles.statsHeader}>
                      <MaterialCommunityIcons name="compass" size={18} color={GOLD} />
                      <Text style={styles.statsTitle}>
                        Nitelik Dengesi (Baskın: {detailedChart.modalities.dominant})
                      </Text>
                    </View>
                    <View style={styles.barsList}>
                      {[
                        { name: 'Öncü (Başlatan)', val: detailedChart.modalities.cardinal.percentage, color: '#F59E0B' },
                        { name: 'Sabit (Sürdüren)', val: detailedChart.modalities.fixed.percentage, color: '#A855F7' },
                        { name: 'Değişken (Uyum Sağlayan)', val: detailedChart.modalities.mutable.percentage, color: '#22D3EE' },
                      ].map((m) => (
                        <View key={m.name} style={styles.barItem}>
                          <View style={styles.barLabelRow}>
                            <Text style={styles.barName}>{m.name}</Text>
                            <Text style={styles.barPercent}>%{m.val}</Text>
                          </View>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${m.val}%`, backgroundColor: m.color }]} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* SEKME 2: 10 GEZEGEN & 12 EV */}
              {activeTab === 'planets' && (
                <View style={styles.tabContentWrap}>
                  <Text style={styles.sectionTitle}>10 GEZEGENİN TAM DERECELERİ</Text>
                  <View style={styles.planetsList}>
                    {detailedChart.planets.map((p) => (
                      <View key={p.key} style={styles.planetCard}>
                        <CornerTicks />
                        <View style={styles.planetCardTop}>
                          <View style={styles.planetSymbolCircle}>
                            <Text style={styles.planetSymbolText}>{p.symbol}</Text>
                          </View>
                          <View style={styles.planetNameWrap}>
                            <Text style={styles.planetNameText}>{p.name}</Text>
                            <Text style={styles.planetSignText}>
                              {p.signName} Burcunda ({p.formattedDegree})
                            </Text>
                          </View>
                          <View style={styles.planetHouseBadge}>
                            <Text style={styles.planetHouseBadgeText}>{p.house}. Ev</Text>
                          </View>
                        </View>
                        {p.isRetrograde && (
                          <View style={styles.retroBadge}>
                            <Text style={styles.retroBadgeText}>[RETRO · GERİLEME]</Text>
                          </View>
                        )}
                        <Text style={styles.planetThemeText}>{p.theme}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>12 EV YERLEŞİMLERİ</Text>
                  <View style={styles.housesList}>
                    {detailedChart.houses.map((h) => (
                      <View key={h.house} style={styles.houseCard}>
                        <View style={styles.houseHeaderRow}>
                          <Text style={styles.houseTitle}>{h.title}</Text>
                          <Text style={styles.houseSignBadge}>{h.signName}</Text>
                        </View>
                        <Text style={styles.houseAreaText}>{h.area}</Text>
                        {h.planets.length > 0 ? (
                          <View style={styles.housePlanetsRow}>
                            <Text style={styles.housePlanetsLabel}>Bulunan Gezegenler:</Text>
                            {h.planets.map((k) => {
                              const pl = detailedChart.planets.find((p) => p.key === k);
                              return (
                                <View key={k} style={styles.housePlanetPill}>
                                  <Text style={styles.housePlanetPillText}>
                                    {pl?.symbol} {pl?.name}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.houseEmptyText}>Bu evde doğrudan gezegen bulunmuyor.</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* SEKME 3: GEZEGEN AÇILARI */}
              {activeTab === 'aspects' && (
                <View style={styles.tabContentWrap}>
                  <Text style={styles.sectionTitle}>ÖNEMLİ ASTROLOJİK AÇILAR</Text>
                  <View style={styles.aspectsList}>
                    {detailedChart.aspects.map((asp, idx) => (
                      <View key={idx} style={styles.aspectCard}>
                        <CornerTicks />
                        <View style={styles.aspectTopRow}>
                          <Text style={styles.aspectSymbolText}>{asp.symbol}</Text>
                          <Text style={styles.aspectNamesText}>
                            {asp.body1Name} {asp.aspectName} {asp.body2Name}
                          </Text>
                          <View
                            style={[
                              styles.aspectTypePill,
                              {
                                backgroundColor:
                                  asp.type === 'harmonious'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : asp.type === 'challenging'
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(245, 158, 11, 0.15)',
                              },
                            ]}
                          >
                            <Text style={[styles.aspectTypePillText, { color: asp.color }]}>
                              {asp.type === 'harmonious' ? 'Uyumlu' : asp.type === 'challenging' ? 'Zorlayıcı' : 'Nötr'} (
                              {asp.orb}°)
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.aspectInterpretation}>{asp.interpretation}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* SEKME 4: DETAYLI ANALİZ RAPORU */}
              {activeTab === 'report' && (
                <View style={styles.tabContentWrap}>
                  <Text style={styles.sectionTitle}>KAPSAMLI PROFESYONEL ASTROLOJİ RAPORU</Text>
                  <View style={styles.reportList}>
                    {parsedReportSections?.map((sec, idx) => (
                      <View key={idx} style={styles.reportCard}>
                        <CornerTicks />
                        <View style={styles.reportCardHeader}>
                          <MaterialCommunityIcons name="star-crescent" size={15} color={GOLD} />
                          <Text style={styles.reportCardTitle}>{sec.title}</Text>
                        </View>
                        <Text style={styles.reportCardBody}>{sec.body}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 5 DERİN ASTROLOJİK ANALİZ (KULLANICININ İSTEDİĞİ 4 SEKMELİK BÖLÜMÜN ALTINDAKİ 5 ÖZEL KART) */}
              <View style={styles.advancedSectionContainer}>
                <Text style={styles.advancedSectionHeader}>
                  5 DERİN ASTROLOJİK HESAPLAMA VE KADER REHBERİ
                </Text>

                {/* 1. KART: AŞK & RUH EŞİ UYUMU */}
                <View style={styles.advCard}>
                  <CornerTicks />
                  <View style={styles.advCardHeader}>
                    <MaterialCommunityIcons name="heart-multiple" size={20} color="#F472B6" />
                    <Text style={styles.advCardTitle}>1. Aşk, Evlilik & Ruh Eşi Uyumu</Text>
                  </View>
                  <Text style={styles.advCardSubtitle}>{detailedChart.advanced.love.dscMeaning}</Text>

                  {/* 3 Ruh Eşi Adayı */}
                  <View style={styles.soulmatesList}>
                    {detailedChart.advanced.love.soulmateSigns.map((s, idx) => (
                      <View key={idx} style={styles.soulmateItem}>
                        <View style={styles.soulmateTop}>
                          <View style={styles.soulmateNameBadge}>
                            <MaterialCommunityIcons name="star-face" size={14} color={GOLD} />
                            <Text style={styles.soulmateSignName}>{s.signName}</Text>
                          </View>
                          <View style={styles.soulmateScoreBadge}>
                            <Text style={styles.soulmateScoreText}>%{s.score} Uyum</Text>
                          </View>
                        </View>
                        <Text style={styles.soulmateBadgeLabel}>{s.badge}</Text>
                        <Text style={styles.soulmateReasonText}>{s.reason}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Tutku ve Karmik Sınav Burcu */}
                  <View style={styles.loveExtraRow}>
                    <View style={styles.loveExtraCol}>
                      <Text style={styles.loveExtraHeading}>🔥 Tutku & Çekim Burcun</Text>
                      <Text style={styles.loveExtraValue}>
                        {detailedChart.advanced.love.passionSign.signName} (%
                        {detailedChart.advanced.love.passionSign.score})
                      </Text>
                      <Text style={styles.loveExtraDesc}>{detailedChart.advanced.love.passionSign.reason}</Text>
                    </View>
                    <View style={styles.loveExtraCol}>
                      <Text style={styles.loveExtraHeading}>⚡ Karmik Sınav Burcun</Text>
                      <Text style={styles.loveExtraValue}>
                        {detailedChart.advanced.love.challengingSign.signName}
                      </Text>
                      <Text style={styles.loveExtraDesc}>{detailedChart.advanced.love.challengingSign.reason}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. KART: HARİTA YÖNETİCİSİ & BASKIN GEZEGEN */}
                <View style={styles.advCard}>
                  <CornerTicks />
                  <View style={styles.advCardHeader}>
                    <MaterialCommunityIcons name="crown" size={20} color={GOLD} />
                    <Text style={styles.advCardTitle}>2. Harita Yöneticin & Baskın Gezegenin</Text>
                  </View>
                  <View style={styles.rulerRow}>
                    <View style={styles.rulerPill}>
                      <Text style={styles.rulerSymbolBig}>{detailedChart.advanced.chartRuler.rulerSymbol}</Text>
                      <View>
                        <Text style={styles.rulerHeading}>HARİTA YÖNETİCİN</Text>
                        <Text style={styles.rulerNameText}>{detailedChart.advanced.chartRuler.rulerName}</Text>
                      </View>
                    </View>
                    <View style={styles.rulerPill}>
                      <Text style={styles.rulerSymbolBig}>{detailedChart.advanced.dominantPlanet.symbol}</Text>
                      <View>
                        <Text style={styles.rulerHeading}>BASKIN GEZEGENİN</Text>
                        <Text style={styles.rulerNameText}>{detailedChart.advanced.dominantPlanet.name}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.advNormalText}>{detailedChart.advanced.chartRuler.message}</Text>
                  <Text style={[styles.advNormalText, { marginTop: 6 }]}>
                    {detailedChart.advanced.dominantPlanet.trait}
                  </Text>
                </View>

                {/* 3. KART: ŞANS NOKTASI (PARS FORTUNAE) */}
                <View style={styles.advCard}>
                  <CornerTicks />
                  <View style={styles.advCardHeader}>
                    <MaterialCommunityIcons name="clover" size={20} color="#10B981" />
                    <Text style={styles.advCardTitle}>3. Şans Noktan (Pars Fortunae)</Text>
                  </View>
                  <View style={styles.fortuneBadgeRow}>
                    <MaterialCommunityIcons name="star-crescent" size={16} color={GOLD} />
                    <Text style={styles.fortuneBadgeText}>
                      {detailedChart.advanced.fortunePoint.formatted} ({detailedChart.advanced.fortunePoint.house}. Ev)
                    </Text>
                  </View>
                  <Text style={styles.advNormalText}>{detailedChart.advanced.fortunePoint.meaning}</Text>
                </View>

                {/* 4. KART: RUHUN YAŞAM AMACI (AY DÜĞÜMLERİ) */}
                <View style={styles.advCard}>
                  <CornerTicks />
                  <View style={styles.advCardHeader}>
                    <MaterialCommunityIcons name="compass-rose" size={20} color="#38BDF8" />
                    <Text style={styles.advCardTitle}>4. Ruhun Yaşam Amacı (Ay Düğümleri)</Text>
                  </View>
                  <View style={styles.nodeItem}>
                    <Text style={styles.nodeTagNorth}>KUZEY AY DÜĞÜMÜ (KAD) · KADER ROTAN</Text>
                    <Text style={styles.nodeDesc}>{detailedChart.advanced.lunarNodes.northNode.lifePurpose}</Text>
                  </View>
                  <View style={[styles.nodeItem, { marginTop: 8 }]}>
                    <Text style={styles.nodeTagSouth}>GÜNEY AY DÜĞÜMÜ (GAD) · KONFOR ALANIN</Text>
                    <Text style={styles.nodeDesc}>{detailedChart.advanced.lunarNodes.southNode.comfortZone}</Text>
                  </View>
                </View>

                {/* 5. KART: KARİYER VE ZİRVE POTANSİYELİ (MC) */}
                <View style={styles.advCard}>
                  <CornerTicks />
                  <View style={styles.advCardHeader}>
                    <MaterialCommunityIcons name="briefcase-outline" size={20} color="#A855F7" />
                    <Text style={styles.advCardTitle}>
                      5. Kariyer ve Zirve Potansiyelin (MC: {detailedChart.advanced.career.mcSignName})
                    </Text>
                  </View>
                  <Text style={styles.careerLeadership}>{detailedChart.advanced.career.leadershipStyle}</Text>
                  <Text style={styles.careerFieldHeader}>En Başarılı Olacağın Sektörler:</Text>
                  <View style={styles.careerFieldsPillsRow}>
                    {detailedChart.advanced.career.careerFields.map((field, i) => (
                      <View key={i} style={styles.careerPill}>
                        <Text style={styles.careerPillText}>{field}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.careerAdviceText}>
                    💡 <Text style={{ fontWeight: '700', color: GOLD }}>Kariyer Tavsiyesi:</Text>{' '}
                    {detailedChart.advanced.career.successAdvice}
                  </Text>
                </View>
              </View>

              {/* AKSİYONLAR */}
              <View style={styles.actionsRow}>
                <ShareButton
                  text={`Mistik Rehber - Detaylı Doğum Haritam\nGüneş: ${ZODIAC_INFO[detailedChart.sunSign].name} · Ay: ${ZODIAC_INFO[detailedChart.moonSign].name} · Yükselen: ${ZODIAC_INFO[detailedChart.risingSign].name}\nŞans Noktası: ${detailedChart.advanced.fortunePoint.formatted}\nRuh Eşi Uyumu: ${detailedChart.advanced.love.soulmateSigns[0].signName} (%${detailedChart.advanced.love.soulmateSigns[0].score})\n\n${result}`}
                />
                <Pressable onPress={reset} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
                  <Ionicons name="refresh" size={18} color={GOLD} />
                  <Text style={styles.resetButtonText}>Yeni Hesaplama</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* BASİT (GENEL) SONUÇ EKRANI */}
          {basicChart && result && (
            <View style={styles.resultWrap}>
              <View style={styles.wheelWrap}>
                <NatalChartWheel
                  sunLongitude={basicChart.sunLongitude}
                  moonLongitude={basicChart.moonLongitude}
                  risingLongitude={basicChart.risingLongitude}
                />
              </View>

              <View style={styles.signRow}>
                <View style={styles.signCard}>
                  <MaterialCommunityIcons
                    name={ZODIAC_INFO[basicChart.sunSign].icon as any}
                    size={26}
                    color={GOLD}
                  />
                  <Text style={styles.signCardLabel}>Güneş</Text>
                  <Text style={styles.signCardValue}>{ZODIAC_INFO[basicChart.sunSign].name}</Text>
                </View>
                <View style={styles.signCard}>
                  <MaterialCommunityIcons
                    name={ZODIAC_INFO[basicChart.moonSign].icon as any}
                    size={26}
                    color={GOLD}
                  />
                  <Text style={styles.signCardLabel}>Ay</Text>
                  <Text style={styles.signCardValue}>{ZODIAC_INFO[basicChart.moonSign].name}</Text>
                </View>
                <View style={styles.signCard}>
                  <MaterialCommunityIcons
                    name={ZODIAC_INFO[basicChart.risingSign].icon as any}
                    size={26}
                    color={GOLD}
                  />
                  <Text style={styles.signCardLabel}>Yükselen</Text>
                  <Text style={styles.signCardValue}>{ZODIAC_INFO[basicChart.risingSign].name}</Text>
                </View>
              </View>

              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{result}</Text>
              </View>

              {/* DETAYLI ANALİZE YÜKSELTME KARTI */}
              <Pressable
                onPress={() => calculate('detailed')}
                style={({ pressed }) => [styles.upgradeBanner, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={['rgba(242, 200, 121, 0.2)', 'rgba(168, 85, 247, 0.25)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <CornerTicks />
                <View style={styles.upgradeHeader}>
                  <MaterialCommunityIcons name="star-shooting" size={20} color={GOLD} />
                  <Text style={styles.upgradeTitle}>En Detaylı Analize Yükselt (25 Coin)</Text>
                </View>
                <Text style={styles.upgradeText}>
                  NASA standartlarında 10 gezegen derecesi, 12 ev, Aşk & Ruh Eşi uyumu, Şans Noktası ve 3 dakikalık
                  derin astroloji analizi için hemen yükseltin.
                </Text>
              </Pressable>

              <View style={styles.actionsRow}>
                <ShareButton
                  text={`Mistik Rehber - Doğum Haritam\nGüneş: ${ZODIAC_INFO[basicChart.sunSign].name} · Ay: ${ZODIAC_INFO[basicChart.moonSign].name} · Yükselen: ${ZODIAC_INFO[basicChart.risingSign].name}\n\n${result}`}
                />
                <Pressable onPress={reset} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
                  <Ionicons name="refresh" size={18} color={GOLD} />
                  <Text style={styles.resetButtonText}>Yeni Hesaplama</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 48,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
  },
  formWrap: {
    alignItems: 'center',
    gap: 8,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  instruction: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  formErrorText: {
    color: '#E08A8A',
    fontSize: 12.5,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 14,
    marginTop: 18,
  },
  detailedCardBtn: {
    position: 'relative',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.45)',
    padding: 18,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  detailedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nasaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GOLD,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  nasaBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1A0D33',
    letterSpacing: 0.3,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(26, 16, 52, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  priceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  detailedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  detailedDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 14,
  },
  detailedCtaButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedCtaText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1A0D33',
    letterSpacing: 0.3,
  },
  basicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: 'rgba(26, 16, 52, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    borderRadius: 14,
    paddingVertical: 13,
  },
  basicButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
  },
  basicHint: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: -4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  deepLoadingCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.45)',
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  deepLoadingMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 2,
  },
  deepLoadingSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11, 10, 31, 0.85)',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  countdownNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 2,
  },
  deepProgressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  deepProgressBarFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 11,
    color: GOLD_SOFT,
    fontWeight: '700',
    marginBottom: 16,
  },
  activeStageCard: {
    width: '100%',
    backgroundColor: 'rgba(11, 10, 31, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stageStepText: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  stageTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stageDescText: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_MUTED,
  },
  deepLoadingNotice: {
    fontSize: 11.5,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 48,
    gap: 16,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14.5,
    color: GOLD,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  retryButtonText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
  },
  detailedResultWrap: {
    width: '100%',
  },
  resultHeaderCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  resultHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
  },
  resultHeaderSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: GOLD,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#1A0D33',
    fontWeight: '800',
  },
  tabContentWrap: {
    gap: 16,
    marginBottom: 20,
  },
  wheelCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  signRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 4,
  },
  signCardLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  signCardValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  statsCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.3)',
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: GOLD,
  },
  barsList: {
    gap: 10,
  },
  barItem: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barName: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  barPercent: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  planetsList: {
    gap: 10,
  },
  planetCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.28)',
    padding: 14,
  },
  planetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planetSymbolCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetSymbolText: {
    fontSize: 20,
    color: GOLD,
    fontWeight: 'bold',
  },
  planetNameWrap: {
    flex: 1,
  },
  planetNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planetSignText: {
    fontSize: 12.5,
    color: GOLD,
    marginTop: 1,
  },
  planetHouseBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  planetHouseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D8B4FE',
  },
  retroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 6,
  },
  retroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
  },
  planetThemeText: {
    fontSize: 12,
    lineHeight: 18,
    color: TEXT_MUTED,
    marginTop: 6,
  },
  housesList: {
    gap: 10,
  },
  houseCard: {
    backgroundColor: 'rgba(26, 16, 52, 0.82)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.22)',
    padding: 12,
  },
  houseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  houseTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: GOLD,
  },
  houseSignBadge: {
    fontSize: 11.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  houseAreaText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    lineHeight: 17,
  },
  housePlanetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  housePlanetsLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  housePlanetPill: {
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  housePlanetPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
  },
  houseEmptyText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  aspectsList: {
    gap: 10,
  },
  aspectCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    padding: 14,
  },
  aspectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aspectSymbolText: {
    fontSize: 16,
    color: GOLD,
    fontWeight: 'bold',
  },
  aspectNamesText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  aspectTypePill: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  aspectTypePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  aspectInterpretation: {
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_MUTED,
  },
  reportList: {
    gap: 14,
  },
  reportCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 16,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reportCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.3,
  },
  reportCardBody: {
    fontSize: 15,
    lineHeight: 24,
    color: TEXT_PRIMARY,
  },
  advancedSectionContainer: {
    marginTop: 20,
    gap: 16,
    marginBottom: 16,
  },
  advancedSectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  advCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 20,
    borderWidth: 1.3,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 16,
  },
  advCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  advCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: GOLD,
  },
  advCardSubtitle: {
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: 12,
  },
  soulmatesList: {
    gap: 8,
    marginBottom: 14,
  },
  soulmateItem: {
    backgroundColor: 'rgba(11, 10, 31, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.2)',
    padding: 10,
    gap: 4,
  },
  soulmateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soulmateNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soulmateSignName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  soulmateScoreBadge: {
    backgroundColor: 'rgba(244, 114, 182, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.45)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  soulmateScoreText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F472B6',
  },
  soulmateBadgeLabel: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '700',
  },
  soulmateReasonText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_MUTED,
  },
  loveExtraRow: {
    flexDirection: 'row',
    gap: 8,
  },
  loveExtraCol: {
    flex: 1,
    backgroundColor: 'rgba(11, 10, 31, 0.65)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.15)',
    gap: 2,
  },
  loveExtraHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  loveExtraValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 2,
  },
  loveExtraDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_MUTED,
  },
  rulerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  rulerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(11, 10, 31, 0.7)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
  },
  rulerSymbolBig: {
    fontSize: 26,
    fontWeight: 'bold',
    color: GOLD,
  },
  rulerHeading: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rulerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  advNormalText: {
    fontSize: 14.5,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  fortuneBadgeRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  fortuneBadgeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#10B981',
  },
  nodeItem: {
    backgroundColor: 'rgba(11, 10, 31, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.15)',
    padding: 10,
    gap: 4,
  },
  nodeTagNorth: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  nodeTagSouth: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  nodeDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_PRIMARY,
  },
  careerLeadership: {
    fontSize: 14.5,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  careerFieldHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 6,
  },
  careerFieldsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  careerPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  careerPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D8B4FE',
  },
  careerAdviceText: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_MUTED,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 12,
    flex: 1.4,
    backgroundColor: 'rgba(242, 200, 121, 0.08)',
  },
  resetButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: GOLD,
  },
  resultWrap: {
    width: '100%',
  },
  wheelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultBox: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 16,
    marginVertical: 18,
  },
  resultText: {
    fontSize: 15.5,
    lineHeight: 25,
    color: TEXT_PRIMARY,
  },
  upgradeBanner: {
    position: 'relative',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(242, 200, 121, 0.4)',
    padding: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  upgradeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: GOLD,
  },
  upgradeText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_PRIMARY,
  },
});
