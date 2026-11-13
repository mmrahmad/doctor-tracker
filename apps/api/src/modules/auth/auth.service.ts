import type { LoginRequest, SessionUser } from '@doctor-tracker/contracts';
import { randomUUID } from 'node:crypto';
import { AccountLockedError, UnauthenticatedError } from '../../common/errors/application-errors';
import type { Logger } from '../../infrastructure/logger';
import type { RefreshSessionRepository, UserRepository } from './auth.repositories';
import type { PasswordHasher } from './password-hasher';
import type { TokenService } from './token-service';
import type { UserRecord } from './user.model';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MS = 15 * 60_000;
/** Two tabs refreshing at the same instant must not be mistaken for token theft. */
const REFRESH_REUSE_GRACE_PERIOD_MS = 15_000;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedSession {
  user: SessionUser;
  tokens: SessionTokens;
}

export interface ClientContext {
  ipAddress: string;
  userAgent: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenTtlSeconds: number,
    private readonly logger: Logger,
  ) {}

  async login(credentials: LoginRequest, clientContext: ClientContext): Promise<AuthenticatedSession> {
    const user = await this.userRepository.findByEmailWithPasswordHash(credentials.email);
    if (!user) {
      await this.passwordHasher.verifyAgainstDecoy(credentials.password);
      throw new UnauthenticatedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const userId = user._id.toString();
    this.assertAccountNotLocked(user);

    const isPasswordCorrect = await this.passwordHasher.verify(user.passwordHash, credentials.password);
    if (!isPasswordCorrect) {
      await this.registerFailedLogin(userId);
      throw new UnauthenticatedError(INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.resetFailedLogins(userId);
    }
    const tokens = await this.startSession(user, randomUUID(), clientContext);
    return { user: toSessionUser(user), tokens };
  }

  /** Rotates the refresh token: the presented token is consumed and a new pair is issued. */
  async refresh(refreshToken: string, clientContext: ClientContext): Promise<AuthenticatedSession> {
    const now = new Date();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const consumedSession = await this.refreshSessionRepository.consumeActiveSession(tokenHash, now);

    if (!consumedSession) {
      await this.handleUnusableRefreshToken(tokenHash, now);
      throw new UnauthenticatedError('Session expired. Please sign in again.');
    }

    const user = await this.userRepository.findById(consumedSession.userId.toString());
    if (!user) throw new UnauthenticatedError('Session expired. Please sign in again.');

    const tokens = await this.startSession(user, consumedSession.familyId, clientContext);
    return { user: toSessionUser(user), tokens };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const session = await this.refreshSessionRepository.findByTokenHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );
    if (session) await this.refreshSessionRepository.revokeFamily(session.familyId, new Date());
  }

  async getSessionUser(userId: string): Promise<SessionUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthenticatedError();
    return toSessionUser(user);
  }

  private assertAccountNotLocked(user: UserRecord): void {
    if (!user.lockedUntil || user.lockedUntil.getTime() <= Date.now()) return;
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw new AccountLockedError(remainingMinutes);
  }

  private async registerFailedLogin(userId: string): Promise<void> {
    const failedAttempts = await this.userRepository.recordFailedLogin(userId);
    if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await this.userRepository.lockAccount(userId, new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS));
      this.logger.warn({ userId }, 'Account locked after repeated failed sign-in attempts');
    }
  }

  /**
   * A refresh token that is already revoked is being replayed. Outside the short grace window this
   * indicates theft, so every session in that login's family is revoked.
   */
  private async handleUnusableRefreshToken(tokenHash: string, now: Date): Promise<void> {
    const knownSession = await this.refreshSessionRepository.findByTokenHash(tokenHash);
    if (!knownSession?.revokedAt) return;
    const millisecondsSinceRevocation = now.getTime() - knownSession.revokedAt.getTime();
    if (millisecondsSinceRevocation <= REFRESH_REUSE_GRACE_PERIOD_MS) return;

    await this.refreshSessionRepository.revokeFamily(knownSession.familyId, now);
    this.logger.warn(
      { userId: knownSession.userId.toString(), familyId: knownSession.familyId },
      'Refresh token reuse detected — session family revoked',
    );
  }

  private async startSession(
    user: UserRecord,
    familyId: string,
    clientContext: ClientContext,
  ): Promise<SessionTokens> {
    const refreshToken = this.tokenService.generateRefreshToken();
    await this.refreshSessionRepository.create({
      userId: user._id.toString(),
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
      userAgent: clientContext.userAgent.slice(0, 300),
      ipAddress: clientContext.ipAddress,
    });
    const accessToken = this.tokenService.issueAccessToken({ id: user._id.toString(), role: user.role });
    return { accessToken, refreshToken };
  }
}

function toSessionUser(user: UserRecord): SessionUser {
  return { id: user._id.toString(), email: user.email, fullName: user.fullName, role: user.role };
}
