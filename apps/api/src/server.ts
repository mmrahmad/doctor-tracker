import mongoose from 'mongoose';
import { createApplication } from './app';
import { loadApplicationConfig } from './config/environment';
import { buildContainer } from './container';
import { connectMongo } from './infrastructure/database/mongo-connection';
import { createLogger } from './infrastructure/logger';
import { connectRedis } from './infrastructure/redis/redis-client';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function startServer(): Promise<void> {
  const config = loadApplicationConfig();
  const logger = createLogger({ level: config.logLevel, prettyPrint: !config.isProduction });

  // In production, indexes are built ahead of time (`pnpm seed` syncs them) instead of on boot.
  const mongoConnection = await connectMongo(config.mongodbUri, { autoIndex: !config.isProduction, logger });
  const redisClient = await connectRedis(config.redisUrl, logger);

  const infrastructure = { config, logger, mongoConnection, redisClient };
  const application = createApplication(infrastructure, buildContainer(infrastructure));
  const httpServer = application.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}`);
  });
  // Keep-alive must outlive load balancer idle timeouts to avoid dropped connections.
  httpServer.keepAliveTimeout = 65_000;
  httpServer.headersTimeout = 66_000;

  let isShuttingDown = false;
  const shutDown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    httpServer.close(async () => {
      await Promise.allSettled([mongoose.disconnect(), redisClient?.quit()]);
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutDown('SIGTERM'));
  process.on('SIGINT', () => shutDown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ err: reason }, 'Unhandled promise rejection'));
}

startServer().catch((error: unknown) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
