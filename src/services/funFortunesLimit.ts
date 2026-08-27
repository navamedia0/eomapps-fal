import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/fun-fortunes-limit';
const DAILY_LIMIT = 30;

type FunFortuneType = 'papatya' | 'zar' | 'kure' | 'su';

type StorageState = {
  date: string;
  counts: Partial<Record<FunFortuneType, number>>;
};

const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<StorageState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), counts: {} };
    const parsed: StorageState = JSON.parse(raw);
    return parsed.date === today() ? parsed : { date: today(), counts: {} };
  } catch {
    return { date: today(), counts: {} };
  }
}

async function writeState(state: StorageState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getFunFortuneUsage(type: FunFortuneType): Promise<{ count: number; reachedLimit: boolean }> {
  const state = await readState();
  const count = state.counts[type] ?? 0;
  return {
    count,
    reachedLimit: count >= DAILY_LIMIT,
  };
}

export async function recordFunFortuneAttempt(type: FunFortuneType): Promise<{ allowed: boolean; count: number }> {
  const state = await readState();
  const current = state.counts[type] ?? 0;

  if (current >= DAILY_LIMIT) {
    return { allowed: false, count: current };
  }

  const next = current + 1;
  state.counts[type] = next;
  await writeState(state);

  return { allowed: true, count: next };
}
