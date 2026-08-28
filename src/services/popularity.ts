import { env } from '@/config/env';
import { getJson } from '@/services/http';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
};

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

export async function getLeaderboard(): Promise<{ weekStart: string; leaderboard: LeaderboardEntry[] }> {
  return getJson(`${env.socialApiUrl()}/popularity/leaderboard`, appHeaders());
}
