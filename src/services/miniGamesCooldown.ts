import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/mini-games-cooldown';

type CooldownRecord = Record<string, string>; // gameKey -> 'YYYY-MM-DD'

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getRecords(): Promise<CooldownRecord> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function canPlayRewarded(gameKey: string): Promise<boolean> {
  const records = await getRecords();
  const today = getTodayString();
  return records[gameKey] !== today;
}

export async function markGamePlayed(gameKey: string): Promise<void> {
  const records = await getRecords();
  records[gameKey] = getTodayString();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function getAllGameStatuses(): Promise<Record<string, boolean>> {
  const records = await getRecords();
  const today = getTodayString();
  const gameKeys = ['wheel', 'match', 'quiz', 'cookie', 'starship', 'cup'];

  const result: Record<string, boolean> = {};
  for (const key of gameKeys) {
    result[key] = records[key] !== today; // true = oynanabilir (ödül hazır), false = bugün oynandı
  }
  return result;
}
