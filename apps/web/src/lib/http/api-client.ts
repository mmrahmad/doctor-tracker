import {
  API_BASE_PATH,
  IDEMPOTENCY_KEY_HEADER,
  type ApiErrorBody,
  type ApiSuccessBody,
} from '@doctor-tracker/contracts';
import { ApiRequestError } from './api-request-error';

type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Makes a create request safe to retry; the API replays the first successful response. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

const AUTH_PATH_PREFIX = '/auth/';
const SESSION_EXPIRED_EVENT = 'doctor-tracker:session-expired';

export function buildQueryString(query: Record<string, QueryValue> = {}): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    searchParams.set(key, String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function sendRequest(path: string, options: ApiRequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers[IDEMPOTENCY_KEY_HEADER] = options.idempotencyKey;

  try {
    return await fetch(`${API_BASE_PATH}${path}${buildQueryString(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection.');
  }
}

async function toApiRequestError(response: Response): Promise<ApiRequestError> {
  const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiRequestError(
    response.status,
    errorBody?.error.code ?? 'INTERNAL_ERROR',
    errorBody?.error.message ?? 'Something went wrong. Please try again.',
    errorBody?.error.fieldErrors,
  );
}

/**
 * Single-flight refresh: when many requests hit 401 at once (e.g. after the access token expires),
 * only one refresh call is made and every request waits for it.
 */
let pendingRefresh: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  pendingRefresh ??= sendRequest(`${AUTH_PATH_PREFIX}refresh`, { method: 'POST' })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}

export function onSessionExpired(listener: () => void): () => void {
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

/** Typed JSON request against the API; unwraps `{ data }` and throws `ApiRequestError` on failure. */
export async function apiRequest<TData>(path: string, options: ApiRequestOptions = {}): Promise<TData> {
  let response = await sendRequest(path, options);

  if (response.status === 401 && !path.startsWith(AUTH_PATH_PREFIX)) {
    await refreshSession();
    // Retry even if this tab's refresh lost a race: another tab may already have rotated cookies.
    response = await sendRequest(path, options);
    if (response.status === 401) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!response.ok) throw await toApiRequestError(response);
  if (response.status === 204) return undefined as TData;
  return ((await response.json()) as ApiSuccessBody<TData>).data;
}
