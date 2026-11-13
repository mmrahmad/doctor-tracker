import { pino } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStore } from './key-value-store';
import { ReadThroughCache } from './read-through-cache';

const silentLogger = pino({ level: 'silent' });

class InMemoryKeyValueStore implements KeyValueStore {
  readonly entries = new Map<string, string>();
  isAvailable = true;

  async get(key: string) {
    return this.isAvailable ? (this.entries.get(key) ?? null) : null;
  }
  async set(key: string, value: string) {
    if (this.isAvailable) this.entries.set(key, value);
  }
  async setIfAbsent(key: string, value: string) {
    if (!this.isAvailable) return null;
    if (this.entries.has(key)) return false;
    this.entries.set(key, value);
    return true;
  }
  async increment(key: string) {
    if (this.isAvailable) this.entries.set(key, String(Number(this.entries.get(key) ?? 0) + 1));
  }
  async delete(key: string) {
    this.entries.delete(key);
  }
}

describe('ReadThroughCache', () => {
  it('serves repeated reads from cache', async () => {
    const cache = new ReadThroughCache(new InMemoryKeyValueStore(), silentLogger);
    const loadValue = vi.fn().mockResolvedValue({ total: 3 });

    await cache.getOrLoad('doctors', ['list', { page: 1 }], 30, loadValue);
    const secondRead = await cache.getOrLoad('doctors', ['list', { page: 1 }], 30, loadValue);

    expect(secondRead).toEqual({ total: 3 });
    expect(loadValue).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent misses for the same key into a single load', async () => {
    const cache = new ReadThroughCache(new InMemoryKeyValueStore(), silentLogger);
    const loadValue = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'value';
    });

    await Promise.all(Array.from({ length: 20 }, () => cache.getOrLoad('patients', 'key', 30, loadValue)));
    expect(loadValue).toHaveBeenCalledTimes(1);
  });

  it('reloads after the namespace is invalidated', async () => {
    const cache = new ReadThroughCache(new InMemoryKeyValueStore(), silentLogger);
    const loadValue = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');

    await cache.getOrLoad('analytics', 'overview', 30, loadValue);
    await cache.invalidate('analytics');

    expect(await cache.getOrLoad('analytics', 'overview', 30, loadValue)).toBe('new');
  });

  it('falls back to the loader when the store is unavailable', async () => {
    const unavailableStore = new InMemoryKeyValueStore();
    unavailableStore.isAvailable = false;
    const cache = new ReadThroughCache(unavailableStore, silentLogger);
    const loadValue = vi.fn().mockResolvedValue('from-database');

    expect(await cache.getOrLoad('doctors', 'key', 30, loadValue)).toBe('from-database');
    expect(await cache.getOrLoad('doctors', 'key', 30, loadValue)).toBe('from-database');
    expect(loadValue).toHaveBeenCalledTimes(2);
  });
});
