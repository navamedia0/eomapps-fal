import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type SubscriptionPeriod } from '@/constants/subscriptionPlans';

const STORAGE_KEY = '@mistik-rehber/active-plan';

type ActivePlanState = { planId: string; activatedAt: number; expiresAt: number };

const PERIOD_MS: Record<SubscriptionPeriod, number> = {
  haftalik: 7 * 24 * 60 * 60 * 1000,
  aylik: 30 * 24 * 60 * 60 * 1000,
  yillik: 365 * 24 * 60 * 60 * 1000,
};

async function readState(): Promise<ActivePlanState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getActivePlan(): Promise<SubscriptionPlan | null> {
  const state = await readState();
  if (!state) return null;
  if (Date.now() > state.expiresAt) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === state.planId) ?? null;
}

export async function getActivePlanExpiry(): Promise<number | null> {
  const state = await readState();
  return state ? state.expiresAt : null;
}

export async function isPremium(): Promise<boolean> {
  return (await getActivePlan()) !== null;
}

/**
 * Placeholder for a real purchase flow — no payment provider wired up yet.
 * Sets the active plan locally (with a mock expiry based on the plan's
 * period) so credit gating and the paywall UI can be built and tested ahead
 * of a real react-native-iap integration.
 */
export async function activatePlanMock(planId: string): Promise<void> {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) return;
  const now = Date.now();
  const state: ActivePlanState = { planId, activatedAt: now, expiresAt: now + PERIOD_MS[plan.period] };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (plan.bonusCoins) {
    const { addCoins } = await import('@/services/coins');
    await addCoins(plan.bonusCoins);
  }
}

export async function deactivatePlanMock(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// null = sınırsız, number = günlük fal kotası. Aktif ücretli paket yoksa
// null döner — credits.ts bu durumda kendi ücretsiz günlük hakkını uygular.
export async function getPaidDailyQuota(): Promise<number | null | undefined> {
  const plan = await getActivePlan();
  if (!plan) return undefined;
  return plan.dailyQuota;
}
