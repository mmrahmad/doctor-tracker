import { loginRequestSchema, SESSION_COOKIE_NAMES } from '@doctor-tracker/contracts';
import type { Request, Response } from 'express';
import { UnauthenticatedError } from '../../common/errors/application-errors';
import { parseWithSchema } from '../../common/http/parse-with-schema';
import { sendData, sendNoContent } from '../../common/http/send-response';
import type { AuthService, ClientContext } from './auth.service';
import { requireAuthenticatedUser } from './authentication.middleware';
import type { SessionCookieWriter } from './session-cookies';

function readClientContext(request: Request): ClientContext {
  return { ipAddress: request.ip ?? '', userAgent: request.get('user-agent') ?? '' };
}

function readRefreshToken(request: Request): string | undefined {
  return request.cookies?.[SESSION_COOKIE_NAMES.refreshToken] as string | undefined;
}

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionCookieWriter: SessionCookieWriter,
  ) {}

  login = async (request: Request, response: Response): Promise<void> => {
    const credentials = parseWithSchema(loginRequestSchema, request.body);
    const session = await this.authService.login(credentials, readClientContext(request));
    this.sessionCookieWriter.write(response, session.tokens);
    sendData(response, session.user);
  };

  refresh = async (request: Request, response: Response): Promise<void> => {
    const refreshToken = readRefreshToken(request);
    if (!refreshToken) throw new UnauthenticatedError('Session expired. Please sign in again.');
    try {
      const session = await this.authService.refresh(refreshToken, readClientContext(request));
      this.sessionCookieWriter.write(response, session.tokens);
      sendData(response, session.user);
    } catch (error) {
      this.sessionCookieWriter.clear(response);
      throw error;
    }
  };

  logout = async (request: Request, response: Response): Promise<void> => {
    await this.authService.logout(readRefreshToken(request));
    this.sessionCookieWriter.clear(response);
    sendNoContent(response);
  };

  getCurrentUser = async (request: Request, response: Response): Promise<void> => {
    const { id: userId } = requireAuthenticatedUser(request);
    sendData(response, await this.authService.getSessionUser(userId));
  };
}
