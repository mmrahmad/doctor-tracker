import type { Redis } from 'ioredis';
import { Router } from 'express';
import type { Connection } from 'mongoose';
import { isMongoReady } from '../../infrastructure/database/mongo-connection';
import { isRedisReady } from '../../infrastructure/redis/redis-client';

/**
 * Liveness: the process is up. Readiness: it can serve traffic (MongoDB is required; Redis is
 * reported but optional because the API degrades gracefully without it).
 */
export function createHealthRouter(mongoConnection: Connection, redisClient: Redis | null): Router {
  const router = Router();

  router.get('/live', (_request, response) => {
    response.json({ data: { status: 'ok' } });
  });

  router.get('/ready', (_request, response) => {
    const mongoReady = isMongoReady(mongoConnection);
    const cacheStatus = redisClient === null ? 'disabled' : isRedisReady(redisClient) ? 'up' : 'degraded';
    response.status(mongoReady ? 200 : 503).json({
      data: { status: mongoReady ? 'ready' : 'unavailable', database: mongoReady ? 'up' : 'down', cache: cacheStatus },
    });
  });

  return router;
}
