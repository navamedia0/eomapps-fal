import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson, deleteRequest } from '@/services/http';

export type SocialUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export type SocialProfile = {
  user: SocialUser;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

async function optionalAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  return session ? { Authorization: `Bearer ${session.token}`, ...appHeaders() } : appHeaders();
}

async function requireAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) {
    throw new Error('Bu işlem için giriş yapmalısın. Profil sekmesinden Google ile giriş yapabilirsin.');
  }
  return { Authorization: `Bearer ${session.token}`, ...appHeaders() };
}

export async function getUserProfile(userId: string): Promise<SocialProfile> {
  const headers = await optionalAuthHeaders();
  return getJson<SocialProfile>(`${env.socialApiUrl()}/users/${userId}`, headers);
}

export async function followUser(userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/follow/${userId}`, {}, headers);
}

export async function unfollowUser(userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/follow/${userId}`, headers);
}

export async function blockUser(userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/block/${userId}`, {}, headers);
}

export type BlockedUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  blockedAt: string;
};

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const headers = await requireAuthHeaders();
  const { blocked } = await getJson<{ blocked: BlockedUser[] }>(`${env.socialApiUrl()}/blocks`, headers);
  return blocked;
}

export async function unblockUser(userId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/block/${userId}`, headers);
}
