import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson } from '@/services/http';

export type GardenSeed = {
  id: string;
  name: string;
  currency: 'coin' | 'crystal';
  price: number;
  growMinutes: number;
  yieldCoin: number;
};

export type GardenSlot =
  | { index: number; empty: true }
  | {
      index: number;
      empty: false;
      seedId: string;
      seedName: string;
      plantedAt: string;
      readyAt: string;
      ready: boolean;
    };

export type GardenState = {
  slots: GardenSlot[];
  moon: { illumination: number; label: string };
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

export async function getGardenSeeds(): Promise<GardenSeed[]> {
  const { seeds } = await getJson<{ seeds: GardenSeed[] }>(`${env.socialApiUrl()}/garden/seeds`, appHeaders());
  return seeds;
}

export async function getGarden(): Promise<GardenState> {
  const headers = await requireAuthHeaders();
  return getJson<GardenState>(`${env.socialApiUrl()}/garden`, headers);
}

export async function plantSeed(slotIndex: number, seedTypeId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/garden/plant`, { slotIndex, seedTypeId }, headers);
}

export async function harvestSlot(slotIndex: number): Promise<{ yieldCoin: number }> {
  const headers = await requireAuthHeaders();
  return postJson<{ ok: boolean; yieldCoin: number }>(`${env.socialApiUrl()}/garden/harvest`, { slotIndex }, headers);
}
