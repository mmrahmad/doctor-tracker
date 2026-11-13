import { pino, type Logger } from 'pino';

export type { Logger };

const REDACTED_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.refreshToken',
];

export function createLogger(options: { level: string; prettyPrint: boolean }): Logger {
  return pino({
    level: options.level,
    redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
    ...(options.prettyPrint
      ? { transport: { target: 'pino-pretty', options: { colorize: true, singleLine: true } } }
      : {}),
  });
}
