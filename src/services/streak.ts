import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCredits } from '@/services/credits';

const STORAGE_KEY = '@mistik-rehber/streak';

type StreakState = { lastOpenDate: string; streak: number; longestStreak: number };

export type DailyOpenResult = { streak: number; isNewDay: boolean; rewardCredits: number };

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

function rewardForStreak(streak: number): number {
  if (streak % 7 === 0) return 3;
  if (streak % 3 === 0) return 1;
  return 0;
}

export async function recordDailyOpen(): Promise<DailyOpenResult> {
  const state = await readState();
  if (state.lastOpenDate === today()) {
    return { streak: state.streak, isNewDay: false, rewardCredits: 0 };
  }

  const newStreak = state.lastOpenDate === yesterday() ? state.streak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, newStreak);
  await writeState({ lastOpenDate: today(), streak: newStreak, longestStreak });

  const rewardCredits = rewardForStreak(newStreak);
  if (rewardCredits > 0) await addCredits(rewardCredits);

  return { streak: newStreak, isNewDay: true, rewardCredits };
}

export async function getCurrentStreak(): Promise<number> {
  const state = await readState();
  return state.lastOpenDate === today() || state.lastOpenDate === yesterday() ? state.streak : 0;
}
