import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson } from '@/services/http';

export type Guide = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
};

export type GuideApplicationStatus = 'pending' | 'approved' | 'rejected';

export type GuideApplication = {
  id: string;
  message: string;
  status: GuideApplicationStatus;
  createdAt: string;
  decidedAt: string | null;
};

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

async function requireAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) {
    throw new Error('Bu işlem için giriş yapmalısın. Profil sekmesinden Google ile giriş yapabilirsin.');
  }
  return { Authorization: `Bearer ${session.token}`, ...appHeaders() };
}

export async function getGuides(): Promise<Guide[]> {
  const { guides } = await getJson<{ guides: Guide[] }>(`${env.socialApiUrl()}/guides`, appHeaders());
  return guides;
}

export async function getMyGuideApplication(): Promise<GuideApplication | null> {
  const headers = await requireAuthHeaders();
  const { application } = await getJson<{ application: GuideApplication | null }>(
    `${env.socialApiUrl()}/guide-applications/me`,
    headers,
  );
  return application;
}

export async function applyForGuide(message: string): Promise<GuideApplication> {
  const trimmed = message.trim();
  if (!trimmed) throw new Error('Başvuru mesajı gerekli.');
  const headers = await requireAuthHeaders();
  const { application } = await postJson<{ application: GuideApplication }>(
    `${env.socialApiUrl()}/guide-applications`,
    { message: trimmed },
    headers,
  );
  return application;
}
