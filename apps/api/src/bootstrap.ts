import type { Express } from 'express';
import { createApplication } from './app';
import { loadApplicationConfig } from './config/environment';
import { buildContainer, type InfrastructureHandles } from './container';
import { connectMongo } from './infrastructure/database/mongo-connection';
import { createLogger } from './infrastructure/logger';
import { connectRedis } from './infrastructure/redis/redis-client';

export interface BootstrappedApplication {
  application: Express;
  infrastructure: InfrastructureHandles;
}

/** Loads config, connects data stores and builds the Express app. Shared by every runtime. */
export async function bootstrapApplication(): Promise<BootstrappedApplication> {
  const config = loadApplicationConfig();
  const logger = createLogger({ level: config.logLevel, prettyPrint: !config.isProduction });

  // In production, indexes are built ahead of time (`pnpm seed` syncs them) instead of on boot.
  const mongoConnection = await connectMongo(config.mongodbUri, {
    autoIndex: !config.isProduction,
    maxPoolSize: config.mongodbMaxPoolSize,
    logger,
  });
  const redisClient = await connectRedis(config.redisUrl, logger);

  const infrastructure = { config, logger, mongoConnection, redisClient };
  return { application: createApplication(infrastructure, buildContainer(infrastructure)), infrastructure };
}
