import type { Redis } from 'ioredis';
import type { Connection } from 'mongoose';
import { enforceIdempotency } from './common/middleware/idempotency';
import { createRateLimiters } from './common/middleware/rate-limiters';
import type { ApplicationConfig } from './config/environment';
import { RedisKeyValueStore } from './infrastructure/cache/key-value-store';
import { ReadThroughCache } from './infrastructure/cache/read-through-cache';
import { MongoTransactionRunner } from './infrastructure/database/mongo-connection';
import type { Logger } from './infrastructure/logger';
import { AnalyticsController } from './modules/analytics/analytics.controller';
import { MongoAnalyticsRepository } from './modules/analytics/analytics.repository';
import { AnalyticsService } from './modules/analytics/analytics.service';
import { AuthController } from './modules/auth/auth.controller';
import { MongoRefreshSessionRepository, MongoUserRepository } from './modules/auth/auth.repositories';
import { AuthService } from './modules/auth/auth.service';
import { createAuthenticationMiddleware } from './modules/auth/authentication.middleware';
import { Argon2PasswordHasher } from './modules/auth/password-hasher';
import { SessionCookieWriter } from './modules/auth/session-cookies';
import { TokenService } from './modules/auth/token-service';
import { DoctorController } from './modules/doctors/doctor.controller';
import { MongoDoctorRepository } from './modules/doctors/doctor.repository';
import { DoctorService } from './modules/doctors/doctor.service';
import { PatientController } from './modules/patients/patient.controller';
import { MongoPatientRepository } from './modules/patients/patient.repository';
import { PatientService } from './modules/patients/patient.service';

export interface InfrastructureHandles {
  config: ApplicationConfig;
  logger: Logger;
  mongoConnection: Connection;
  redisClient: Redis | null;
}

/**
 * Composition root: the single place where concrete implementations are chosen and wired.
 * Everything else depends on interfaces, which keeps modules testable and swappable.
 */
export function buildContainer({ config, logger, mongoConnection, redisClient }: InfrastructureHandles) {
  const keyValueStore = new RedisKeyValueStore(redisClient, logger);
  const readThroughCache = new ReadThroughCache(keyValueStore, logger);
  const transactionRunner = new MongoTransactionRunner(mongoConnection);

  const tokenService = new TokenService(config.auth);
  const authService = new AuthService(
    new MongoUserRepository(),
    new MongoRefreshSessionRepository(),
    new Argon2PasswordHasher(),
    tokenService,
    config.auth.refreshTokenTtlSeconds,
    logger,
  );
  const sessionCookieWriter = new SessionCookieWriter({
    secureCookies: config.auth.secureCookies,
    accessTokenTtlSeconds: config.auth.accessTokenTtlSeconds,
    refreshTokenTtlSeconds: config.auth.refreshTokenTtlSeconds,
  });

  const doctorRepository = new MongoDoctorRepository();
  const doctorService = new DoctorService(doctorRepository, readThroughCache);
  const patientService = new PatientService(
    new MongoPatientRepository(),
    doctorRepository,
    doctorService,
    transactionRunner,
    readThroughCache,
  );
  const analyticsService = new AnalyticsService(new MongoAnalyticsRepository(), readThroughCache);

  return {
    controllers: {
      auth: new AuthController(authService, sessionCookieWriter),
      doctors: new DoctorController(doctorService),
      patients: new PatientController(patientService),
      analytics: new AnalyticsController(analyticsService),
    },
    middleware: {
      authenticate: createAuthenticationMiddleware(tokenService),
      idempotency: enforceIdempotency(keyValueStore),
      rateLimiters: createRateLimiters(redisClient),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
