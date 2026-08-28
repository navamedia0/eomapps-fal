import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postJson } from '@/services/http';

export type ShopCategory = 'frame' | 'badge' | 'entrance_effect';
export type Currency = 'coin' | 'crystal';

export type ShopItem = {
  id: string;
  category: ShopCategory;
  name: string;
  description: string | null;
  currency: Currency;
  price: number;
  owned: boolean;
};

export type InventoryItem = {
  id: string;
  category: ShopCategory;
  name: string;
  description: string | null;
  purchasedAt: string;
};

export type VipTier = {
  id: string;
  name: string;
  monthlyPriceCrystal: number;
  perks: string[];
};

export type VipSubscription = {
  tierId: string;
  tierName: string;
  perks: string[];
  expiresAt: string;
} | null;

export type WalletBalances = { coin: number; crystal: number };

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

export async function getWallet(): Promise<WalletBalances> {
  const headers = await requireAuthHeaders();
  const { balances } = await getJson<{ balances: WalletBalances }>(`${env.socialApiUrl()}/wallet`, headers);
  return balances;
}

export async function getShopItems(category?: ShopCategory): Promise<ShopItem[]> {
  const headers = await optionalAuthHeaders();
  const query = category ? `?category=${category}` : '';
  const { items } = await getJson<{ items: ShopItem[] }>(`${env.socialApiUrl()}/shop/items${query}`, headers);
  return items;
}

export async function purchaseItem(itemId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/shop/items/${itemId}/purchase`, {}, headers);
}

export async function getInventory(): Promise<InventoryItem[]> {
  const headers = await requireAuthHeaders();
  const { items } = await getJson<{ items: InventoryItem[] }>(`${env.socialApiUrl()}/shop/inventory`, headers);
  return items;
}

export async function getVipTiers(): Promise<VipTier[]> {
  const { tiers } = await getJson<{ tiers: VipTier[] }>(`${env.socialApiUrl()}/vip/tiers`, appHeaders());
  return tiers;
}

export async function subscribeVip(tierId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/vip/tiers/${tierId}/subscribe`, {}, headers);
}

export async function getMyVipSubscription(): Promise<VipSubscription> {
  const headers = await requireAuthHeaders();
  const { subscription } = await getJson<{ subscription: VipSubscription }>(`${env.socialApiUrl()}/vip/me`, headers);
  return subscription;
}
