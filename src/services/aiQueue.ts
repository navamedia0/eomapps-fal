import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadingType } from '@/constants/aiQueue';

const keyFor = (type: ReadingType) => `@mistik-rehber/reading-congestion/${type}`;

// This countdown is now purely a mirror of a REAL server-confirmed
// congestion event (see checkCongestion in server/ai-proxy) — it is never
// started speculatively. reportCongestion() is the only writer, called from
// a screen's catch block when the AI proxy actually returns a 429 with
// congestion: true.
export async function getRemainingCongestionSeconds(type: ReadingType): Promise<number> {
  const raw = await AsyncStorage.getItem(keyFor(type));
  if (!raw) return 0;
  const untilMs = parseInt(raw, 10);
  const remaining = Math.ceil((untilMs - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export async function reportCongestion(type: ReadingType, retryAfterSeconds: number): Promise<void> {
  await AsyncStorage.setItem(keyFor(type), String(Date.now() + retryAfterSeconds * 1000));
}
