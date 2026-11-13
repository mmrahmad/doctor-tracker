import type { UserRole } from '@doctor-tracker/contracts';
import jwt from 'jsonwebtoken';
import { createHmac, randomBytes } from 'node:crypto';
import { UnauthenticatedError } from '../../common/errors/application-errors';

const TOKEN_ISSUER = 'doctor-tracker-api';
const TOKEN_AUDIENCE = 'doctor-tracker-web';
const SIGNING_ALGORITHM = 'HS256';
const REFRESH_TOKEN_BYTES = 48;

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface TokenServiceOptions {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtlSeconds: number;
}

/**
 * Access tokens: short-lived signed JWTs, verified statelessly (no database hit per request, so API
 * instances scale horizontally). Refresh tokens: opaque random strings, stored only as HMACs.
 */
export class TokenService {
  constructor(private readonly options: TokenServiceOptions) {}

  issueAccessToken(user: AuthenticatedUser): string {
    return jwt.sign({ role: user.role }, this.options.accessTokenSecret, {
      subject: user.id,
      expiresIn: this.options.accessTokenTtlSeconds,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithm: SIGNING_ALGORITHM,
    });
  }

  verifyAccessToken(accessToken: string): AuthenticatedUser {
    try {
      const payload = jwt.verify(accessToken, this.options.accessTokenSecret, {
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
        algorithms: [SIGNING_ALGORITHM],
      });
      if (typeof payload === 'string' || !payload.sub || typeof payload.role !== 'string') {
        throw new UnauthenticatedError('Session is invalid');
      }
      return { id: payload.sub, role: payload.role as UserRole };
    } catch (error) {
      if (error instanceof UnauthenticatedError) throw error;
      throw new UnauthenticatedError('Session expired or invalid');
    }
  }

  generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  hashRefreshToken(refreshToken: string): string {
    return createHmac('sha256', this.options.refreshTokenSecret).update(refreshToken).digest('hex');
  }
}
