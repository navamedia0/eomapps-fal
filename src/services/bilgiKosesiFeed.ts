import bundledContent from '@/data/bilgi_kosesi_kartlari.json';
import { env } from '@/config/env';

export type InfoCategory = 'burc' | 'kart' | 'astroloji' | 'tarot';
export type InfoCard = { id: string; category: InfoCategory; title: string; body: string };

const POOL: InfoCard[] = bundledContent as InfoCard[];
const DAILY_COUNT = 20;
const FETCH_TIMEOUT_MS = 3500;

function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function dailySlice(pool: InfoCard[]): InfoCard[] {
  if (pool.length === 0) return [];
  const offset = (dayIndex() * DAILY_COUNT) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return rotated.slice(0, Math.min(DAILY_COUNT, pool.length));
}

// Bundled ~48-item pool that always works offline/pre-deploy. If the Worker's
// AI-generated pool (server/ai-proxy's weekly cron) is reachable and has
// content, its cards take priority — the bundled set is purely a fallback,
// never a hard dependency for this feature to function.
export async function getDailyInfoCards(): Promise<InfoCard[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const appSecret = env.appSecret();
    const response = await fetch(`${env.aiProxyUrl()}/bilgi-kosesi`, {
      headers: appSecret ? { 'X-App-Secret': appSecret } : {},
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error('bilgi-kosesi fetch failed');
    const data = (await response.json()) as { cards?: InfoCard[] };
    if (data.cards && data.cards.length > 0) return data.cards;
  } catch {
    // Network hiccup, not deployed yet, or KV pool still empty — fall through.
  }
  return dailySlice(POOL);
}
