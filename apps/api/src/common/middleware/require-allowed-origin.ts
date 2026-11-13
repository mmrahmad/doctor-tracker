import type { RequestHandler } from 'express';
import { OriginRejectedError } from '../errors/application-errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defense-in-depth on top of SameSite=strict cookies: browsers always send `Origin` on
 * cross-site state-changing requests, so any mutation from an unknown origin is rejected.
 * Requests without `Origin` (server-to-server, CLI tools) carry no ambient browser cookies.
 */
export function requireAllowedOrigin(allowedOrigins: string[]): RequestHandler {
  const allowedOriginSet = new Set(allowedOrigins);
  return (request, _response, next) => {
    const requestOrigin = request.get('origin');
    if (SAFE_METHODS.has(request.method) || !requestOrigin || allowedOriginSet.has(requestOrigin)) {
      next();
      return;
    }
    next(new OriginRejectedError());
  };
}
