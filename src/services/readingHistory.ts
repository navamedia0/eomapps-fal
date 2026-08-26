import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReadingHistoryType = 'kahve' | 'el' | 'tarot' | 'katina' | 'sesli' | 'solitaire';

export type ReadingHistoryEntry = {
  id: string;
  type: ReadingHistoryType;
  title: string;
  result: string;
  createdAt: number;
};

const STORAGE_KEY = '@mistik-rehber/reading-history';
// Purely local (AsyncStorage / device storage) — never uploaded anywhere.
// No time-based expiry (most fal apps keep history indefinitely so people
// can revisit old readings), but each type is capped so storage can't grow
// unbounded — oldest entries past the cap are dropped silently.
const MAX_PER_TYPE = 100;

async function readAll(): Promise<ReadingHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(entries: ReadingHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getReadingHistory(type?: ReadingHistoryType): Promise<ReadingHistoryEntry[]> {
  const entries = await readAll();
  const filtered = type ? entries.filter((entry) => entry.type === type) : entries;
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
  await writeAll(entries.filter((entry) => entry.type !== type));
}
