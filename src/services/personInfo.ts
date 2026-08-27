import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonInfo } from '@/types/personInfo';

const STORAGE_KEY = '@mistik_person_info';

export async function getSavedPersonInfo(): Promise<PersonInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePersonInfo(info: PersonInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // ignore
  }
}
