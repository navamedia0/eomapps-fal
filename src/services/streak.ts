import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCoins } from '@/services/coins';

const STORAGE_KEY = '@mistik-rehber/streak';

type StreakState = { lastOpenDate: string; streak: number; longestStreak: number };

export type DailyOpenResult = { streak: number; isNewDay: boolean; rewardCoins: number; dayInWeek: number };

// 7-day cycling login reward schedule, in coins — resets after day 7 or after
// a missed day (streak breaking starts the cycle over at day 1).
export const WEEKLY_LOGIN_SCHEDULE: number[] = [5, 5, 10, 10, 15, 15, 30];

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const today = () => dateKey(new Date());
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
};

async function readState(): Promise<StreakState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : { lastOpenDate: '', streak: 0, longestStreak: 0 };
}

async function writeState(state: StreakState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dayInWeekFor(streak: number): number {
  return ((streak - 1) % WEEKLY_LOGIN_SCHEDULE.length) + 1;
}

export async function recordDailyOpen(): Promise<DailyOpenResult> {
  const state = await readState();
  if (state.lastOpenDate === today()) {
    return { streak: state.streak, isNewDay: false, rewardCoins: 0, dayInWeek: dayInWeekFor(state.streak || 1) };
  }

  const newStreak = state.lastOpenDate === yesterday() ? state.streak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, newStreak);
  await writeState({ lastOpenDate: today(), streak: newStreak, longestStreak });

  const dayInWeek = dayInWeekFor(newStreak);
  const rewardCoins = WEEKLY_LOGIN_SCHEDULE[dayInWeek - 1];
  if (rewardCoins > 0) await addCoins(rewardCoins);

  return { streak: newStreak, isNewDay: true, rewardCoins, dayInWeek };
}

export async function getCurrentStreak(): Promise<number> {
  const state = await readState();
  return state.lastOpenDate === today() || state.lastOpenDate === yesterday() ? state.streak : 0;
}

export async function getCurrentDayInWeek(): Promise<number> {
  const streak = await getCurrentStreak();
  return dayInWeekFor(streak || 1);
}
