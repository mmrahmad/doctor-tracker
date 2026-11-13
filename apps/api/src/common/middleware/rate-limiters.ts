import type { ApiErrorBody } from '@doctor-tracker/contracts';
import { rateLimit, type Options, type Store } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { isRedisReady } from '../../infrastructure/redis/redis-client';

interface RateLimitPolicy {
  name: string;
  windowMs: number;
  maxRequestsPerWindow: number;
  message: string;
  keyGenerator?: Options['keyGenerator'];
}

/**
 * Uses a Redis-backed store so limits are shared by every API instance. Falls back to the
 * in-memory store if Redis is unavailable at startup, and `passOnStoreError` keeps serving traffic
 * if Redis fails later (availability over strict limiting).
 */
function createRateLimitStore(redisClient: Redis | null, policyName: string): Store | undefined {
  if (!isRedisReady(redisClient)) return undefined;
  return new RedisStore({
    prefix: `doctor-tracker:rate-limit:${policyName}:`,
    sendCommand: (command: string, ...commandArguments: string[]) =>
      redisClient.call(command, ...commandArguments) as Promise<RedisReply>,
  });
}

function createRateLimiter(redisClient: Redis | null, policy: RateLimitPolicy) {
  const responseBody: ApiErrorBody = { error: { code: 'RATE_LIMITED', message: policy.message } };
  const store = createRateLimitStore(redisClient, policy.name);
  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.maxRequestsPerWindow,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    passOnStoreError: true,
    message: responseBody,
    ...(store ? { store } : {}),
    ...(policy.keyGenerator ? { keyGenerator: policy.keyGenerator } : {}),
  });
}

export function createRateLimiters(redisClient: Redis | null) {
  return {
    generalApi: createRateLimiter(redisClient, {
      name: 'api',
      windowMs: 60_000,
      maxRequestsPerWindow: 600,
      message: 'Too many requests. Please slow down.',
    }),
    login: createRateLimiter(redisClient, {
      name: 'login',
      windowMs: 15 * 60_000,
      maxRequestsPerWindow: 20,
      message: 'Too many sign-in attempts. Please wait a few minutes.',
    }),
    tokenRefresh: createRateLimiter(redisClient, {
      name: 'refresh',
      windowMs: 60_000,
      maxRequestsPerWindow: 60,
      message: 'Too many session refreshes.',
    }),
  };
}
