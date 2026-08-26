import { env } from '@/config/env';
import type { FavoriteEntry } from '@/services/favorites';

export type PopularFavorite = Omit<FavoriteEntry, 'savedAt'> & { count: number };

// Cross-user popularity — the only piece of the favorites feature that can't
// live purely on-device, since it aggregates everyone's taps. Best-effort in
// both directions: reporting never blocks the star-tap UI, and reading falls
// back to an empty list if the proxy is unreachable.
export async function reportFavorite(entry: Omit<FavoriteEntry, 'savedAt'>): Promise<void> {
  try {
    const appSecret = env.appSecret();
    await fetch(`${env.aiProxyUrl()}/favorite-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(appSecret ? { 'X-App-Secret': appSecret } : {}),
      },
      body: JSON.stringify(entry),
    });
  } catch {
    // Silent — this is a nice-to-have popularity signal, never worth
    // surfacing an error over.
  }
}

export async function getPopularFavorites(): Promise<PopularFavorite[]> {
  try {
    const appSecret = env.appSecret();
    const response = await fetch(`${env.aiProxyUrl()}/popular-favorites`, {
      headers: appSecret ? { 'X-App-Secret': appSecret } : {},
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { items?: PopularFavorite[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}
