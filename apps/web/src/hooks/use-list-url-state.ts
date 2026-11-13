'use client';

import { PAGINATION_DEFAULTS, SORT_DIRECTIONS } from '@doctor-tracker/contracts';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  type UseQueryStatesKeysMap,
  type Values,
} from 'nuqs';
import { useCallback, useMemo } from 'react';

/** URL parsers shared by every paginated, searchable list. */
export const baseListParsers = {
  page: parseAsInteger.withDefault(PAGINATION_DEFAULTS.page),
  pageSize: parseAsInteger.withDefault(PAGINATION_DEFAULTS.pageSize),
  search: parseAsString.withDefault(''),
  dateFrom: parseAsString.withDefault(''),
  dateTo: parseAsString.withDefault(''),
  sortDirection: parseAsStringLiteral(SORT_DIRECTIONS).withDefault('desc'),
};

const NON_FILTER_KEYS = new Set(['page', 'pageSize', 'sortBy', 'sortDirection']);

/**
 * List state (page, filters, sort) lives in the URL: views are shareable, survive reloads and work
 * with the back button. Changing any filter resets to page 1 so users never land on an empty page.
 */
export function useListUrlState<TFilterParsers extends UseQueryStatesKeysMap>(filterParsers: TFilterParsers) {
  const parsers = useMemo(() => ({ ...baseListParsers, ...filterParsers }), [filterParsers]);
  const [listState, setListState] = useQueryStates(parsers, { history: 'replace', clearOnDefault: true });

  type ListState = Values<typeof parsers>;

  const updateFilters = useCallback(
    (filterChanges: Partial<ListState>) =>
      void setListState({ ...filterChanges, page: null } as Parameters<typeof setListState>[0]),
    [setListState],
  );

  const setPage = useCallback((page: number) => void setListState({ page } as never), [setListState]);

  const setPageSize = useCallback(
    (pageSize: number) => void setListState({ pageSize, page: null } as never),
    [setListState],
  );

  const clearFilters = useCallback(() => {
    const clearedFilters = Object.fromEntries(
      Object.keys(parsers)
        .filter((key) => !NON_FILTER_KEYS.has(key))
        .map((key) => [key, null]),
    );
    void setListState({ ...clearedFilters, page: null } as never);
  }, [parsers, setListState]);

  const activeFilterCount = Object.entries(listState).filter(
    ([key, value]) => !NON_FILTER_KEYS.has(key) && value !== '' && value !== null,
  ).length;

  // Hand-edited URLs must never produce a request the API would reject.
  const sanitizedListState = {
    ...listState,
    page: Math.max(PAGINATION_DEFAULTS.page, listState.page as number),
    pageSize: Math.min(Math.max(1, listState.pageSize as number), PAGINATION_DEFAULTS.maxPageSize),
  } as ListState;

  return {
    listState: sanitizedListState,
    updateFilters,
    setPage,
    setPageSize,
    clearFilters,
    activeFilterCount,
  };
}
