import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson } from '@/services/http';

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

async function authHeadersOrNull(): Promise<Record<string, string> | null> {
  const session = await getStoredSession();
  if (!session) return null;
  return { Authorization: `Bearer ${session.token}`, ...appHeaders() };
}

// Giriş yapılmamışsa sessizce null döner — Kader Kasabası oyunları girişsiz de
// oynanabilir, sunucu skoru sadece "varsa" senkronize edilir.
export async function getServerBestScore(gameKey: string): Promise<number | null> {
  const headers = await authHeadersOrNull();
  if (!headers) return null;
  try {
    const { bestScore } = await getJson<{ bestScore: number }>(`${env.socialApiUrl()}/games/${gameKey}/score`, headers);
    return bestScore;
  } catch {
    return null;
  }
}

export async function submitScore(gameKey: string, score: number): Promise<number | null> {
  const headers = await authHeadersOrNull();
  if (!headers) return null;
  try {
    const { bestScore } = await postJson<{ bestScore: number }>(`${env.socialApiUrl()}/games/${gameKey}/score`, { score }, headers);
    return bestScore;
  } catch {
    return null;
  }
}
