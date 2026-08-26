import dreamDictionary from '@/data/dream_dictionary.json';
import freudSymbols from '@/data/freud_symbols.json';

export type DreamEntry = { tr_keywords: string[]; meaning: string };
export type DreamSource = 'folk' | 'psychoanalytic';
export type DreamMatch = { word: string; meaning: string; source: DreamSource };

const FOLK_ENTRIES: Record<string, DreamEntry | string> = dreamDictionary;
const FREUD_ENTRIES: Record<string, DreamEntry | string> = freudSymbols;

const normalize = (value: string): string => value.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü\s]/gi, ' ');

const MIN_SUBSTRING_LENGTH = 4;

function keywordMatches(normalizedText: string, keyword: string): boolean {
  const normalizedKeyword = keyword.toLocaleLowerCase('tr');
  if (normalizedKeyword.length >= MIN_SUBSTRING_LENGTH) {
    return normalizedText.includes(normalizedKeyword);
  }
  // Short keywords (e.g. "ok", "ün") need word boundaries to avoid matching inside unrelated words.
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(normalizedText);
}

function searchEntries(
  normalized: string,
  entries: Record<string, DreamEntry | string>,
  source: DreamSource,
  limit: number,
): DreamMatch[] {
  const matches: DreamMatch[] = [];
  for (const [word, entry] of Object.entries(entries)) {
    if (typeof entry === 'string') continue;
    const hit = entry.tr_keywords.some((keyword) => keywordMatches(normalized, keyword));
    if (hit) matches.push({ word, meaning: entry.meaning, source });
    if (matches.length >= limit) break;
  }
  return matches;
}

export function findDreamMatches(text: string, folkLimit = 5, freudLimit = 3): DreamMatch[] {
  const normalized = normalize(text);
  if (!normalized.trim()) return [];

  return [
    ...searchEntries(normalized, FOLK_ENTRIES, 'folk', folkLimit),
    ...searchEntries(normalized, FREUD_ENTRIES, 'psychoanalytic', freudLimit),
  ];
}
