import { RefreshSessionModel, type RefreshSessionRecord } from './refresh-session.model';
import { UserModel, type UserRecord } from './user.model';

export type UserWithPasswordHash = UserRecord & { passwordHash: string };

export interface UserRepository {
  findById(userId: string): Promise<UserRecord | null>;
  findByEmailWithPasswordHash(email: string): Promise<UserWithPasswordHash | null>;
  /** Atomically increments the failure counter and returns the new count. */
  recordFailedLogin(userId: string): Promise<number>;
  lockAccount(userId: string, lockedUntil: Date): Promise<void>;
  resetFailedLogins(userId: string): Promise<void>;
}

export interface NewRefreshSession {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
}

export interface RefreshSessionRepository {
  create(session: NewRefreshSession): Promise<void>;
  /** Atomically marks an active session as revoked and returns it; `null` if none was active. */
  consumeActiveSession(tokenHash: string, now: Date): Promise<RefreshSessionRecord | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null>;
  revokeFamily(familyId: string, now: Date): Promise<void>;
}

export class MongoUserRepository implements UserRepository {
  findById(userId: string): Promise<UserRecord | null> {
    return UserModel.findById(userId).lean<UserRecord>().exec();
  }

  findByEmailWithPasswordHash(email: string): Promise<UserWithPasswordHash | null> {
    return UserModel.findOne({ email }).select('+passwordHash').lean<UserWithPasswordHash>().exec();
  }

  async recordFailedLogin(userId: string): Promise<number> {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $inc: { failedLoginAttempts: 1 } },
      { new: true, projection: { failedLoginAttempts: 1 } },
    )
      .lean<Pick<UserRecord, 'failedLoginAttempts'>>()
      .exec();
    return updatedUser?.failedLoginAttempts ?? 0;
  }

  async lockAccount(userId: string, lockedUntil: Date): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { lockedUntil, failedLoginAttempts: 0 } }).exec();
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { failedLoginAttempts: 0, lockedUntil: null } },
    ).exec();
  }
}

export class MongoRefreshSessionRepository implements RefreshSessionRepository {
  async create(session: NewRefreshSession): Promise<void> {
    await RefreshSessionModel.create(session);
  }

  consumeActiveSession(tokenHash: string, now: Date): Promise<RefreshSessionRecord | null> {
    return RefreshSessionModel.findOneAndUpdate(
      { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
      { $set: { revokedAt: now } },
      { new: false },
    )
      .lean<RefreshSessionRecord>()
      .exec();
  }

  findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null> {
    return RefreshSessionModel.findOne({ tokenHash }).lean<RefreshSessionRecord>().exec();
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await RefreshSessionModel.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: now } },
    ).exec();
  }
}
