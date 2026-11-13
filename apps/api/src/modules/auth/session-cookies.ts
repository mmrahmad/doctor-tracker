import { API_BASE_PATH, SESSION_COOKIE_NAMES } from '@doctor-tracker/contracts';
import type { CookieOptions, Response } from 'express';
import type { SessionTokens } from './auth.service';

export interface SessionCookieSettings {
  secureCookies: boolean;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

/** The refresh token is only ever sent to the auth endpoints, never to data endpoints. */
const REFRESH_COOKIE_PATH = `${API_BASE_PATH}/auth`;

export class SessionCookieWriter {
  constructor(private readonly settings: SessionCookieSettings) {}

  write(response: Response, tokens: SessionTokens): void {
    response.cookie(SESSION_COOKIE_NAMES.accessToken, tokens.accessToken, {
      ...this.baseOptions('/'),
      maxAge: this.settings.accessTokenTtlSeconds * 1000,
    });
    response.cookie(SESSION_COOKIE_NAMES.refreshToken, tokens.refreshToken, {
      ...this.baseOptions(REFRESH_COOKIE_PATH),
      maxAge: this.settings.refreshTokenTtlSeconds * 1000,
    });
    // Lax (not strict) so opening a link to the app from another site still passes the route
    // guard; it holds no secret, and the real credentials stay strict.
    response.cookie(SESSION_COOKIE_NAMES.sessionHint, '1', {
      ...this.baseOptions('/'),
      sameSite: 'lax',
      maxAge: this.settings.refreshTokenTtlSeconds * 1000,
    });
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAMES.accessToken, this.baseOptions('/'));
    response.clearCookie(SESSION_COOKIE_NAMES.refreshToken, this.baseOptions(REFRESH_COOKIE_PATH));
    response.clearCookie(SESSION_COOKIE_NAMES.sessionHint, this.baseOptions('/'));
  }

  private baseOptions(path: string): CookieOptions {
    return { httpOnly: true, secure: this.settings.secureCookies, sameSite: 'strict', path };
  }
}
