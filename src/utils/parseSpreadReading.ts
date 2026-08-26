const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// JS regex /i case-folding doesn't map Turkish dotted İ to ASCII i/I, so a
// header like "ŞİMDİ" silently fails to match /simdi/i. Normalize both the
// text and the position labels before matching (same length, so indices
// still align with the original text for slicing).
const trNormalize = (value: string) => value.replace(/İ/g, 'I').replace(/ı/g, 'i');

export function parseSpreadReading(text: string, positions: string[]): string[] | null {
  const normalized = trNormalize(text);

  const markers = positions.map((position) => {
    // Colon is required: the prompt always formats headers as "LABEL:", and
    // without this, a position word used casually in the prose (e.g. "şimdi"
    // meaning "now") would be mistaken for the header and split the text wrong.
    const pattern = new RegExp(`${escapeRegExp(trNormalize(position).toUpperCase())}\\s*:`, 'i');
    const match = pattern.exec(normalized);
    return match ? { index: match.index, length: match[0].length } : null;
  });

  if (markers.some((marker) => marker === null)) return null;

  const ordered = markers
    .map((marker, positionIndex) => ({ ...(marker as { index: number; length: number }), positionIndex }))
    .sort((a, b) => a.index - b.index);

  const sections = new Array<string>(positions.length).fill('');
  ordered.forEach((marker, i) => {
    const start = marker.index + marker.length;
    const end = i + 1 < ordered.length ? ordered[i + 1].index : text.length;
    sections[marker.positionIndex] = text.slice(start, end).trim();
  });

  return sections;
}
