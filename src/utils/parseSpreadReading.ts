const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Turkish uppercase normalization
const trNormalize = (value: string) =>
  value
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');

// Extract keywords from position label to match AI headings even if AI slightly rephrased or omitted sub-titles
function getSearchVariants(position: string): string[] {
  const clean = position.replace(/[()]/g, '').trim();
  const variants = [clean];
  if (position.includes('/')) {
    variants.push(...position.split('/').map((s) => s.trim()));
  }
  if (position.includes('(')) {
    const main = position.split('(')[0].trim();
    variants.push(main);
    const inside = position.match(/\((.*?)\)/)?.[1]?.trim();
    if (inside) variants.push(inside);
  }
  return [...new Set(variants)].filter((v) => v.length >= 3);
}

export function parseSpreadReading(text: string, positions: string[]): string[] {
  if (!text || !text.trim()) {
    return positions.map(() => '');
  }

  // Strip markdown bolding and headings for clean marker search
  const cleanText = text.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '');
  const normalized = trNormalize(cleanText);

  // Strategy 1: Find position headers with flexible prefix (e.g. "1. GEÇMİŞ:", "**GEÇMİŞ:**", "GEÇMİŞ:")
  const markers = positions.map((position, posIdx) => {
    const searchVariants = getSearchVariants(position);
    for (const variant of searchVariants) {
      const normVariant = trNormalize(variant);
      // Look for optional number prefix e.g. "1. ", "1- ", followed by title and colon/dash
      const pattern = new RegExp(
        `(?:^|\\n)\\s*(?:\\d+[\\.\\-\\)]\\s*)?${escapeRegExp(normVariant)}\\s*[:\\-]`,
        'i'
      );
      const match = pattern.exec(normalized);
      if (match) {
        return { index: match.index, length: match[0].length, posIdx };
      }
    }
    return null;
  });

  const validMarkers = markers
    .filter((m): m is { index: number; length: number; posIdx: number } => m !== null)
    .sort((a, b) => a.index - b.index);

  // If we matched at least 2 headers or most headers, split by found markers
  if (validMarkers.length >= Math.min(2, positions.length)) {
    const sections = new Array<string>(positions.length).fill('');
    validMarkers.forEach((marker, i) => {
      const start = marker.index + marker.length;
      const end = i + 1 < validMarkers.length ? validMarkers[i + 1].index : cleanText.length;
      sections[marker.posIdx] = cleanText.slice(start, end).trim();
    });

    // Fill any missing section with fallback text from neighboring content or general body
    return sections.map((s, idx) => s || `Bu kartın enerjisi açılımın geneliyle ve kadersel akışla uyum içinde rezone ediyor.`);
  }

  // Strategy 2: Split by numbered headers (1., 2., 3., 4., etc.)
  const numberedPattern = /(?:^|\n)\s*(\d+)[\.\-\)]\s*([^:\n]+)[:\-]\s*/g;
  const numMatches = [...cleanText.matchAll(numberedPattern)];
  if (numMatches.length >= Math.min(2, positions.length)) {
    const sections = new Array<string>(positions.length).fill('');
    numMatches.forEach((match, i) => {
      if (i < positions.length) {
        const start = (match.index ?? 0) + match[0].length;
        const end = i + 1 < numMatches.length ? numMatches[i + 1].index ?? cleanText.length : cleanText.length;
        sections[i] = cleanText.slice(start, end).trim();
      }
    });
    return sections.map((s) => s || cleanText.slice(0, 300).trim());
  }

  // Strategy 3: Paragraph splitting fallback (always guarantee valid string[] with length === positions.length)
  const paragraphs = cleanText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length >= positions.length) {
    return paragraphs.slice(0, positions.length);
  }

  // Final guaranteed fallback
  const resultList = new Array<string>(positions.length).fill('');
  positions.forEach((_, idx) => {
    resultList[idx] = paragraphs[idx] || cleanText.trim();
  });
  return resultList;
}
