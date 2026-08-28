import data from '@/data/cay_yapragi_fali_sembolleri.json';

type SymbolMap = Record<string, string>;

function formatCategory(entries: SymbolMap): string {
  return Object.entries(entries)
    .map(([symbol, meaning]) => `${symbol.replace(/_/g, ' ')}: ${meaning}`)
    .join('; ');
}

// İngiliz/Doğu Avrupa tasseografi geleneğine özgü sembol sözlüğü — Türk kahve
// falından (kahveSymbols) kasıtlı olarak ayrı tutulur, çünkü iki gelenek
// farklı sembol dağarcığı ve okuma yöntemi kullanır.
export function getTeaLeafSymbolGlossary(): string {
  return Object.entries(data)
    .filter(([key]) => key !== '_source')
    .map(([, value]) => formatCategory(value as SymbolMap))
    .join('\n');
}
