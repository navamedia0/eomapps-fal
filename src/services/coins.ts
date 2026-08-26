import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/coins';

type Listener = (coins: number) => void;
const listeners = new Set<Listener>();

function notify(coins: number): void {
  listeners.forEach((listener) => listener(coins));
}

// Lets UI (CoinBadge, shop screens) react immediately when the balance
// changes anywhere in the app, instead of only refreshing on screen focus —
// a screen that spent coins itself would otherwise show a stale balance
// until the user navigated away and back.
export function subscribeCoins(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getCoins(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? Number(raw) : 0;
}

export async function addCoins(amount: number): Promise<number> {
  const current = await getCoins();
  const next = current + amount;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  notify(next);
  return next;
}

export async function spendCoins(amount: number): Promise<boolean> {
  const current = await getCoins();
  if (current < amount) return false;
  const next = current - amount;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  notify(next);
  return true;
}
