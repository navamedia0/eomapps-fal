import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';
import { isPremium } from '@/services/premium';

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

export async function getCredits(): Promise<number> {
  if (await isPremium()) return Infinity;
  const state = await readState();
  const freeRemaining = Math.max(0, DAILY_FREE_CREDITS - state.freeUsedCount);
  return state.balance + freeRemaining;
}

export async function spendCredit(): Promise<boolean> {
  if (await isPremium()) return true;
  const state = await readState();
  if (state.freeUsedCount < DAILY_FREE_CREDITS) {
    await writeState({ ...state, freeUsedDate: today(), freeUsedCount: state.freeUsedCount + 1 });
    return true;
  }
  if (state.balance < 1) return false;
  await writeState({ ...state, balance: state.balance - 1 });
  return true;
}

export async function addCredits(amount: number): Promise<number> {
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Kredi miktari pozitif bir tam sayi olmali.');
  const state = await readState();
  const next = state.balance + amount;
  await writeState({ ...state, balance: next });
  return next;
}
