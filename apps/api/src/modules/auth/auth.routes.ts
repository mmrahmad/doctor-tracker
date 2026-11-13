import { Router, type RequestHandler } from 'express';
import type { AuthController } from './auth.controller';

export interface AuthRouterDependencies {
  authController: AuthController;
  authenticate: RequestHandler;
  loginRateLimiter: RequestHandler;
  tokenRefreshRateLimiter: RequestHandler;
}

export function createAuthRouter({
  authController,
  authenticate,
  loginRateLimiter,
  tokenRefreshRateLimiter,
}: AuthRouterDependencies): Router {
  const router = Router();
  router.post('/login', loginRateLimiter, authController.login);
  router.post('/refresh', tokenRefreshRateLimiter, authController.refresh);
  router.post('/logout', authController.logout);
  router.get('/me', authenticate, authController.getCurrentUser);
  return router;
}
