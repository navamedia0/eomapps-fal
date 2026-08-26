import AsyncStorage from '@react-native-async-storage/async-storage';
import affirmations from '@/data/affirmations.json';

const AFFIRMATIONS: string[] = affirmations;
const STORAGE_KEY = '@mistik-rehber/daily-affirmation';

type CacheState = { date: string; text: string };

const today = () => new Date().toISOString().slice(0, 10);

export async function getDailyAffirmation(): Promise<string> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed: CacheState | null = raw ? JSON.parse(raw) : null;

  if (parsed && parsed.date === today()) return parsed.text;

  const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), text }));
  return text;
}
