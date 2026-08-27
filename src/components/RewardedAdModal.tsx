import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CornerTicks from '@/components/CornerTicks';
import { getCoins, spendCoins } from '@/services/coins';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

const AD_DURATION_SEC = 25; // 25 saniyelik geçilemez video reklam
const SKIP_AD_COIN_COST = 3; // Reklamı hemen geçme bedeli (küçük maliyet)

type Props = {
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
  readingTitle: string;
  videoIndex: number;
  totalVideosNeeded: number;
};

export default function RewardedAdModal({
  visible,
  onComplete,
  onCancel,
  readingTitle,
  videoIndex,
  totalVideosNeeded,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SEC);
  const [finished, setFinished] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [coinError, setCoinError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(AD_DURATION_SEC);
      setFinished(false);
      setCoinError(null);
      return;
    }

    getCoins().then(setUserCoins);
    setSecondsLeft(AD_DURATION_SEC);
    setFinished(false);
    setCoinError(null);

    // Pulse animasyonu
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    let rem = AD_DURATION_SEC;
    timerRef.current = setInterval(() => {
      rem -= 1;
      setSecondsLeft(Math.max(0, rem));
      if (rem <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setFinished(true);
      }
    }, 1000);

    return () => {
      loop.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, pulse]);

  const handleSkipWithCoins = async () => {
    const success = await spendCoins(SKIP_AD_COIN_COST);
    if (success) {
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete();
    } else {
      const current = await getCoins();
      setCoinError(`Yetersiz Coin (Bakiyen: ${current})`);
      setTimeout(() => setCoinError(null), 3000);
    }
  };

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });

  const progressPercent = Math.min(
    100,
    Math.round(((AD_DURATION_SEC - secondsLeft) / AD_DURATION_SEC) * 100),
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(26, 16, 52, 0.98)', 'rgba(11, 10, 31, 0.98)']}
            style={StyleSheet.absoluteFillObject}
          />
          <CornerTicks />

          {/* Üst Kısım: Başlık ve Kapatma */}
          <View style={styles.headerRow}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>SPONSORLU VİDEO</Text>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {totalVideosNeeded > 1
                  ? `Video ${videoIndex} / ${totalVideosNeeded}`
                  : '1 / 1'}
              </Text>
            </View>
          </View>

          {/* Orta Kısım: Video Reklam İçerik Simülasyonu */}
          <View style={styles.videoSimWrap}>
            <Animated.View style={{ transform: [{ scale: pulseScale }], alignItems: 'center' }}>
              <MaterialCommunityIcons name="star-crescent" size={56} color={GOLD} />
            </Animated.View>
            <Text style={styles.videoTitle}>Kozmik Enerji Yükleniyor</Text>
            <Text style={styles.videoSubtitle}>
              {readingTitle} için özel ek hak kilidi açılıyor...
            </Text>

            {/* Dijital Sayaç */}
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={16} color={GOLD} />
              <Text style={styles.timerText}>{secondsLeft}s</Text>
            </View>

            {/* İlerleme Çubuğu */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {/* Alt Kısım: Durum ve Butonlar */}
          {finished ? (
            <Pressable
              onPress={onComplete}
              style={({ pressed }) => [styles.claimButton, pressed && styles.claimButtonPressed]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#1A0D33" />
              <Text style={styles.claimButtonText}>
                {totalVideosNeeded > 1 && videoIndex < totalVideosNeeded
                  ? `Sıradaki Videoya Geç (${videoIndex + 1}/${totalVideosNeeded})`
                  : 'Falı Başlat!'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.actionBlock}>
              {/* Reklamı Geç (3 Coin) Butonu */}
              <Pressable
                onPress={handleSkipWithCoins}
                style={({ pressed }) => [styles.skipAdButton, pressed && styles.skipAdButtonPressed]}
              >
                <Ionicons name="flash" size={16} color="#1A0D33" />
                <Text style={styles.skipAdButtonText}>
                  Reklamı Geç ({SKIP_AD_COIN_COST} Coin)
                </Text>
              </Pressable>

              {coinError && <Text style={styles.coinErrorText}>{coinError}</Text>}

              <View style={styles.waitingNotice}>
                <Text style={styles.waitingNoticeText}>
                  Veya videonun tamamlanmasını bekleyin.
                </Text>
                <Pressable onPress={onCancel} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Vazgeç ve Kapat</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(242, 200, 121, 0.45)',
    padding: 24,
    gap: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adBadge: {
    backgroundColor: 'rgba(242, 200, 121, 0.15)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.3)',
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.5,
  },
  stepBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  videoSimWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 10, 31, 0.8)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(242, 200, 121, 0.25)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  videoSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 16, 52, 0.9)',
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '800',
    color: GOLD,
  },
  progressBarTrack: {
    width: '90%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  claimButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0D33',
  },
  actionBlock: {
    gap: 10,
    width: '100%',
  },
  skipAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  skipAdButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  skipAdButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0D33',
  },
  coinErrorText: {
    fontSize: 11.5,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
  },
  waitingNotice: {
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  waitingNoticeText: {
    fontSize: 11,
    color: GOLD_SOFT,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    color: TEXT_MUTED,
    textDecorationLine: 'underline',
  },
});
