import type { Redis } from 'ioredis';
import type { Logger } from '../logger';
import { isRedisReady } from '../redis/redis-client';

/**
 * Minimal key-value contract the application depends on (Dependency Inversion).
 * Every method is fail-open: when the backing store is down, reads return `null` and writes are
 * skipped, so callers fall back to the database instead of failing the request.
 */
export interface KeyValueStore {
  readonly isAvailable: boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Atomically sets the key only if it does not exist. `null` means the store is unavailable. */
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean | null>;
  increment(key: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export class RedisKeyValueStore implements KeyValueStore {
  constructor(
    private readonly redisClient: Redis | null,
    private readonly logger: Logger,
  ) {}

  get isAvailable(): boolean {
    return isRedisReady(this.redisClient);
  }

  async get(key: string): Promise<string | null> {
    return this.runSafely('get', (client) => client.get(key), null);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.runSafely('set', (client) => client.set(key, value, 'EX', ttlSeconds), null);
  }

  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean | null> {
    return this.runSafely(
      'setIfAbsent',
      async (client) => (await client.set(key, value, 'EX', ttlSeconds, 'NX')) === 'OK',
      null,
    );
  }

  async increment(key: string): Promise<void> {
    await this.runSafely('increment', (client) => client.incr(key), null);
  }

  async delete(key: string): Promise<void> {
    await this.runSafely('delete', (client) => client.del(key), null);
  }

  private async runSafely<TResult, TFallback>(
    operationName: string,
    operation: (client: Redis) => Promise<TResult>,
    fallbackValue: TFallback,
  ): Promise<TResult | TFallback> {
    if (!isRedisReady(this.redisClient)) return fallbackValue;
    try {
      return await operation(this.redisClient);
    } catch (error) {
      this.logger.warn({ err: (error as Error).message, operationName }, 'Cache operation failed');
      return fallbackValue;
    }
  }
}
