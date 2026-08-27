import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCoins } from '@/services/coins';

const STORAGE_KEY = '@mistik-rehber/streak';

type StreakState = {
  lastClaimDate: string; // En son yoklama yapılan tarih
  streak: number; // Güncel seri (gün sayısı)
  longestStreak: number;
};

export type CheckinStatus = {
  streak: number;
  dayInWeek: number;
  isClaimedToday: boolean;
  todayRewardCoins: number;
};

// 7 günlük haftalık yoklama ödül tablosu
export const WEEKLY_LOGIN_SCHEDULE: number[] = [5, 5, 10, 10, 15, 15, 30];

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const today = () => dateKey(new Date());
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
};

async function readState(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { lastClaimDate: '', streak: 0, longestStreak: 0 };
  } catch {
    return { lastClaimDate: '', streak: 0, longestStreak: 0 };
  }
}

async function writeState(state: StreakState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dayInWeekFor(streak: number): number {
  if (streak <= 0) return 1;
  return ((streak - 1) % WEEKLY_LOGIN_SCHEDULE.length) + 1;
}

/**
 * Güncel yoklama durumunu döner (otomatik coin vermez).
 */
export async function getCheckinStatus(): Promise<CheckinStatus> {
  const state = await readState();
  const isClaimedToday = state.lastClaimDate === today();

  let activeStreak = state.streak;
  if (!isClaimedToday && state.lastClaimDate !== yesterday()) {
    // Seri bozulmuş, 1. günden başlar
    activeStreak = 0;
  }

  const nextDayNumber = isClaimedToday
    ? dayInWeekFor(activeStreak)
    : dayInWeekFor(activeStreak + 1);

  const todayRewardCoins = WEEKLY_LOGIN_SCHEDULE[nextDayNumber - 1];

  return {
    streak: isClaimedToday ? activeStreak : activeStreak + 1,
    dayInWeek: nextDayNumber,
    isClaimedToday,
    todayRewardCoins,
  };
}

/**
 * Kullanıcı "Yoklamayı Yap / Ödülü Topla" butonuna bastığında çağrılır.
 */
export async function claimDailyCheckin(): Promise<{ success: boolean; coinsAwarded: number; dayNumber: number }> {
  const state = await readState();
  if (state.lastClaimDate === today()) {
    return { success: false, coinsAwarded: 0, dayNumber: dayInWeekFor(state.streak) };
  }

  const newStreak = state.lastClaimDate === yesterday() ? state.streak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, newStreak);
  const dayNumber = dayInWeekFor(newStreak);
  const coins = WEEKLY_LOGIN_SCHEDULE[dayNumber - 1];

  await writeState({
    lastClaimDate: today(),
    streak: newStreak,
    longestStreak,
  });

  if (coins > 0) {
    await addCoins(coins);
  }

  return { success: true, coinsAwarded: coins, dayNumber };
}

export async function getCurrentStreak(): Promise<number> {
  const state = await readState();
  return state.lastClaimDate === today() || state.lastClaimDate === yesterday() ? state.streak : 0;
}

export async function getCurrentDayInWeek(): Promise<number> {
  const status = await getCheckinStatus();
  return status.dayInWeek;
}
