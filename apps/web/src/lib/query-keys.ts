import type { AnalyticsRange, DoctorListQuery, PatientListQuery } from '@doctor-tracker/contracts';

/**
 * Hierarchical query keys: invalidating a prefix (e.g. `queryKeys.patients.all`) refreshes every
 * list, page and filter combination underneath it.
 */
export const queryKeys = {
  session: ['session'] as const,
  doctors: {
    all: ['doctors'] as const,
    list: (query: Partial<DoctorListQuery>) => ['doctors', 'list', query] as const,
    detail: (doctorId: string) => ['doctors', 'detail', doctorId] as const,
    hospitals: ['doctors', 'hospitals'] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (query: Partial<PatientListQuery>) => ['patients', 'list', query] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    overview: (range: AnalyticsRange) => ['analytics', 'overview', range] as const,
  },
};
