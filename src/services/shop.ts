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

export type WalletBundle = {
  id: 'starter' | 'popular' | 'value' | 'mega';
  coin: number;
  crystal: number;
  priceTL: string;
  badge?: string;
};

// Miktarlar sunucudaki WALLET_BUNDLES ile birebir eşleşmeli — burası sadece
// görüntüleme katmanı, gerçek kredi sunucu tarafında bu id'ye göre veriliyor.
// Henüz gerçek bir ödeme sağlayıcısı bağlı değil (CoinShopScreen'deki mock
// coin satın alımıyla aynı düzeyde), fiyatlar bilgilendirme amaçlı.
export const WALLET_BUNDLES: WalletBundle[] = [
  { id: 'starter', coin: 100, crystal: 20, priceTL: '₺19,99' },
  { id: 'popular', coin: 300, crystal: 70, priceTL: '₺49,99', badge: 'En Popüler' },
  { id: 'value', coin: 700, crystal: 180, priceTL: '₺99,99', badge: 'Avantajlı' },
  { id: 'mega', coin: 1500, crystal: 400, priceTL: '₺179,99', badge: 'En Avantajlı' },
];

type WalletListener = (balances: WalletBalances) => void;
const walletListeners = new Set<WalletListener>();

// Sunucudaki kristal/coin cüzdanı için CoinBadge/coins.ts'deki gibi bir
// yayın mekanizması — bir ekranda satın alma yapılınca (mağaza, VIP, paket)
// başka bir ekrana geçmeden tüm rozet/bakiye gösterimleri anında güncellensin.
export function subscribeWallet(listener: WalletListener): () => void {
  walletListeners.add(listener);
  return () => {
    walletListeners.delete(listener);
  };
}

function notifyWallet(balances: WalletBalances): void {
  walletListeners.forEach((listener) => listener(balances));
}

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
  notifyWallet(balances);
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
  getWallet().catch(() => {}); // rozet/bakiye dinleyicilerini anında güncelle
}

export async function getInventory(): Promise<InventoryItem[]> {
  const headers = await requireAuthHeaders();
  const { items } = await getJson<{ items: InventoryItem[] }>(`${env.socialApiUrl()}/shop/inventory`, headers);
  return items;
}

export async function purchaseWalletBundle(bundleId: WalletBundle['id']): Promise<WalletBalances> {
  const headers = await requireAuthHeaders();
  const { balances } = await postJson<{ balances: WalletBalances }>(
    `${env.socialApiUrl()}/wallet/bundles/${bundleId}/purchase`,
    {},
    headers,
  );
  notifyWallet(balances);
  return balances;
}

export async function getVipTiers(): Promise<VipTier[]> {
  const { tiers } = await getJson<{ tiers: VipTier[] }>(`${env.socialApiUrl()}/vip/tiers`, appHeaders());
  return tiers;
}

export async function subscribeVip(tierId: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/vip/tiers/${tierId}/subscribe`, {}, headers);
  getWallet().catch(() => {}); // kristal bakiyesi düştü, dinleyicileri anında güncelle
}

export async function getMyVipSubscription(): Promise<VipSubscription> {
  const headers = await requireAuthHeaders();
  const { subscription } = await getJson<{ subscription: VipSubscription }>(`${env.socialApiUrl()}/vip/me`, headers);
  return subscription;
}
