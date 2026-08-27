import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCredits, spendCredit } from '@/services/credits';

const STORAGE_KEY = '@mistik-rehber/reading-category-limits';

export type ReadingCategory =
  | 'kahve'
  | 'tarot3'
  | 'katina'
  | 'solitaire'
  | 'el'
  | 'yuz'
  | 'sesli'
  | 'dream';

type CategoryState = {
  date: string;
  counts: Partial<Record<ReadingCategory, number>>;
  videoProgress: Partial<Record<ReadingCategory, number>>;
};

export type CategoryStatusResult = {
  usedToday: number;
  status: 'free' | 'need_1_video' | 'need_3_videos' | 'coin_only';
  videosWatched: number;
  videosRequired: number;
};

const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<CategoryState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), counts: {}, videoProgress: {} };
    const parsed: CategoryState = JSON.parse(raw);
    return parsed.date === today()
      ? parsed
      : { date: today(), counts: {}, videoProgress: {} };
  } catch {
    return { date: today(), counts: {}, videoProgress: {} };
  }
}

async function writeState(state: CategoryState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Bir fal kategorisinin bugünkü durumunu döner:
 * - usedToday === 0 ve genel hak > 0  => 'free'
 * - usedToday === 1                    => 'need_1_video' (1 video izleme gerekir)
 * - usedToday === 2                    => 'need_3_videos' (3 video izleme gerekir)
 * - usedToday >= 3 veya video bitti   => 'coin_only'
 */
export async function getCategoryStatus(category: ReadingCategory): Promise<CategoryStatusResult> {
  const state = await readState();
  const usedToday = state.counts[category] ?? 0;
  const videosWatched = state.videoProgress[category] ?? 0;
  const generalCredits = await getCredits();

  if (usedToday === 0 && generalCredits > 0) {
    return {
      usedToday,
      status: 'free',
      videosWatched: 0,
      videosRequired: 0,
    };
  }

  if (usedToday === 1 || (usedToday === 0 && generalCredits <= 0)) {
    // 2. hak veya genel hak bitmiş ama 1. video ile açılacak
    const required = 1;
    if (videosWatched >= required) {
      return { usedToday, status: 'free', videosWatched, videosRequired: required };
    }
    return {
      usedToday,
      status: 'need_1_video',
      videosWatched,
      videosRequired: required,
    };
  }

  if (usedToday === 2) {
    // 3. hak için 3 video gerekir
    const required = 3;
    if (videosWatched >= required) {
      return { usedToday, status: 'free', videosWatched, videosRequired: required };
    }
    return {
      usedToday,
      status: 'need_3_videos',
      videosWatched,
      videosRequired: required,
    };
  }

  // 3 hak doldu => sadece Coin
  return {
    usedToday,
    status: 'coin_only',
    videosWatched: 0,
    videosRequired: 0,
  };
}

/**
 * Kullanıcı bir reklam videosunu başarıyla tamamladığında çağrılır.
 */
export async function recordVideoWatched(
  category: ReadingCategory,
): Promise<{ unlocked: boolean; watched: number; required: number }> {
  const state = await readState();
  const usedToday = state.counts[category] ?? 0;
  const currentWatched = (state.videoProgress[category] ?? 0) + 1;
  state.videoProgress[category] = currentWatched;

  const required = usedToday <= 1 ? 1 : 3;
  await writeState(state);

  return {
    unlocked: currentWatched >= required,
    watched: currentWatched,
    required,
  };
}

/**
 * Fal tamamlandığında çağrılır (Kategori sayacını artırır ve video sayacını sıfırlar).
 */
export async function recordCategoryReadingComplete(
  category: ReadingCategory,
  isPaidCoin = false,
): Promise<void> {
  if (isPaidCoin) return; // Coin ile bakıldıysa günlük hak düşülmez

  const state = await readState();
  const current = state.counts[category] ?? 0;
  state.counts[category] = current + 1;
  state.videoProgress[category] = 0; // Bir sonraki kademe için video ilerlemesini sıfırla
  await writeState(state);

  // Genel günlük 3 haktan düş (eğer ilk haksaysa)
  if (current === 0) {
    await spendCredit();
  }
}
