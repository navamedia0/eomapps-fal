import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';

export type ProfileEntry = { id: string; text: string; createdAt: string };

const MAX_SUMMARY_CHARS = 800;

async function readEntries(): Promise<ProfileEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.profileEntries);
  return raw ? (JSON.parse(raw) as ProfileEntry[]) : [];
}

async function writeEntries(entries: ProfileEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.profileEntries, JSON.stringify(entries));
}

export async function getProfileEntries(): Promise<ProfileEntry[]> {
  return readEntries();
}

export async function addProfileEntry(text: string): Promise<ProfileEntry[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Boş bir not eklenemez.');
  const entries = await readEntries();
  const next = [...entries, { id: `${Date.now()}`, text: trimmed, createdAt: new Date().toISOString() }];
  await writeEntries(next);
  return next;
}

export async function deleteProfileEntry(id: string): Promise<ProfileEntry[]> {
  const entries = await readEntries();
  const next = entries.filter((entry) => entry.id !== id);
  await writeEntries(next);
  return next;
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.profileEntries);
}

export async function getProfileSummary(): Promise<string | null> {
  const entries = await readEntries();
  if (entries.length === 0) return null;
  const joined = entries.map((entry) => entry.text).join(' ');
  return joined.length > MAX_SUMMARY_CHARS ? joined.slice(joined.length - MAX_SUMMARY_CHARS) : joined;
}
