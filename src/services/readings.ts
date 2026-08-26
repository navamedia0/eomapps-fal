import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';

export type Reading = { id: string; type: string; question?: string; result: string; createdAt: string };

export async function saveReading(reading: Omit<Reading, 'id' | 'createdAt'>): Promise<Reading> {
  const item: Reading = { ...reading, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() };
  const history = await listReadings();
  await AsyncStorage.setItem(STORAGE_KEYS.readings, JSON.stringify([item, ...history]));
  return item;
}

export async function listReadings(): Promise<Reading[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.readings);
  return raw ? JSON.parse(raw) as Reading[] : [];
}

export async function deleteReading(id: string): Promise<void> {
  const history = (await listReadings()).filter((reading) => reading.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.readings, JSON.stringify(history));
}