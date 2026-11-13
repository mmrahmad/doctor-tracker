'use client';

import type { CreateDoctorRequest, DoctorListQuery } from '@doctor-tracker/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePaginatedListQuery } from '@/hooks/use-paginated-list-query';
import { queryKeys } from '@/lib/query-keys';
import { doctorsApi } from '../api/doctors-api';

type DoctorListRequest = Partial<DoctorListQuery> & { page: number };

const fetchDoctorPage = (query: DoctorListRequest, signal: AbortSignal) => doctorsApi.fetchDoctors(query, signal);

export function useDoctorList(query: DoctorListRequest, options: { enabled?: boolean } = {}) {
  return usePaginatedListQuery({
    query,
    buildQueryKey: queryKeys.doctors.list,
    fetchPage: fetchDoctorPage,
    enabled: options.enabled,
  });
}

export function useDoctor(doctorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(doctorId ?? ''),
    queryFn: ({ signal }) => doctorsApi.fetchDoctor(doctorId!, signal),
    enabled: Boolean(doctorId),
  });
}

export function useHospitals() {
  return useQuery({
    queryKey: queryKeys.doctors.hospitals,
    queryFn: ({ signal }) => doctorsApi.fetchHospitals(signal),
    staleTime: 5 * 60_000,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateDoctorRequest; idempotencyKey: string }) =>
      doctorsApi.createDoctor(input, idempotencyKey),
    onSuccess: (createdDoctor) => {
      queryClient.setQueryData(queryKeys.doctors.detail(createdDoctor.id), createdDoctor);
      void queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}
