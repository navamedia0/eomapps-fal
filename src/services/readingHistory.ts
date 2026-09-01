import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReadingHistoryType =
  | 'all'
  | 'kahve'
  | 'tarot'
  | 'katina'
  | 'el'
  | 'yuz'
  | 'sufal'
  | 'wax'
  | 'iskambil'
  | 'angel'
  | 'bakla'
  | 'lenormand'
  | 'rune'
  | 'iching'
  | 'osho_zen'
  | 'thoth'
  | 'sesli'
  | 'ruya'
  | 'dogumHaritasi'
  | 'solitaire';

export type ReadingHistoryEntry = {
  id: string;
  type: ReadingHistoryType;
  title: string;
  result: string;
  createdAt: number;
  metadata?: any;
};

const STORAGE_KEY = '@mistik-rehber/reading-history';
const MAX_PER_TYPE = 100;

async function readAll(): Promise<ReadingHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeAll(entries: ReadingHistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export async function getReadingHistory(type?: ReadingHistoryType): Promise<ReadingHistoryEntry[]> {
  const entries = await readAll();
  const filtered = type && type !== 'all' ? entries.filter((entry) => entry.type === type) : entries;
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveReadingHistory(entry: Omit<ReadingHistoryEntry, 'id' | 'createdAt'>): Promise<void> {
  const entries = await readAll();
  const sameType = entries.filter((e) => e.type === entry.type);
  const others = entries.filter((e) => e.type !== entry.type);
  const next = [...sameType, { ...entry, id: `${entry.type}-${Date.now()}`, createdAt: Date.now() }]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_PER_TYPE);
  await writeAll([...others, ...next]);
}

export async function deleteReadingHistoryEntry(id: string): Promise<void> {
  const entries = await readAll();
  await writeAll(entries.filter((entry) => entry.id !== id));
}

export async function clearReadingHistory(type: ReadingHistoryType): Promise<void> {
  const entries = await readAll();
  if (type === 'all') {
    await writeAll([]);
  } else {
    await writeAll(entries.filter((entry) => entry.type !== type));
  }
}
