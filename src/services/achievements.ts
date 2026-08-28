import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson } from '@/services/http';

export type AchievementTier = { tier: number; threshold: number; label: string };
export type UnlockedTier = { tier: number; unlockedAt: string };

export type Achievement = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  tiers: AchievementTier[];
  unlockedTiers: UnlockedTier[];
  progress: number | null;
};

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

export async function getAchievements(): Promise<Achievement[]> {
  const session = await getStoredSession();
  if (!session) throw new Error('Bu işlem için giriş yapmalısın. Profil sekmesinden Google ile giriş yapabilirsin.');
  const headers = { Authorization: `Bearer ${session.token}`, ...appHeaders() };
  const { achievements } = await getJson<{ achievements: Achievement[] }>(`${env.socialApiUrl()}/achievements`, headers);
  return achievements;
}
