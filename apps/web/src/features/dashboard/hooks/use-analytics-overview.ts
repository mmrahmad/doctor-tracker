'use client';

import type { AnalyticsRange } from '@doctor-tracker/contracts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { analyticsApi } from '../api/analytics-api';

/** Keeps the previous range on screen while a new range loads, so charts never flash empty. */
export function useAnalyticsOverview(range: AnalyticsRange) {
  return useQuery({
    queryKey: queryKeys.analytics.overview(range),
    queryFn: ({ signal }) => analyticsApi.fetchOverview(range, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
