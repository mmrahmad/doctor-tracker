import { SESSION_COOKIE_NAMES, type UserRole } from '@doctor-tracker/contracts';
import type { Request, RequestHandler } from 'express';
import { ForbiddenError, UnauthenticatedError } from '../../common/errors/application-errors';
import type { AuthenticatedUser, TokenService } from './token-service';

const BEARER_PREFIX = 'Bearer ';

function readAccessToken(request: Request): string | undefined {
  const cookieToken = request.cookies?.[SESSION_COOKIE_NAMES.accessToken] as string | undefined;
  if (cookieToken) return cookieToken;
  const authorizationHeader = request.get('authorization');
  return authorizationHeader?.startsWith(BEARER_PREFIX)
    ? authorizationHeader.slice(BEARER_PREFIX.length)
    : undefined;
}

/** Accepts the httpOnly session cookie (browsers) or a Bearer token (API clients). */
export function createAuthenticationMiddleware(tokenService: TokenService): RequestHandler {
  return (request, _response, next) => {
    const accessToken = readAccessToken(request);
    if (!accessToken) throw new UnauthenticatedError();
    request.authenticatedUser = tokenService.verifyAccessToken(accessToken);
    next();
  };
}

export function authorizeRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    const role = request.authenticatedUser?.role;
    if (!role) throw new UnauthenticatedError();
    if (!allowedRoles.includes(role)) throw new ForbiddenError();
    next();
  };
}

export function requireAuthenticatedUser(request: Request): AuthenticatedUser {
  if (!request.authenticatedUser) throw new UnauthenticatedError();
  return request.authenticatedUser;
}
