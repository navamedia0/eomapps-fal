import AsyncStorage from '@react-native-async-storage/async-storage';

const COINS_KEY = 'user_coins_balance';

type Listener = (coins: number) => void;
const listeners = new Set<Listener>();

function notify(coins: number): void {
  listeners.forEach((listener) => listener(coins));
}

export function subscribeCoins(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getCoins(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(COINS_KEY);
    if (val === null) return 100; // Başlangıç hediyesi
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 100 : parsed;
  } catch {
    return 100;
  }
}

export async function addCoins(amount: number): Promise<number> {
  const current = await getCoins();
  const next = Math.max(0, current + Math.floor(amount));
  await AsyncStorage.setItem(COINS_KEY, String(next));
  notify(next);
  return next;
}

export async function spendCoins(amount: number): Promise<boolean> {
  const current = await getCoins();
  if (current < amount) return false;
  const next = Math.max(0, current - Math.floor(amount));
  await AsyncStorage.setItem(COINS_KEY, String(next));
  notify(next);
  return true;
}
