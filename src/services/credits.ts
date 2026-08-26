import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';
import { getPaidDailyQuota } from '@/services/premium';

const DAILY_FREE_CREDITS = 3;

type CreditState = { balance: number; freeUsedDate?: string; freeUsedCount: number };
const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<CreditState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.credits);
  const parsed: CreditState = raw ? JSON.parse(raw) : { balance: 0, freeUsedCount: 0 };
  return parsed.freeUsedDate === today() ? parsed : { ...parsed, freeUsedDate: today(), freeUsedCount: 0 };
}

async function writeState(state: CreditState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.credits, JSON.stringify(state));
}

// Resolves today's free-reading quota: an active paid plan's own daily quota
// (or unlimited) takes over from the baseline free-tier allowance entirely —
// it does not stack on top of it.
async function resolveDailyQuota(): Promise<number | null> {
  const paidQuota = await getPaidDailyQuota();
  if (paidQuota === undefined) return DAILY_FREE_CREDITS;
  return paidQuota;
}

export async function getCredits(): Promise<number> {
  const quota = await resolveDailyQuota();
  if (quota === null) return Infinity;
  const state = await readState();
  const freeRemaining = Math.max(0, quota - state.freeUsedCount);
  return state.balance + freeRemaining;
}

export async function spendCredit(): Promise<boolean> {
  const quota = await resolveDailyQuota();
  if (quota === null) return true;
  const state = await readState();
  if (state.freeUsedCount < quota) {
    await writeState({ ...state, freeUsedDate: today(), freeUsedCount: state.freeUsedCount + 1 });
    return true;
  }
  if (state.balance < 1) return false;
  await writeState({ ...state, balance: state.balance - 1 });
  return true;
}
