import { Redis } from 'ioredis';
import type { Logger } from '../logger';

const MAX_RECONNECT_DELAY_MS = 5_000;

/**
 * Creates a Redis client tuned to fail fast: commands never queue while disconnected, so a Redis
 * outage degrades to cache misses instead of hanging requests. Reconnects in the background.
 * Returns `null` when Redis is not configured.
 */
export async function connectRedis(redisUrl: string | null, logger: Logger): Promise<Redis | null> {
  if (!redisUrl) {
    logger.warn('REDIS_URL not set — running without cache, shared rate limits or idempotency');
    return null;
  }

  const redisClient = new Redis(redisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 500,
    retryStrategy: (attemptNumber) => Math.min(attemptNumber * 250, MAX_RECONNECT_DELAY_MS),
  });

  redisClient.on('ready', () => logger.info('Redis connected'));
  redisClient.on('error', (error) => logger.warn({ err: error.message }, 'Redis error'));

  try {
    await redisClient.connect();
  } catch (error) {
    logger.warn(
      { err: (error as Error).message },
      'Redis unavailable at startup — continuing without cache; will keep retrying',
    );
  }
  return redisClient;
}

export function isRedisReady(redisClient: Redis | null): redisClient is Redis {
  return redisClient?.status === 'ready';
}
