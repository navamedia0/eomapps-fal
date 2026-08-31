import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import {
  getVideoRewardStatus,
  recordVideoWatched,
  VIDEO_REWARD_SCHEDULE,
  type VideoRewardStatus,
} from '@/services/videoRewards';
import {
  getCheckinStatus,
  claimDailyCheckin,
  WEEKLY_LOGIN_SCHEDULE,
  type CheckinStatus,
} from '@/services/streak';
import RewardedAdModal from '@/components/RewardedAdModal';
import CornerTicks from '@/components/CornerTicks';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

export default function TasksScreen() {
  // Yoklama State'leri
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Video Ödülleri State'leri
  const [videoStatus, setVideoStatus] = useState<VideoRewardStatus | null>(null);
  const [watching, setWatching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    const [cStatus, vStatus] = await Promise.all([
      getCheckinStatus(),
      getVideoRewardStatus(),
    ]);
    setCheckinStatus(cStatus);
    setVideoStatus(vStatus);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Yoklama yapma işlemi
  const handleCheckin = async () => {
    if (checkinLoading || checkinStatus?.isClaimedToday) return;
    setCheckinLoading(true);
    const result = await claimDailyCheckin();
    if (result.success) {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      setFeedback(`Yoklama yapıldı! +${result.coinsAwarded} coin kazandın! 🎉`);
      feedbackTimeout.current = setTimeout(() => setFeedback(null), 3000);
      await loadData();
    }
    setCheckinLoading(false);
  };

  // Video izleme başlatma
  const startWatch = useCallback(() => {
    if (!videoStatus || videoStatus.isAllCompleted) return;
    setWatching(true);
  }, [videoStatus]);

  // Video tamamlandığında
  const finishWatch = useCallback(async () => {
    setWatching(false);
    const result = await recordVideoWatched();
    setVideoStatus(result.newStatus);

    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    if (result.isSlotCompleted) {
      setFeedback(`Tebrikler! +${result.coinsAwarded} coin cüzdanına eklendi! ✨`);
    } else {
      setFeedback(
        `Video kaydedildi (${result.newStatus.currentSubVideo - 1}/${result.newStatus.totalSubVideosNeeded}). Ödül için ${result.newStatus.totalSubVideosNeeded - result.newStatus.currentSubVideo + 1} video kaldı! 🎬`,
      );
    }
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 3500);
  }, []);

  const totalSlots = VIDEO_REWARD_SCHEDULE.length;

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="ribbon-outline" size={32} color={GOLD} />
          <Text style={styles.headerTitle}>Ücretsiz Coin Kazan</Text>
          <Text style={styles.headerSubtitle}>Günlük yoklamanı yap, video izle, coin biriktir</Text>
        </View>

        {feedback && (
          <View style={styles.toastCard}>
            <Ionicons name="sparkles" size={16} color={GOLD} />
            <Text style={styles.toastText}>{feedback}</Text>
          </View>
        )}

        {/* 1. BÖLÜM: HAFTALIK GİRİŞ YOKLAMASI */}
        <View style={styles.card}>
          <CornerTicks />
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={22} color={GOLD} />
            <Text style={styles.cardTitle}>Haftalık Giriş Yoklaması</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Her gün buraya gelip yoklamanı yap, coinini topla. 7. gün büyük ödül!
          </Text>

          <View style={styles.weeklySlotGrid}>
            {WEEKLY_LOGIN_SCHEDULE.map((coins, index) => {
              const dayNumber = index + 1;
              const currentDay = checkinStatus?.dayInWeek || 1;
              const isClaimedToday = checkinStatus?.isClaimedToday || false;

              // Geçmiş günler veya bugün alındıysa
              const isPast = isClaimedToday ? dayNumber <= currentDay : dayNumber < currentDay;
              const isToday = dayNumber === currentDay;

              return (
                <View
                  key={index}
                  style={[
                    styles.weeklySlot,
                    isPast && styles.slotClaimed,
                    isToday && !isClaimedToday && styles.slotNext,
                    !isPast && !isToday && styles.slotLocked,
                  ]}
                >
                  {isPast ? (
                    <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                  ) : (
                    <Text style={[styles.slotDay, isToday && !isClaimedToday && styles.slotCreditNext]}>
                      {dayNumber}. gün
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.slotCredit,
                      isToday && !isClaimedToday && styles.slotCreditNext,
                      !isPast && !isToday && styles.slotCreditLocked,
                    ]}
                  >
                    +{coins}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Yoklama Butonu */}
          {checkinStatus && !checkinStatus.isClaimedToday ? (
            <Pressable
              onPress={handleCheckin}
              disabled={checkinLoading}
              style={({ pressed }) => [styles.checkinButton, pressed && styles.buttonPressed]}
            >
              <Ionicons name="calendar-sharp" size={18} color={NIGHT_CARD} />
              <Text style={styles.checkinButtonText}>
                {checkinLoading
                  ? 'Yoklama Yapılıyor...'
                  : `Bugünkü Yoklamayı Yap (+${checkinStatus.todayRewardCoins} Coin)`}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.checkinDoneBox}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#34D399" />
              <Text style={styles.checkinDoneText}>
                Bugün {checkinStatus?.dayInWeek}. gün yoklamanı yaptın. Yarın tekrar gel!
              </Text>
            </View>
          )}
        </View>

        {/* 2. BÖLÜM: VİDEO İZLEYEREK COIN KAZAN */}
        <View style={styles.card}>
          <CornerTicks />
          <View style={styles.cardHeader}>
            <Ionicons name="play-circle-outline" size={22} color={GOLD} />
            <Text style={styles.cardTitle}>Video İzleyerek Coin Kazan</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {videoStatus?.isAllCompleted
              ? 'Bugünkü tüm videoları tamamladın, yarın tekrar gel! 🎉'
              : `${videoStatus?.claimedSlots || 0}/${totalSlots} video izlendi. Her video biraz daha fazla coin getiriyor.`}
          </Text>

          <View style={styles.slotGrid}>
            {VIDEO_REWARD_SCHEDULE.map((coins, index) => {
              const claimedSlots = videoStatus?.claimedSlots || 0;
              const isClaimed = index < claimedSlots;
              const isNext = index === claimedSlots;
              const isLocked = index > claimedSlots;

              return (
                <Pressable
                  key={index}
                  onPress={isNext ? startWatch : undefined}
                  disabled={!isNext}
                  style={[
                    styles.slot,
                    isClaimed && styles.slotClaimed,
                    isNext && styles.slotNext,
                    isLocked && styles.slotLocked,
                  ]}
                >
                  {isClaimed ? (
                    <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                  ) : (
                    <Ionicons name="play" size={16} color={isNext ? NIGHT_CARD : TEXT_MUTED} />
                  )}
                  <Text style={[styles.slotCredit, isNext && styles.slotCreditNext, isLocked && styles.slotCreditLocked]}>
                    +{coins}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Video İzleme Aksiyon Butonu */}
          {videoStatus && !videoStatus.isAllCompleted && (
            <Pressable
              onPress={startWatch}
              style={({ pressed }) => [styles.watchButton, pressed && styles.buttonPressed]}
            >
              <Ionicons name="videocam" size={18} color={NIGHT_CARD} />
              <Text style={styles.watchButtonText}>
                {videoStatus.totalSubVideosNeeded > 1
                  ? `Video İzle (${videoStatus.currentSubVideo}/${videoStatus.totalSubVideosNeeded}), +${videoStatus.currentSlotCoins} Coin`
                  : `Video İzle, +${videoStatus.currentSlotCoins} Coin Kazan`}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* 25 Saniyelik Ödüllü Video Modalı (Reklamı Geç 3 Coin dahil) */}
      <RewardedAdModal
        visible={watching}
        readingTitle={`+${videoStatus?.currentSlotCoins || 5} Coin Ödülü`}
        videoIndex={videoStatus?.currentSubVideo || 1}
        totalVideosNeeded={videoStatus?.totalSubVideosNeeded || 1}
        onComplete={finishWatch}
        onCancel={() => setWatching(false)}
      />
    </MysticTableBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GOLD,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 4,
    textAlign: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 201, 60, 0.16)',
    borderColor: GOLD,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toastText: {
    fontSize: 12.5,
    color: GOLD,
    fontWeight: '700',
    flex: 1,
  },
  card: {
    position: 'relative',
    backgroundColor: 'rgba(30, 30, 32, 0.92)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 201, 60, 0.35)',
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 17,
  },
  weeklySlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  weeklySlot: {
    width: '22.8%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 7, 8, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: 4,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  slot: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 7, 8, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: 4,
  },
  slotClaimed: {
    backgroundColor: 'rgba(255, 201, 60, 0.12)',
    borderColor: 'rgba(255, 201, 60, 0.4)',
  },
  slotNext: {
    backgroundColor: GOLD,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  slotLocked: {
    opacity: 0.5,
  },
  slotDay: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  slotCredit: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
  },
  slotCreditNext: {
    color: NIGHT_CARD,
    fontWeight: '900',
  },
  slotCreditLocked: {
    color: TEXT_MUTED,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  checkinButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: NIGHT_CARD,
  },
  checkinDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  checkinDoneText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
    flex: 1,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  watchButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: NIGHT_CARD,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
