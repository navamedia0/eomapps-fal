import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mistik-rehber/mood-journal';

export type MoodEntry = { id: string; mood: string; note: string; createdAt: string };

async function readEntries(): Promise<MoodEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeEntries(entries: MoodEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getMoodEntries(): Promise<MoodEntry[]> {
  const entries = await readEntries();
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addMoodEntry(mood: string, note: string): Promise<MoodEntry[]> {
  const entries = await readEntries();
  const entry: MoodEntry = { id: `${Date.now()}`, mood, note: note.trim(), createdAt: new Date().toISOString() };
  const next = [...entries, entry];
  await writeEntries(next);
  return getMoodEntries();
}

export async function deleteMoodEntry(id: string): Promise<MoodEntry[]> {
  const entries = await readEntries();
  const next = entries.filter((entry) => entry.id !== id);
  await writeEntries(next);
  return getMoodEntries();
}
