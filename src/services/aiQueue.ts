import AsyncStorage from '@react-native-async-storage/async-storage';
import { READING_COOLDOWN_SECONDS, type ReadingType } from '@/constants/aiQueue';

const keyFor = (type: ReadingType) => `@mistik-rehber/reading-cooldown/${type}`;

export class ReadingCooldownError extends Error {
  remainingSeconds: number;
  constructor(remainingSeconds: number) {
    super(`Bu fal türü için sıradasın — ${remainingSeconds} saniye sonra tekrar deneyebilirsin.`);
    this.remainingSeconds = remainingSeconds;
  }
}

export async function getRemainingCooldownSeconds(type: ReadingType): Promise<number> {
  const raw = await AsyncStorage.getItem(keyFor(type));
  if (!raw) return 0;
  const elapsedSeconds = (Date.now() - parseInt(raw, 10)) / 1000;
  const remaining = READING_COOLDOWN_SECONDS[type] - elapsedSeconds;
  return remaining > 0 ? Math.ceil(remaining) : 0;
}

async function markReadingStarted(type: ReadingType): Promise<void> {
  await AsyncStorage.setItem(keyFor(type), String(Date.now()));
}

// Called at the top of every gated readings-ai.ts function — the single
// source of truth for enforcement, independent of which screen calls it.
// Throws ReadingCooldownError if this device is still in cooldown for this
// reading type; otherwise starts a fresh cooldown window immediately (locked
// in on attempt, not on success, so a failed upstream call can't be used to
// cheaply retry-spam).
export async function guardReadingCooldown(type: ReadingType): Promise<void> {
  const remaining = await getRemainingCooldownSeconds(type);
  if (remaining > 0) throw new ReadingCooldownError(remaining);
  await markReadingStarted(type);
}
