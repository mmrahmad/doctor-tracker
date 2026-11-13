import mongoose from 'mongoose';
import { bootstrapApplication } from './bootstrap';

const SHUTDOWN_TIMEOUT_MS = 10_000;

/** Long-running HTTP server (local development, containers, VMs). */
async function startServer(): Promise<void> {
  const { application, infrastructure } = await bootstrapApplication();
  const { config, logger, redisClient } = infrastructure;

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
