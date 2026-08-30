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
      // Look for optional number prefix e.g. "1. ", "1- ", followed by title and colon/dash.
      // The gap before the colon/dash is intentionally NOT restricted to whitespace only —
      // position labels like "6. Yaklaşan Gelecek (Sağ)" get their parenthetical part
      // reproduced by the AI right before the colon (e.g. "...GELECEK (SAĞ):"), and a
      // \s*-only gap would never match that, silently dropping the section.
      const pattern = new RegExp(
        `(?:^|\\n)\\s*(?:\\d+[\\.\\-\\)]\\s*)?${escapeRegExp(normVariant)}[^\\n]*?[:\\-]`,
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

  // Only commit to this strategy if EVERY position found its own header — a partial
  // match used to get "rescued" with an identical canned sentence for the missing
  // slots (indistinguishable from a real answer, but repeated verbatim across cards).
  // Falling through to Strategy 2 instead gives every remaining position a real,
  // if less precisely bounded, chunk of the actual AI text.
  if (validMarkers.length === positions.length) {
    const sections = new Array<string>(positions.length).fill('');
    validMarkers.forEach((marker, i) => {
      const start = marker.index + marker.length;
      const end = i + 1 < validMarkers.length ? validMarkers[i + 1].index : cleanText.length;
      sections[marker.posIdx] = cleanText.slice(start, end).trim();
    });
    return sections;
  }

  // Strategy 2: Split by numbered headers (1., 2., 3., 4., etc.) — generic, doesn't
  // care what each header's text says, so it's immune to the parenthetical-mismatch
  // bug above. Same "all or nothing" rule: a partial match here would otherwise repeat
  // the same 300-char slice of raw text across every unmatched card.
  const numberedPattern = /(?:^|\n)\s*(\d+)[\.\-\)]\s*([^:\n]+)[:\-]\s*/g;
  const numMatches = [...cleanText.matchAll(numberedPattern)];
  if (numMatches.length === positions.length) {
    const sections = new Array<string>(positions.length).fill('');
    numMatches.forEach((match, i) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = i + 1 < numMatches.length ? numMatches[i + 1].index ?? cleanText.length : cleanText.length;
      sections[i] = cleanText.slice(start, end).trim();
    });
    return sections;
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
