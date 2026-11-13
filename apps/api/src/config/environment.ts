import { z } from 'zod';

const commaSeparatedList = z
  .string()
  .default('')
  .transform((rawValue) =>
    rawValue
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

const booleanFlag = z.enum(['true', 'false']).default('false').transform((flag) => flag === 'true');

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4100),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  ALLOWED_ORIGINS: commaSeparatedList,

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().optional().default(''),

  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604_800),
  COOKIE_SECURE: booleanFlag,
});

export type Environment = z.infer<typeof environmentSchema>;

export interface ApplicationConfig {
  nodeEnvironment: Environment['NODE_ENV'];
  isProduction: boolean;
  port: number;
  logLevel: Environment['LOG_LEVEL'];
  trustedProxyHops: number;
  allowedOrigins: string[];
  mongodbUri: string;
  redisUrl: string | null;
  auth: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
    secureCookies: boolean;
  };
}

/** Parses process environment once at startup and fails fast with every problem listed. */
export function loadApplicationConfig(source: NodeJS.ProcessEnv = process.env): ApplicationConfig {
  const parseResult = environmentSchema.safeParse(source);
  if (!parseResult.success) {
    const problems = parseResult.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  const environment = parseResult.data;
  return {
    nodeEnvironment: environment.NODE_ENV,
    isProduction: environment.NODE_ENV === 'production',
    port: environment.PORT,
    logLevel: environment.LOG_LEVEL,
    trustedProxyHops: environment.TRUSTED_PROXY_HOPS,
    allowedOrigins: environment.ALLOWED_ORIGINS,
    mongodbUri: environment.MONGODB_URI,
    redisUrl: environment.REDIS_URL || null,
    auth: {
      accessTokenSecret: environment.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: environment.REFRESH_TOKEN_SECRET,
      accessTokenTtlSeconds: environment.ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenTtlSeconds: environment.REFRESH_TOKEN_TTL_SECONDS,
      secureCookies: environment.COOKIE_SECURE || environment.NODE_ENV === 'production',
    },
  };
}
