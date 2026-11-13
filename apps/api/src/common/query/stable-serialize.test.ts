import { describe, expect, it } from 'vitest';
import { fingerprint, stableSerialize } from './stable-serialize';

describe('stableSerialize', () => {
  it('produces the same output regardless of key order', () => {
    expect(stableSerialize({ page: 1, search: 'ada' })).toBe(stableSerialize({ search: 'ada', page: 1 }));
  });

  it('ignores undefined values so optional filters do not fragment the cache', () => {
    expect(fingerprint({ page: 1, search: undefined })).toBe(fingerprint({ page: 1 }));
  });
});
