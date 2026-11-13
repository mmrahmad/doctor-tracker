export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'STALE_VERSION',
  'RATE_LIMITED',
  'ACCOUNT_LOCKED',
  'ORIGIN_REJECTED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Field path → messages, present for validation failures. */
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
}

export interface ApiSuccessBody<TData> {
  data: TData;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  pagination: PaginationMeta;
}

export const API_BASE_PATH = '/api/v1';
