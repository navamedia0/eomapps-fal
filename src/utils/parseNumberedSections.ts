export type ReadingSection = { title: string; body: string };

// Tolerant of how models actually format these headers in practice — plain
// "1. BAŞLIK:", markdown-bold "**1. BAŞLIK:**" or "1. **BAŞLIK:**", and
// markdown headings "### 1. BAŞLIK:" all match the same way.
const HEADER_PATTERN = /(?:^|\n)[#\s*_]*(\d+)\.\s*\**\s*([^:\n*_]+?)\s*\**:\s*\**\s*/g;

// All 13 "Detaylı" prompts instruct the model to use exactly 4 ALL-CAPS
// Turkish headers (e.g. "GÖK VE YERİN DENGESİ..."). Models sometimes also
// improvise their own numbered sub-lists inside a section's body (e.g.
// "1. Çizgi: ..." while walking through changing lines) — those are regular
// Title Case, not shouty, so filtering on case tells real section headers
// apart from incidental numbered text without ever touching the prompts.
function isShoutyHeader(title: string): boolean {
  const letters = title.replace(/[^\p{L}]/gu, '');
  if (letters.length < 3) return false;
  const upperCount = [...letters].filter((ch) => ch === ch.toLocaleUpperCase('tr') && ch !== ch.toLocaleLowerCase('tr')).length;
  return upperCount / letters.length >= 0.8;
}

// Splits an AI reading response that follows the app's "TAM OLARAK şu 4 ana
// başlıkla yapılandır: 1. BAŞLIK: ... 2. BAŞLIK: ..." prompt convention into
// separate {title, body} sections — purely by scanning the text the model
// already returns, no prompt changes involved. Returns null if the text
// doesn't contain at least two numbered headers (e.g. "Standart" mode, which
// is a single short paragraph and doesn't need card-splitting).
export function parseNumberedSections(text: string): ReadingSection[] | null {
  const matches = [...text.matchAll(HEADER_PATTERN)].filter((m) => isShoutyHeader(m[2]));
  if (matches.length < 2) return null;

  return matches.map((match, i) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    return { title: match[2].trim(), body: text.slice(start, end).trim() };
  });
}
