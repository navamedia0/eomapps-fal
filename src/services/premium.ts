import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/premium';

export async function isPremium(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw === 'true';
}

/**
 * Placeholder for a real purchase flow. No payment provider is wired up yet —
 * this only flips the local premium flag so the rest of the app (credit
 * gating, paywall UI) can be built and tested ahead of a real react-native-iap
 * integration.
 */
export async function activatePremiumMock(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}

export async function deactivatePremiumMock(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
