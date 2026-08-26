import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';
import { CARD_DESIGNS } from '@/constants/cardDesigns';
import { spendCoins } from '@/services/coins';

const OWNED_KEY = '@mistik-rehber/owned-card-designs';
const SELECTED_KEY = '@mistik-rehber/selected-card-design';

async function readOwnedExtra(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(OWNED_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getOwnedDesignIds(): Promise<string[]> {
  const freeIds = CARD_DESIGNS.filter((design) => design.free).map((design) => design.id);
  const extra = await readOwnedExtra();
  return Array.from(new Set([...freeIds, ...extra]));
}

export async function getSelectedDesignId(): Promise<string> {
  return (await AsyncStorage.getItem(SELECTED_KEY)) ?? 'default';
}

export async function getSelectedDesignImage(): Promise<ImageSourcePropType> {
  const id = await getSelectedDesignId();
  const design = CARD_DESIGNS.find((entry) => entry.id === id) ?? CARD_DESIGNS[0];
  return design.image;
}

export async function selectDesign(id: string): Promise<void> {
  await AsyncStorage.setItem(SELECTED_KEY, id);
}

async function unlockDesign(id: string): Promise<void> {
  const extra = await readOwnedExtra();
  if (!extra.includes(id)) {
    await AsyncStorage.setItem(OWNED_KEY, JSON.stringify([...extra, id]));
  }
}

export async function purchaseDesignWithCoins(id: string): Promise<boolean> {
  const design = CARD_DESIGNS.find((entry) => entry.id === id);
  if (!design) return false;
  const success = await spendCoins(design.priceCoins);
  if (!success) return false;
  await unlockDesign(id);
  return true;
}

/**
 * Placeholder for a real single-item purchase flow. No payment provider is
 * wired up yet — this only unlocks the design locally so the marketplace UI
 * can be built and tested ahead of a real react-native-iap integration.
 */
export async function purchaseDesignWithTL(id: string): Promise<void> {
  await unlockDesign(id);
}
