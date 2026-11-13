import type { AnalyticsOverview, AnalyticsRange } from '@doctor-tracker/contracts';
import { apiRequest } from '@/lib/http/api-client';

export const analyticsApi = {
  fetchOverview: (range: AnalyticsRange, signal?: AbortSignal) =>
    apiRequest<AnalyticsOverview>('/analytics/overview', { query: { range }, signal }),
};
