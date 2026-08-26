import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { getVideoRewardState, claimNextVideoReward, VIDEO_REWARD_SCHEDULE } from '@/services/videoRewards';
import { getCurrentDayInWeek, WEEKLY_LOGIN_SCHEDULE } from '@/services/streak';
import AdWatchModal from '@/components/AdWatchModal';
import MysticTableBackground from '@/components/tarot/MysticTableBackground';
import { GOLD, GOLD_SOFT, NIGHT_CARD, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

export default function TasksScreen() {
  const [claimed, setClaimed] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [watching, setWatching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dayInWeek, setDayInWeek] = useState(1);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getVideoRewardState().then((state) => {
      setClaimed(state.claimed);
      setLoaded(true);
    });
    getCurrentDayInWeek().then(setDayInWeek);
  }, []);

  const startWatch = useCallback(() => {
    if (claimed >= VIDEO_REWARD_SCHEDULE.length) return;
    setWatching(true);
  }, [claimed]);

  const finishWatch = useCallback(async () => {
    setWatching(false);
    const result = await claimNextVideoReward();
    if (result) {
      setClaimed(result.claimed);
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      setFeedback(`+${result.coins} coin kazandın! ✨`);
      feedbackTimeout.current = setTimeout(() => setFeedback(null), 2500);
    }
  }, []);

  const total = VIDEO_REWARD_SCHEDULE.length;
  const allClaimed = loaded && claimed >= total;

  return (
    <MysticTableBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="ribbon-outline" size={30} color={GOLD} />
          <Text style={styles.headerTitle}>Ücretsiz Coin Kazan</Text>
          <Text style={styles.headerSubtitle}>Her gün giriş yap, video izle, coin biriktir</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={22} color={GOLD} />
            <Text style={styles.cardTitle}>Haftalık Giriş Ödülleri</Text>
          </View>
          <Text style={styles.cardSubtitle}>Her gün uygulamayı aç, ödülünü topla. 7. gün büyük ödül!</Text>

          <View style={styles.slotGrid}>
            {WEEKLY_LOGIN_SCHEDULE.map((coins, index) => {
              const dayNumber = index + 1;
              const isPast = dayNumber < dayInWeek;
              const isToday = dayNumber === dayInWeek;
              return (
                <View
                  key={index}
                  style={[styles.slot, isPast && styles.slotClaimed, isToday && styles.slotNext, !isPast && !isToday && styles.slotLocked]}
                >
                  {isPast ? (
                    <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                  ) : (
                    <Text style={[styles.slotDay, isToday && styles.slotCreditNext]}>{dayNumber}. gün</Text>
                  )}
                  <Text style={[styles.slotCredit, isToday && styles.slotCreditNext, !isPast && !isToday && styles.slotCreditLocked]}>
                    +{coins}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.weeklyHint}>Bugün {dayInWeek}. gündesin — açılışta otomatik kazandın.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="play-circle-outline" size={22} color={GOLD} />
            <Text style={styles.cardTitle}>Video İzleyerek Coin Kazan</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {allClaimed
              ? 'Bugünkü tüm videoları izledin, yarın tekrar gel! 🎉'
              : `${claimed}/${total} video izlendi. Her video biraz daha fazla coin getiriyor.`}
          </Text>

          <View style={styles.slotGrid}>
            {VIDEO_REWARD_SCHEDULE.map((coins, index) => {
              const isClaimed = index < claimed;
              const isNext = index === claimed;
              const isLocked = index > claimed;
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

          {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

          {!allClaimed && (
            <Pressable onPress={startWatch} style={({ pressed }) => [styles.watchButton, pressed && styles.watchButtonPressed]}>
              <Ionicons name="videocam-outline" size={18} color={NIGHT_CARD} />
              <Text style={styles.watchButtonText}>Video İzle, +{VIDEO_REWARD_SCHEDULE[claimed]} Coin Kazan</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.comingSoonCard}>
          <Ionicons name="game-controller-outline" size={22} color={TEXT_MUTED} />
          <Text style={styles.comingSoonTitle}>Mini Oyunlar</Text>
          <Text style={styles.comingSoonBadge}>Yakında</Text>
        </View>
      </ScrollView>

      <AdWatchModal visible={watching} onComplete={finishWatch} />
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
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GOLD,
    marginTop: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  card: {
    backgroundColor: NIGHT_CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_MUTED,
    marginBottom: 16,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  slot: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  slotClaimed: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  slotNext: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  slotLocked: {
    opacity: 0.4,
  },
  slotDay: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  slotCredit: {
    fontSize: 10,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  slotCreditNext: {
    color: NIGHT_CARD,
  },
  slotCreditLocked: {
    color: TEXT_MUTED,
  },
  weeklyHint: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  feedbackText: {
    fontSize: 13,
    color: GOLD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  watchButtonPressed: {
    opacity: 0.85,
  },
  watchButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: NIGHT_CARD,
  },
  comingSoonCard: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    padding: 20,
    opacity: 0.6,
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginTop: 4,
  },
  comingSoonBadge: {
    fontSize: 11,
    color: TEXT_MUTED,
  },
});
