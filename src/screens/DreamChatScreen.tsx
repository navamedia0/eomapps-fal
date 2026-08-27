import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { ChatTurn } from '@/services/gemini';
import { interpretDreamChat } from '@/services/readings-ai';
import { getCoins, spendCoins } from '@/services/coins';
import {
  getDreamModeStatus,
  unlockDreamLimitedVideo,
  markDeepDreamPurchased,
  recordDreamMessageSent,
  DEEP_DREAM_COIN_COST,
  DREAM_MESSAGE_COIN_COST,
  DREAM_MAX_LIMITED_CHARS,
  DREAM_MAX_DEEP_CHARS,
  type DreamMode,
  type DreamChatStatus,
} from '@/services/dreamChatLimits';
import CosmicChatBackground from '@/components/CosmicChatBackground';
import CoinFallbackBox from '@/components/CoinFallbackBox';
import RewardedAdModal from '@/components/RewardedAdModal';
import PersonInfoModal from '@/components/PersonInfoModal';
import CornerTicks from '@/components/CornerTicks';
import type { PersonInfo } from '@/types/personInfo';
import { getSavedPersonInfo, savePersonInfo } from '@/services/personInfo';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DreamChat'>;

const GREETINGS = {
  limited:
    'Merhaba, ben rüya rehberinim. Bana gördüğün rüyayı anlatabilirsin; birlikte ana sembollerin ve mesajların izini süreriz. 🌙',
  deep:
    'Hoş geldin. Derinlemesine Bilinçaltı ve Arketip Odası’ndasın. Lütfen rüyanda gördüğün tüm ayrıntıları, mekanları, renkleri, hissettiğin duyguları ve en küçük detayları bana aktar; birlikte 4 katmanlı bilinçaltı haritanı çıkaralım. 🔮',
};

export default function DreamChatScreen({ navigation }: Props) {
  // Seçim Modu vs Sohbet Modu
  const [selectedMode, setSelectedMode] = useState<DreamMode | null>(null);

  // Sohbet State'leri
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coinFallback, setCoinFallback] = useState<{ coins: number; cost: number } | null>(null);
  const [pendingHistory, setPendingHistory] = useState<ChatTurn[] | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<DreamChatStatus | null>(null);

  // Bekleme Geri Sayımı (İlk derin analiz için 60sn, uzun mesajlar için 30sn)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modallar
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [personInfo, setPersonInfo] = useState<PersonInfo | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSavedPersonInfo().then((saved) => {
      if (saved) setPersonInfo(saved);
    });
  }, []);

  // Nabız animasyonu
  useEffect(() => {
    if (!sending) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sending, pulseAnim]);

  const refreshQuota = useCallback(async (mode: DreamMode) => {
    const st = await getDreamModeStatus(mode);
    setQuotaStatus(st);
    return st;
  }, []);

  const handleSelectMode = async (mode: DreamMode) => {
    setSelectedMode(mode);
    setMessages([{ role: 'model', text: GREETINGS[mode] }]);
    await refreshQuota(mode);
  };

  const handleSavePersonInfo = (info: PersonInfo) => {
    setPersonInfo(info);
    savePersonInfo(info);
  };

  const maxCharLimit = selectedMode === 'deep' ? DREAM_MAX_DEEP_CHARS : DREAM_MAX_LIMITED_CHARS;

  // Analiz Geri Sayım Fonksiyonu
  const startTimerWait = (seconds: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimerSecondsLeft(seconds);
      let rem = seconds;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        rem -= 1;
        setTimerSecondsLeft(Math.max(0, rem));
        if (rem <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setTimerSecondsLeft(null);
          resolve();
        }
      }, 1000);
    });
  };

  const send = useCallback(
    async (overrideHistory?: ChatTurn[], payWithCoins = false, forceUnlocked = false) => {
      if (!selectedMode) return;
      const trimmed = input.trim();
      if (!overrideHistory && !trimmed) return;

      const history = overrideHistory ?? [...messages, { role: 'user', text: trimmed } as ChatTurn];

      if (!overrideHistory) {
        setMessages(history);
        setInput('');
      }

      setError(null);
      setCoinFallback(null);

      const currentQuota = await refreshQuota(selectedMode);

      // Sınırlı Mod Kontrolleri
      if (selectedMode === 'limited' && !payWithCoins && !forceUnlocked) {
        if (currentQuota.status === 'need_video') {
          setPendingHistory(history);
          setAdModalVisible(true);
          return;
        }
        if (currentQuota.status === 'coin_mode') {
          const coins = await getCoins();
          if (coins < DREAM_MESSAGE_COIN_COST) {
            setPendingHistory(history);
            setCoinFallback({ coins, cost: DREAM_MESSAGE_COIN_COST });
            return;
          }
          const spent = await spendCoins(DREAM_MESSAGE_COIN_COST);
          if (!spent) {
            setPendingHistory(history);
            setCoinFallback({ coins, cost: DREAM_MESSAGE_COIN_COST });
            return;
          }
        }
      }

      // Derin Mod Kontrolleri
      if (selectedMode === 'deep' && !payWithCoins && !forceUnlocked) {
        if (currentQuota.status === 'deep_need_initial_coin') {
          const coins = await getCoins();
          if (coins < DEEP_DREAM_COIN_COST) {
            setPendingHistory(history);
            setCoinFallback({ coins, cost: DEEP_DREAM_COIN_COST });
            return;
          }
          const spent = await spendCoins(DEEP_DREAM_COIN_COST);
          if (!spent) {
            setPendingHistory(history);
            setCoinFallback({ coins, cost: DEEP_DREAM_COIN_COST });
            return;
          }
          await markDeepDreamPurchased();
        } else if (currentQuota.status === 'coin_mode') {
          const coins = await getCoins();
          if (coins < DREAM_MESSAGE_COIN_COST) {
            setPendingHistory(history);
            setCoinFallback({ coins, cost: DREAM_MESSAGE_COIN_COST });
            return;
          }
          const spent = await spendCoins(DREAM_MESSAGE_COIN_COST);
          if (!spent) {
            setPendingHistory(history);
            setCoinFallback({ coins, cost: DREAM_MESSAGE_COIN_COST });
            return;
          }
        }
      }

      setSending(true);

      // Bekleme Süresi Kuralı:
      // Derin modda ilk rüya anlatısında 60sn, devam eden 500+ karakterlik uzun mesajlarda 30sn
      const isFirstUserMessage = history.filter((t) => t.role === 'user').length === 1;
      const lastMessageText = history[history.length - 1]?.text || '';

      if (selectedMode === 'deep' && isFirstUserMessage) {
        await Promise.all([
          interpretDreamChat(history, 'deep'),
          startTimerWait(60),
        ])
          .then(([reply]) => {
            recordDreamMessageSent('deep');
            refreshQuota('deep');
            setMessages([...history, { role: 'model', text: reply }]);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Rüya analiz edilirken bir sorun oluştu.');
          });
      } else if (selectedMode === 'deep' && lastMessageText.length >= 500) {
        await Promise.all([
          interpretDreamChat(history, 'deep'),
          startTimerWait(30),
        ])
          .then(([reply]) => {
            recordDreamMessageSent('deep');
            refreshQuota('deep');
            setMessages([...history, { role: 'model', text: reply }]);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : 'Rüya analiz edilirken bir sorun oluştu.');
          });
      } else {
        // Normal akış
        try {
          const reply = await interpretDreamChat(history, selectedMode);
          await recordDreamMessageSent(selectedMode);
          await refreshQuota(selectedMode);
          setMessages([...history, { role: 'model', text: reply }]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Rüya yorumlanırken bir sorun oluştu.');
        }
      }

      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    },
    [input, messages, refreshQuota, selectedMode],
  );

  const handleAdComplete = useCallback(async () => {
    setAdModalVisible(false);
    await unlockDreamLimitedVideo();
    if (selectedMode) await refreshQuota(selectedMode);
    if (pendingHistory) {
      send(pendingHistory, false, true);
    }
  }, [pendingHistory, refreshQuota, selectedMode, send]);

  const hasPersonInfo = Boolean(
    personInfo &&
      (personInfo.name?.trim() ||
        personInfo.age ||
        personInfo.relationshipStatus ||
        personInfo.focusArea ||
        personInfo.occupationStatus),
  );

  // 1. EKRAN: MOD SEÇİM EKRANI
  if (!selectedMode) {
    return (
      <CosmicChatBackground>
        <ScrollView contentContainerStyle={styles.selectionScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.selectionHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="cloud-outline" size={32} color={GOLD} />
            </View>
            <Text style={styles.selectionTitle}>Rüya Tabiri & Bilinçaltı</Text>
            <Text style={styles.selectionSubtitle}>
              Bilinçaltının rüyalarda fısıldadığı kadim sembolleri keşfet.
            </Text>
          </View>

          {/* 1. Buton: Sınırlı Yorum */}
          <Pressable
            onPress={() => handleSelectMode('limited')}
            style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          >
            <CornerTicks />
            <View style={styles.modeCardHeader}>
              <View style={styles.modeIconWrap}>
                <Ionicons name="moon-outline" size={22} color={GOLD} />
              </View>
              <View style={styles.modeTitleWrap}>
                <Text style={styles.modeTitle}>Sınırlı Yorum</Text>
                <Text style={styles.modeBadgeFree}>Günde 2 Mesaj Ücretsiz</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              Rüyanızın ana sembollerini ve hissiyatını özetleyen akıcı, sezgisel ve doğrudan rüya tabiri.
            </Text>
          </Pressable>

          {/* 2. Buton: Derinlemesine Rüya Analizi */}
          <Pressable
            onPress={() => handleSelectMode('deep')}
            style={({ pressed }) => [styles.modeCard, styles.modeCardDeep, pressed && styles.modeCardPressed]}
          >
            <CornerTicks />
            <View style={styles.modeCardHeader}>
              <View style={[styles.modeIconWrap, styles.modeIconWrapDeep]}>
                <MaterialCommunityIcons name="star-crescent" size={24} color={GOLD} />
              </View>
              <View style={styles.modeTitleWrap}>
                <Text style={styles.modeTitle}>Derinlemesine Rüya Analizi</Text>
                <Text style={styles.modeBadgeDeep}>{DEEP_DREAM_COIN_COST} Coin • 10 Mesaj Dahil</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              Freud & Jung arketip analizi, gölge benlik, gizli semboller ve geleceğe dair işaretlerle 4 katmanlı profesyonel bilinçaltı raporu.
            </Text>
          </Pressable>

          {/* 3. Buton: Kişi Bilgisi */}
          <Pressable
            onPress={() => setIsPersonModalVisible(true)}
            style={({ pressed }) => [
              styles.personCard,
              hasPersonInfo && styles.personCardFilled,
              pressed && styles.modeCardPressed,
            ]}
          >
            <View style={[styles.personIconCircle, hasPersonInfo && styles.personIconCircleFilled]}>
              <Ionicons
                name={hasPersonInfo ? 'person' : 'person-add-outline'}
                size={18}
                color={hasPersonInfo ? NIGHT_CARD : GOLD}
              />
            </View>
            <View style={styles.personTextWrap}>
              <Text style={styles.personTitle}>
                {hasPersonInfo ? `Kişi Bilgisi: ${personInfo?.name || 'Kaydedildi'}` : 'Kişi Bilgisi Gir (İsteğe Bağlı)'}
              </Text>
              <Text style={styles.personSubtitle} numberOfLines={1}>
                {hasPersonInfo
                  ? [personInfo?.age ? `${personInfo.age} yaş` : null, personInfo?.relationshipStatus, personInfo?.focusArea]
                      .filter(Boolean)
                      .join(' • ')
                  : 'İsim, yaş, ilişki durumu vb.'}
              </Text>
            </View>
            <Ionicons name={hasPersonInfo ? 'create-outline' : 'chevron-forward'} size={18} color={GOLD} />
          </Pressable>

          <View style={styles.infoHintRow}>
            <MaterialCommunityIcons name="information-outline" size={14} color={GOLD_SOFT} />
            <Text style={styles.infoHintText}>
              Daha isabetli ve sana özel bir rüya analizi için kişi bilgilerini girebilirsin.
            </Text>
          </View>
        </ScrollView>

        <PersonInfoModal
          visible={isPersonModalVisible}
          initialInfo={personInfo}
          onSave={handleSavePersonInfo}
          onClose={() => setIsPersonModalVisible(false)}
        />
      </CosmicChatBackground>
    );
  }

  // 2. EKRAN: SOHBET EKRANI
  return (
    <CosmicChatBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Üst Bar & Mod Değiştirme */}
        <View style={styles.chatTopBar}>
          <Pressable onPress={() => setSelectedMode(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color={GOLD} />
            <Text style={styles.backButtonText}>Modlar</Text>
          </Pressable>

          <View style={styles.modeTag}>
            <MaterialCommunityIcons
              name={selectedMode === 'deep' ? 'star-crescent' : 'moon-waxing-crescent'}
              size={14}
              color={GOLD}
            />
            <Text style={styles.modeTagText}>
              {selectedMode === 'deep' ? 'Derin Analiz Odası' : 'Sınırlı Yorum'}
            </Text>
          </View>
        </View>

        {/* Kota / Bilgi Rozeti */}
        {quotaStatus && (
          <View style={styles.quotaHeader}>
            <CornerTicks />
            <View style={styles.quotaHeaderLeft}>
              <Ionicons
                name={
                  quotaStatus.status === 'free' || quotaStatus.status === 'deep_bundle'
                    ? 'sparkles'
                    : quotaStatus.status === 'need_video'
                    ? 'play-circle-outline'
                    : 'disc'
                }
                size={16}
                color={GOLD}
              />
              <Text style={styles.quotaHeaderText}>
                {selectedMode === 'limited'
                  ? quotaStatus.status === 'free'
                    ? `Bugün 2 ücretsiz mesaj hakkın var (Kalan: ${quotaStatus.freeRemaining})`
                    : quotaStatus.status === 'need_video'
                    ? '3. Mesaj için 1 Kısa Video İzle (veya 3 Coin)'
                    : `Sınırsız Sohbet Modu (${DREAM_MESSAGE_COIN_COST} Coin / mesaj)`
                  : quotaStatus.status === 'deep_need_initial_coin'
                  ? `İlk Rapor: ${DEEP_DREAM_COIN_COST} Coin (10 Mesaj Sohbet Dahil)`
                  : quotaStatus.status === 'deep_bundle'
                  ? `Derin Sohbet Paketi (Kalan Mesaj: ${quotaStatus.freeRemaining}/10)`
                  : `Ekstra Sohbet Modu (${DREAM_MESSAGE_COIN_COST} Coin / mesaj)`}
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => (
            <View
              key={index}
              style={[styles.bubble, message.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}
            >
              <Text style={message.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextModel}>
                {message.text}
              </Text>
            </View>
          ))}

          {/* Canlı Geri Sayım Odası / Analiz Yükleniyor */}
          {sending && (
            <View style={[styles.bubble, styles.bubbleModel, styles.bubbleLoading]}>
              {timerSecondsLeft !== null ? (
                <View style={styles.timerLoadingWrap}>
                  <MaterialCommunityIcons name="star-crescent" size={24} color={GOLD} />
                  <Text style={styles.timerCountText}>{timerSecondsLeft}s</Text>
                  <Text style={styles.timerSubtitleText}>
                    Rüyanızın bilinçaltı katmanları ve kadim sembolleri çözümleniyor...
                  </Text>
                </View>
              ) : (
                <View style={styles.normalLoadingWrap}>
                  <ActivityIndicator size="small" color={GOLD} />
                  <Text style={styles.bubbleTextModel}>Rüya sembolleri yorumlanıyor...</Text>
                </View>
              )}
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#E08A8A" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => send(messages)} style={styles.retryButton}>
                <MaterialCommunityIcons name="refresh" size={16} color={GOLD} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </Pressable>
            </View>
          )}

          {coinFallback && (
            <CoinFallbackBox
              cost={coinFallback.cost}
              coins={coinFallback.coins}
              onContinue={() => pendingHistory && send(pendingHistory, true)}
              onBuyCoins={() => navigation.navigate('CoinShop')}
              onDismiss={() => setCoinFallback(null)}
            />
          )}
        </ScrollView>

        {!coinFallback && (
          <View style={styles.inputContainer}>
            {selectedMode === 'deep' && messages.filter((m) => m.role === 'user').length === 0 && (
              <View style={styles.deepGuidanceBox}>
                <Ionicons name="information-circle-outline" size={14} color={GOLD} />
                <Text style={styles.deepGuidanceText}>
                  Derin analiz için rüyanı tüm ayrıntılarıyla (mekanlar, renkler, hissettiğin duygular) uzunca anlatabilirsin.
                </Text>
              </View>
            )}

            <View style={styles.inputBar}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={
                  selectedMode === 'deep'
                    ? 'Rüyanı tüm ayrıntılarıyla anlat (maks 2000 karakter)...'
                    : 'Rüyanı anlat (maks 500 karakter)...'
                }
                placeholderTextColor={TEXT_MUTED}
                style={styles.input}
                multiline
                maxLength={maxCharLimit}
                editable={!sending}
              />
              <Pressable
                onPress={() => send()}
                disabled={sending || !input.trim()}
                style={({ pressed }) => [
                  styles.sendButton,
                  (pressed || sending || !input.trim()) && styles.sendButtonDisabled,
                ]}
              >
                <Ionicons name="send" size={18} color={NIGHT_CARD} />
              </Pressable>
            </View>
            <View style={styles.charCountRow}>
              <Text style={styles.charCountText}>
                {input.length} / {maxCharLimit} karakter
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <RewardedAdModal
        visible={adModalVisible}
        readingTitle="Rüya Tabiri (3. Mesaj)"
        videoIndex={1}
        totalVideosNeeded={1}
        onComplete={handleAdComplete}
        onCancel={() => setAdModalVisible(false)}
      />
    </CosmicChatBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Seçim Ekranı Stilleri
  selectionScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 16,
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
    marginBottom: 6,
  },
  selectionSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  modeCard: {
    position: 'relative',
    backgroundColor: 'rgba(26, 16, 52, 0.92)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.35)',
    padding: 20,
    gap: 10,
  },
  modeCardDeep: {
    borderColor: GOLD,
    backgroundColor: 'rgba(38, 20, 72, 0.95)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modeCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconWrapDeep: {
    backgroundColor: 'rgba(242, 200, 121, 0.25)',
  },
  modeTitleWrap: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  modeBadgeFree: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34D399',
  },
  modeBadgeDeep: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  modeDescription: {
    fontSize: 12.5,
    color: TEXT_PRIMARY,
    lineHeight: 18,
    opacity: 0.9,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(26, 16, 52, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  personCardFilled: {
    borderColor: GOLD,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
  },
  personIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personIconCircleFilled: {
    backgroundColor: GOLD,
  },
  personTextWrap: {
    flex: 1,
  },
  personTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: GOLD,
    marginBottom: 2,
  },
  personSubtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
  infoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoHintText: {
    fontSize: 11.5,
    color: GOLD_SOFT,
    textAlign: 'center',
  },

  // Sohbet Ekranı Stilleri
  chatTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.15)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '700',
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
  },
  modeTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: GOLD,
  },
  quotaHeader: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.35)',
  },
  quotaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quotaHeaderText: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '700',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(242, 200, 121, 0.16)',
    borderColor: 'rgba(242, 200, 121, 0.55)',
    borderBottomRightRadius: 6,
  },
  bubbleModel: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 17, 64, 0.94)',
    borderColor: GOLD_SOFT,
    borderBottomLeftRadius: 6,
  },
  bubbleLoading: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  timerLoadingWrap: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  timerCountText: {
    fontSize: 22,
    fontWeight: '900',
    color: GOLD,
    letterSpacing: 1,
  },
  timerSubtitleText: {
    fontSize: 12,
    color: GOLD_SOFT,
    textAlign: 'center',
    lineHeight: 17,
  },
  normalLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bubbleTextUser: {
    fontSize: 14,
    lineHeight: 21,
    color: '#F5F0FF',
    fontWeight: '500',
  },
  bubbleTextModel: {
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    backgroundColor: 'rgba(224, 138, 138, 0.1)',
    borderColor: 'rgba(224, 138, 138, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  errorText: {
    color: '#E08A8A',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryButtonText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: GOLD_SOFT,
    backgroundColor: 'rgba(11, 10, 31, 0.98)',
    paddingBottom: 6,
  },
  deepGuidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(242, 200, 121, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 200, 121, 0.2)',
  },
  deepGuidanceText: {
    fontSize: 11,
    color: GOLD,
    flex: 1,
    lineHeight: 15,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: NIGHT_CARD,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  charCountRow: {
    paddingHorizontal: 20,
    paddingTop: 4,
    alignItems: 'flex-end',
  },
  charCountText: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
});
