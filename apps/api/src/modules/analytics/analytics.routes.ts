import { Router } from 'express';
import type { AnalyticsController } from './analytics.controller';

export function createAnalyticsRouter(analyticsController: AnalyticsController): Router {
  const router = Router();
  router.get('/overview', analyticsController.getOverview);
  return router;
}
