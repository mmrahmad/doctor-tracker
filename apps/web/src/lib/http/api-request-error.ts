import type { ApiErrorCode } from '@doctor-tracker/contracts';

/** Normalized error for every failed API call, so UI code handles one shape. */
export class ApiRequestError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly code: ApiErrorCode | 'NETWORK_ERROR',
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }

  get isClientError(): boolean {
    return this.httpStatus >= 400 && this.httpStatus < 500;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  return 'Something went wrong. Please try again.';
}
