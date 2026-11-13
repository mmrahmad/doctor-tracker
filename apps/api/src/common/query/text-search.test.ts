import { describe, expect, it } from 'vitest';
import {
  buildKeywordPrefixFilter,
  buildSearchKeywords,
  escapeRegularExpression,
  normalizeSearchText,
} from './text-search';

describe('normalizeSearchText', () => {
  it('lower-cases, strips accents and collapses whitespace', () => {
    expect(normalizeSearchText('  José   ÁLVAREZ ')).toBe('jose alvarez');
  });
});

describe('buildSearchKeywords', () => {
  it('indexes every word plus the full value so both first and last names are searchable', () => {
    expect(buildSearchKeywords('Ada Lovelace', 'ada@example.com')).toEqual([
      'ada lovelace',
      'ada',
      'lovelace',
      'ada@example.com',
    ]);
  });
});

describe('buildKeywordPrefixFilter', () => {
  it('returns no filter for blank terms', () => {
    expect(buildKeywordPrefixFilter(undefined)).toEqual({});
    expect(buildKeywordPrefixFilter('   ')).toEqual({});
  });

  it('builds an anchored, escaped prefix regex so it can use the index and cannot be abused', () => {
    expect(buildKeywordPrefixFilter('Dr. (A')).toEqual({ searchKeywords: { $regex: '^dr\\. \\(a' } });
  });
});

describe('escapeRegularExpression', () => {
  it('escapes every regex metacharacter', () => {
    expect(escapeRegularExpression('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });
});
