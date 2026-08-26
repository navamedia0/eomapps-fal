import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/coins';

export async function getCoins(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? Number(raw) : 0;
}

export async function addCoins(amount: number): Promise<number> {
  const current = await getCoins();
  const next = current + amount;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export async function spendCoins(amount: number): Promise<boolean> {
  const current = await getCoins();
  if (current < amount) return false;
  await AsyncStorage.setItem(STORAGE_KEY, String(current - amount));
  return true;
}
