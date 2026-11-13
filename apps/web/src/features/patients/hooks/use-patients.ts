'use client';

import type {
  CreatePatientRequest,
  PaginatedResult,
  Patient,
  PatientListQuery,
  UpdatePatientRequest,
} from '@doctor-tracker/contracts';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { usePaginatedListQuery } from '@/hooks/use-paginated-list-query';
import { queryKeys } from '@/lib/query-keys';
import { patientsApi } from '../api/patients-api';

type PatientListRequest = Partial<PatientListQuery> & { page: number };

const fetchPatientPage = (query: PatientListRequest, signal: AbortSignal) => patientsApi.fetchPatients(query, signal);

export function usePatientList(query: PatientListRequest) {
  return usePaginatedListQuery({ query, buildQueryKey: queryKeys.patients.list, fetchPage: fetchPatientPage });
}

/** Patient writes change patient lists, doctor patient counts and dashboard analytics. */
function invalidatePatientDependents(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  ]);
}

export function useAddPatientToDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      doctorId,
      details,
      idempotencyKey,
    }: {
      doctorId: string;
      details: CreatePatientRequest;
      idempotencyKey: string;
    }) => patientsApi.addPatientToDoctor(doctorId, details, idempotencyKey),
    onSuccess: () => invalidatePatientDependents(queryClient),
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, changes }: { patientId: string; changes: UpdatePatientRequest }) =>
      patientsApi.updatePatient(patientId, changes),
    // Refetch on failure too: a version conflict means our copy is outdated.
    onSettled: () => invalidatePatientDependents(queryClient),
  });
}

/**
 * Optimistic delete: the row disappears immediately from every cached list; if the server
 * rejects the delete, all lists are restored exactly as they were.
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ patient, doctorId }: { patient: Patient; doctorId?: string }) =>
      patientsApi.deletePatient(patient.id, doctorId),
    onMutate: async ({ patient }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients.all });
      const previousLists = queryClient.getQueriesData<PaginatedResult<Patient>>({ queryKey: queryKeys.patients.all });

      queryClient.setQueriesData<PaginatedResult<Patient>>({ queryKey: queryKeys.patients.all }, (cachedList) => {
        if (!cachedList?.items.some((item) => item.id === patient.id)) return cachedList;
        return {
          items: cachedList.items.filter((item) => item.id !== patient.id),
          pagination: { ...cachedList.pagination, totalItems: Math.max(0, cachedList.pagination.totalItems - 1) },
        };
      });
      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, cachedList]) => queryClient.setQueryData(queryKey, cachedList));
    },
    onSettled: () => invalidatePatientDependents(queryClient),
  });
}
