import data from '@/data/kahve_fali_sembolleri.json';

type SymbolMap = Record<string, string>;

function formatCategory(entries: SymbolMap): string {
  return Object.entries(entries)
    .map(([symbol, meaning]) => `${symbol.replace(/_/g, ' ')}: ${meaning}`)
    .join('; ');
}

export function getCoffeeSymbolGlossary(): string {
  return Object.entries(data)
    .filter(([key]) => key !== '_source')
    .map(([, value]) => formatCategory(value as SymbolMap))
    .join('\n');
}
