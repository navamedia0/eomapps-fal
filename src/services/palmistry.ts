import data from '@/data/el_fali_sozlugu.json';

type SymbolMap = Record<string, string>;

function formatCategory(entries: SymbolMap): string {
  return Object.entries(entries)
    .map(([symbol, meaning]) => `${symbol.replace(/_/g, ' ')}: ${meaning}`)
    .join('; ');
}

export function getPalmistryGlossary(): string {
  return Object.entries(data)
    .filter(([key]) => key !== '_source')
    .map(([, value]) => formatCategory(value as SymbolMap))
    .join('\n');
}
