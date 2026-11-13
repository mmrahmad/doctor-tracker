import { API_BASE_PATH } from '@doctor-tracker/contracts';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { handleErrors, handleRouteNotFound } from './common/middleware/error-handler';
import { requireAllowedOrigin } from './common/middleware/require-allowed-origin';
import type { Container, InfrastructureHandles } from './container';
import { createAnalyticsRouter } from './modules/analytics/analytics.routes';
import { createAuthRouter } from './modules/auth/auth.routes';
import { authorizeRoles } from './modules/auth/authentication.middleware';
import { createDoctorRouter } from './modules/doctors/doctor.routes';
import { createHealthRouter } from './modules/health/health.routes';
import { createPatientRouter } from './modules/patients/patient.routes';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const MAX_JSON_BODY_SIZE = '100kb';

export function createApplication(infrastructure: InfrastructureHandles, container: Container): Express {
  const { config, logger, mongoConnection, redisClient } = infrastructure;
  const { controllers, middleware } = container;
  const application = express();

  application.disable('x-powered-by');
  application.set('trust proxy', config.trustedProxyHops);

  application.use(
    pinoHttp({
      logger,
      genReqId: (request, response) => {
        const incomingRequestId = request.headers['x-request-id'];
        const requestId =
          typeof incomingRequestId === 'string' && REQUEST_ID_PATTERN.test(incomingRequestId)
            ? incomingRequestId
            : randomUUID();
        response.setHeader('X-Request-Id', requestId);
        return requestId;
      },
      customLogLevel: (_request, response, error) =>
        error || response.statusCode >= 500 ? 'error' : response.statusCode >= 400 ? 'warn' : 'info',
      autoLogging: { ignore: (request) => request.url?.startsWith(`${API_BASE_PATH}/health`) ?? false },
    }),
  );
  application.use(helmet());
  application.use(
    cors({
      origin: (requestOrigin, callback) =>
        callback(null, !requestOrigin || config.allowedOrigins.includes(requestOrigin)),
      credentials: true,
    }),
  );
  application.use(compression());
  application.use(express.json({ limit: MAX_JSON_BODY_SIZE }));
  application.use(cookieParser());
  // Responses are user-specific: never stored by shared caches, always revalidated via ETag.
  application.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'private, no-cache');
    next();
  });

  application.use(`${API_BASE_PATH}/health`, createHealthRouter(mongoConnection, redisClient));

  application.use(API_BASE_PATH, middleware.rateLimiters.generalApi, requireAllowedOrigin(config.allowedOrigins));
  application.use(
    `${API_BASE_PATH}/auth`,
    createAuthRouter({
      authController: controllers.auth,
      authenticate: middleware.authenticate,
      loginRateLimiter: middleware.rateLimiters.login,
      tokenRefreshRateLimiter: middleware.rateLimiters.tokenRefresh,
    }),
  );

  const adminOnly = [middleware.authenticate, authorizeRoles('admin')];
  application.use(
    `${API_BASE_PATH}/doctors`,
    ...adminOnly,
    createDoctorRouter({
      doctorController: controllers.doctors,
      patientController: controllers.patients,
      idempotency: middleware.idempotency,
    }),
  );
  application.use(`${API_BASE_PATH}/patients`, ...adminOnly, createPatientRouter(controllers.patients));
  application.use(`${API_BASE_PATH}/analytics`, ...adminOnly, createAnalyticsRouter(controllers.analytics));

  application.use(handleRouteNotFound);
  application.use(handleErrors);
  return application;
}
