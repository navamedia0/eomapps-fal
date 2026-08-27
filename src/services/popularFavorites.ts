import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';
import type { FavoriteEntry } from '@/services/favorites';

export type PopularFavorite = Omit<FavoriteEntry, 'savedAt'> & { count: number };

const REPORTED_STORAGE_KEY = '@reported_popular_favorite_ids';

async function getDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem('@mistik_device_id');
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      await AsyncStorage.setItem('@mistik_device_id', id);
    }
    return id;
  } catch {
    return 'fallback-device';
  }
}

async function hasAlreadyReported(id: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(REPORTED_STORAGE_KEY);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return ids.includes(id);
  } catch {
    return false;
  }
}

async function markAsReported(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(REPORTED_STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(id)) {
      ids.push(id);
      const trimmed = ids.slice(-500);
      await AsyncStorage.setItem(REPORTED_STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // ignore
  }
}

// Cross-user popularity — aggregates everyone's taps.
// Each user/device only contributes 1 count per quote to prevent accumulation on re-favoriting.
export async function reportFavorite(entry: Omit<FavoriteEntry, 'savedAt'>): Promise<void> {
  try {
    const alreadyReported = await hasAlreadyReported(entry.id);
    if (alreadyReported) {
      return; // Already counted for this user, do not increment again!
    }

    await markAsReported(entry.id);

    const deviceId = await getDeviceId();
    const appSecret = env.appSecret();
    await fetch(`${env.aiProxyUrl()}/favorite-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(appSecret ? { 'X-App-Secret': appSecret } : {}),
      },
      body: JSON.stringify({ ...entry, deviceId }),
    });
  } catch {
    // Silent
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
