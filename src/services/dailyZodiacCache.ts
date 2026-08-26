import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Zodiac } from '@/services/zodiac';

const STORAGE_KEY = '@mistik-rehber/daily-zodiac-cache';

type CacheState = { date: string; readings: Partial<Record<Zodiac, string>> };

const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<CacheState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed: CacheState = raw ? JSON.parse(raw) : { date: today(), readings: {} };
  return parsed.date === today() ? parsed : { date: today(), readings: {} };
}

export async function getCachedZodiacReading(sign: Zodiac): Promise<string | null> {
  const state = await readState();
  return state.readings[sign] ?? null;
}

export async function setCachedZodiacReading(sign: Zodiac, text: string): Promise<void> {
  const state = await readState();
  state.readings[sign] = text;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), readings: state.readings }));
}
