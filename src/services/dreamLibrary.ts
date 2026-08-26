import data from '@/data/ruya_kitapligi.json';

export type DreamLibraryEntry = {
  id: string;
  title: string;
  category: string;
  popular: boolean;
  summary: string;
  content: string;
};

const ENTRIES: DreamLibraryEntry[] = data.entries;

export function getDreamLibraryEntries(): DreamLibraryEntry[] {
  return ENTRIES;
}

export function getPopularDreamEntries(): DreamLibraryEntry[] {
  return ENTRIES.filter((entry) => entry.popular);
}

export function getDreamLibraryCategories(): string[] {
  return [...new Set(ENTRIES.map((entry) => entry.category))];
}
