import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCoins } from '@/services/coins';

const STORAGE_KEY = '@mistik-rehber/video-rewards';

// Her slotun kazandırdığı coin miktarı
export const VIDEO_REWARD_SCHEDULE: number[] = [5, 5, 5, 5, 5, 10, 10, 10, 10, 15];

/**
 * Ödül miktarına göre gereken video sayısı:
 * +5 Coin  -> 1 Video
 * +10 Coin -> 2 Video
 * +15 Coin -> 3 Video
 */
export function getVideosNeededForReward(coins: number): number {
  if (coins <= 5) return 1;
  if (coins <= 10) return 2;
  return 3;
}

type VideoRewardState = {
  date: string;
  claimedSlot: number; // Tamamlanan slot indeksi (0-10)
  currentSlotSubVideos: number; // Mevcut slot için izlenen video sayısı
};

const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<VideoRewardState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), claimedSlot: 0, currentSlotSubVideos: 0 };
    const parsed: VideoRewardState = JSON.parse(raw);
    return parsed.date === today()
      ? parsed
      : { date: today(), claimedSlot: 0, currentSlotSubVideos: 0 };
  } catch {
    return { date: today(), claimedSlot: 0, currentSlotSubVideos: 0 };
  }
}

async function writeState(state: VideoRewardState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type VideoRewardStatus = {
  claimedSlots: number;
  totalSlots: number;
  currentSlotCoins: number;
  currentSubVideo: number; // Şu an izlenecek video (1, 2 veya 3)
  totalSubVideosNeeded: number; // Bu slot için gereken toplam video (1, 2 veya 3)
  isAllCompleted: boolean;
};

export async function getVideoRewardStatus(): Promise<VideoRewardStatus> {
  const state = await readState();
  const totalSlots = VIDEO_REWARD_SCHEDULE.length;

  if (state.claimedSlot >= totalSlots) {
    return {
      claimedSlots: totalSlots,
      totalSlots,
      currentSlotCoins: 0,
      currentSubVideo: 0,
      totalSubVideosNeeded: 0,
      isAllCompleted: true,
    };
  }

  const currentCoins = VIDEO_REWARD_SCHEDULE[state.claimedSlot];
  const totalSubVideosNeeded = getVideosNeededForReward(currentCoins);
  const currentSubVideo = state.currentSlotSubVideos + 1;

  return {
    claimedSlots: state.claimedSlot,
    totalSlots,
    currentSlotCoins: currentCoins,
    currentSubVideo,
    totalSubVideosNeeded,
    isAllCompleted: false,
  };
}

/**
 * 1 video izlendiğinde çağrılır.
 * Slot tamamlanırsa coin ekler ve ödülü döner.
 */
export async function recordVideoWatched(): Promise<{
  isSlotCompleted: boolean;
  coinsAwarded: number;
  newStatus: VideoRewardStatus;
}> {
  const state = await readState();
  const totalSlots = VIDEO_REWARD_SCHEDULE.length;

  if (state.claimedSlot >= totalSlots) {
    const newStatus = await getVideoRewardStatus();
    return { isSlotCompleted: false, coinsAwarded: 0, newStatus };
  }

  const currentCoins = VIDEO_REWARD_SCHEDULE[state.claimedSlot];
  const videosNeeded = getVideosNeededForReward(currentCoins);
  const nextSubVideos = state.currentSlotSubVideos + 1;

  if (nextSubVideos >= videosNeeded) {
    // Slot tamamlandı! Coini ver ve bir sonraki slota geç
    state.claimedSlot += 1;
    state.currentSlotSubVideos = 0;
    await writeState(state);
    await addCoins(currentCoins);

    const newStatus = await getVideoRewardStatus();
    return { isSlotCompleted: true, coinsAwarded: currentCoins, newStatus };
  } else {
    // Slot için ara video tamamlandı (örn: 1/2 bitti, sırada 2/2 var)
    state.currentSlotSubVideos = nextSubVideos;
    await writeState(state);

    const newStatus = await getVideoRewardStatus();
    return { isSlotCompleted: false, coinsAwarded: 0, newStatus };
  }
}
