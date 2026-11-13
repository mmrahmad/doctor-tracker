import { fingerprint } from '../../common/query/stable-serialize';
import type { Logger } from '../logger';
import type { KeyValueStore } from './key-value-store';

export const CACHE_NAMESPACES = ['doctors', 'patients', 'analytics'] as const;
export type CacheNamespace = (typeof CACHE_NAMESPACES)[number];

const KEY_PREFIX = 'doctor-tracker';

/**
 * Cache-aside reads with three properties needed at scale:
 *
 * 1. **Versioned namespaces** — keys embed a namespace version; invalidating every cached page of a
 *    namespace is a single `INCR`, never a `KEYS`/`SCAN` sweep.
 * 2. **Request coalescing** — concurrent misses for the same key in one process share a single
 *    database load (protects the database from cache stampedes).
 * 3. **Fail-open** — if the store is unavailable, data is loaded straight from the database.
 */
export class ReadThroughCache {
  private readonly inFlightLoads = new Map<string, Promise<unknown>>();

  constructor(
    private readonly keyValueStore: KeyValueStore,
    private readonly logger: Logger,
  ) {}

  async getOrLoad<TValue>(
    namespace: CacheNamespace,
    keyParts: unknown,
    ttlSeconds: number,
    loadValue: () => Promise<TValue>,
  ): Promise<TValue> {
    const cacheKey = await this.buildVersionedKey(namespace, keyParts);

    const cachedPayload = await this.keyValueStore.get(cacheKey);
    if (cachedPayload !== null) {
      try {
        return JSON.parse(cachedPayload) as TValue;
      } catch {
        this.logger.warn({ cacheKey }, 'Discarding unreadable cache entry');
      }
    }

    const existingLoad = this.inFlightLoads.get(cacheKey);
    if (existingLoad) return existingLoad as Promise<TValue>;

    const load = (async () => {
      const freshValue = await loadValue();
      await this.keyValueStore.set(cacheKey, JSON.stringify(freshValue), ttlSeconds);
      return freshValue;
    })().finally(() => this.inFlightLoads.delete(cacheKey));

    this.inFlightLoads.set(cacheKey, load);
    return load;
  }

  async invalidate(...namespaces: CacheNamespace[]): Promise<void> {
    await Promise.all(
      namespaces.map((namespace) => this.keyValueStore.increment(this.versionKey(namespace))),
    );
  }

  private async buildVersionedKey(namespace: CacheNamespace, keyParts: unknown): Promise<string> {
    const namespaceVersion = (await this.keyValueStore.get(this.versionKey(namespace))) ?? '0';
    return `${KEY_PREFIX}:cache:${namespace}:v${namespaceVersion}:${fingerprint(keyParts)}`;
  }

  private versionKey(namespace: CacheNamespace): string {
    return `${KEY_PREFIX}:cache-version:${namespace}`;
  }
}
