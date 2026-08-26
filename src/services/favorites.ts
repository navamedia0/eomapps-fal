import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/favorites';

export type FavoriteKind = 'quote' | 'info';

export type FavoriteEntry = {
  id: string;
  kind: FavoriteKind;
  title?: string;
  body: string;
  category?: string;
  savedAt: number;
};

async function readAll(): Promise<FavoriteEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(entries: FavoriteEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getFavorites(): Promise<FavoriteEntry[]> {
  const entries = await readAll();
  return entries.sort((a, b) => b.savedAt - a.savedAt);
}

export async function isFavorited(id: string): Promise<boolean> {
  const entries = await readAll();
  return entries.some((entry) => entry.id === id);
}

export async function addFavorite(entry: Omit<FavoriteEntry, 'savedAt'>): Promise<void> {
  const entries = await readAll();
  if (entries.some((existing) => existing.id === entry.id)) return;
  entries.push({ ...entry, savedAt: Date.now() });
  await writeAll(entries);
}

export async function removeFavorite(id: string): Promise<void> {
  const entries = await readAll();
  await writeAll(entries.filter((entry) => entry.id !== id));
}
