import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCredits } from '@/services/credits';

const STORAGE_KEY = '@mistik-rehber/video-rewards';

export const VIDEO_REWARD_SCHEDULE: number[] = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3];

type VideoRewardState = { date: string; claimed: number };

const today = () => new Date().toISOString().slice(0, 10);

async function readState(): Promise<VideoRewardState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed: VideoRewardState = raw ? JSON.parse(raw) : { date: today(), claimed: 0 };
  return parsed.date === today() ? parsed : { date: today(), claimed: 0 };
}

export async function getVideoRewardState(): Promise<{ claimed: number; total: number }> {
  const state = await readState();
  return { claimed: state.claimed, total: VIDEO_REWARD_SCHEDULE.length };
}

export async function claimNextVideoReward(): Promise<{ credit: number; claimed: number } | null> {
  const state = await readState();
  if (state.claimed >= VIDEO_REWARD_SCHEDULE.length) return null;

  const credit = VIDEO_REWARD_SCHEDULE[state.claimed];
  const nextClaimed = state.claimed + 1;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), claimed: nextClaimed }));
  await addCredits(credit);
  return { credit, claimed: nextClaimed };
}
