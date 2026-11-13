import type { ApiErrorCode } from '@doctor-tracker/contracts';

/** Base class for every error that is safe to expose to API clients. */
export class ApplicationError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApplicationError {
  constructor(fieldErrors: Record<string, string[]>, message = 'Some fields are invalid') {
    super(422, 'VALIDATION_FAILED', message, fieldErrors);
  }
}

export class UnauthenticatedError extends ApplicationError {
  constructor(message = 'Authentication is required') {
    super(401, 'UNAUTHENTICATED', message);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resourceName: string) {
    super(404, 'NOT_FOUND', `${resourceName} was not found`);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(409, 'CONFLICT', message, fieldErrors);
  }
}

export class StaleVersionError extends ApplicationError {
  constructor(resourceName: string) {
    super(
      409,
      'STALE_VERSION',
      `This ${resourceName.toLowerCase()} was changed by someone else. Reload and try again.`,
    );
  }
}

export class AccountLockedError extends ApplicationError {
  constructor(retryAfterMinutes: number) {
    super(
      423,
      'ACCOUNT_LOCKED',
      `Too many failed attempts. Try again in ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? '' : 's'}.`,
    );
  }
}

export class OriginRejectedError extends ApplicationError {
  constructor() {
    super(403, 'ORIGIN_REJECTED', 'Request origin is not allowed');
  }
}
