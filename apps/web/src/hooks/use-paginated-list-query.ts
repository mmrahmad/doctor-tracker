'use client';

import type { PaginatedResult } from '@doctor-tracker/contracts';
import { keepPreviousData, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';

interface PaginatedListQueryOptions<TQuery extends { page: number }, TItem> {
  query: TQuery;
  buildQueryKey: (query: TQuery) => QueryKey;
  fetchPage: (query: TQuery, signal: AbortSignal) => Promise<PaginatedResult<TItem>>;
  enabled?: boolean;
}

/**
 * Paginated list query with two UX optimizations:
 * - the previous page stays on screen while the next one loads (no layout jump / spinner flash);
 * - the following page is prefetched, so "Next" is usually instant.
 */
export function usePaginatedListQuery<TQuery extends { page: number }, TItem>({
  query,
  buildQueryKey,
  fetchPage,
  enabled = true,
}: PaginatedListQueryOptions<TQuery, TItem>) {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: buildQueryKey(query),
    queryFn: ({ signal }) => fetchPage(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });

  const totalPages = listQuery.data?.pagination.totalPages ?? 0;
  const serializedQuery = JSON.stringify(query);

  useEffect(() => {
    if (!enabled || listQuery.isPlaceholderData || query.page >= totalPages) return;
    const nextPageQuery = { ...query, page: query.page + 1 };
    void queryClient.prefetchQuery({
      queryKey: buildQueryKey(nextPageQuery),
      queryFn: ({ signal }) => fetchPage(nextPageQuery, signal),
    });
    // `serializedQuery` stands in for `query`, whose identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedQuery, totalPages, enabled, listQuery.isPlaceholderData, queryClient, buildQueryKey, fetchPage]);

  return listQuery;
}
