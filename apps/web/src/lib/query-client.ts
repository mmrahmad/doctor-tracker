import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from './http/api-request-error';

const MAX_RETRIES_FOR_TRANSIENT_ERRORS = 2;

/**
 * Server-state cache defaults:
 * - data is fresh for 30s (matches API cache TTLs), so navigating back and forth is instant;
 * - only transient failures (network/5xx) are retried, with exponential backoff;
 * - client errors (4xx) surface immediately — retrying them cannot succeed.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !(error instanceof ApiRequestError && error.isClientError) &&
          failureCount < MAX_RETRIES_FOR_TRANSIENT_ERRORS,
        retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 8_000),
      },
      mutations: { retry: false },
    },
  });
}
