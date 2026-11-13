import argon2 from 'argon2';

export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(passwordHash: string, plainPassword: string): Promise<boolean>;
  /** Spends the same time as a real verification; used when the account does not exist. */
  verifyAgainstDecoy(plainPassword: string): Promise<void>;
}

/** Argon2id with OWASP-recommended parameters (19 MiB memory, 2 iterations). */
export class Argon2PasswordHasher implements PasswordHasher {
  private readonly hashingOptions = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  } as const;

  private decoyHash: Promise<string> | null = null;

  hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, this.hashingOptions);
  }

  async verify(passwordHash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, plainPassword);
    } catch {
      return false;
    }
  }

  async verifyAgainstDecoy(plainPassword: string): Promise<void> {
    this.decoyHash ??= this.hash('decoy-password-for-timing-equalization');
    await this.verify(await this.decoyHash, plainPassword);
  }
}
