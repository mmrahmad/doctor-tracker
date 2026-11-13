/**
 * Index-friendly text search.
 *
 * Each searchable document stores `searchKeywords`: normalized words, the full normalized name and
 * the email. Queries use an anchored, case-normalized prefix regex (`^term`) on that multikey field,
 * which MongoDB answers with a bounded index scan instead of a collection scan — so search stays
 * fast as collections grow to millions of documents.
 */

const DIACRITIC_MARKS = /\p{Diacritic}/gu;
const WHITESPACE_RUNS = /\s+/g;
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

export function normalizeSearchText(rawText: string): string {
  return rawText
    .normalize('NFKD')
    .replace(DIACRITIC_MARKS, '')
    .toLowerCase()
    .replace(WHITESPACE_RUNS, ' ')
    .trim();
}

export function escapeRegularExpression(literalText: string): string {
  return literalText.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}

export function buildSearchKeywords(...searchableValues: string[]): string[] {
  const keywords = new Set<string>();
  for (const value of searchableValues) {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue) continue;
    keywords.add(normalizedValue);
    for (const word of normalizedValue.split(' ')) keywords.add(word);
  }
  return [...keywords];
}

/** Returns a filter fragment for `searchKeywords`, or an empty object when there is no term. */
export function buildKeywordPrefixFilter(searchTerm: string | undefined): Record<string, unknown> {
  const normalizedTerm = searchTerm ? normalizeSearchText(searchTerm) : '';
  if (!normalizedTerm) return {};
  return { searchKeywords: { $regex: `^${escapeRegularExpression(normalizedTerm)}` } };
}
