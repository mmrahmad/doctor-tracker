import type {
  CreateDoctorRequest,
  Doctor,
  DoctorListQuery,
  PaginatedResult,
} from '@doctor-tracker/contracts';
import { apiRequest } from '@/lib/http/api-client';

export const doctorsApi = {
  fetchDoctors: (query: Partial<DoctorListQuery>, signal?: AbortSignal) =>
    apiRequest<PaginatedResult<Doctor>>('/doctors', { query, signal }),
  fetchDoctor: (doctorId: string, signal?: AbortSignal) =>
    apiRequest<Doctor>(`/doctors/${encodeURIComponent(doctorId)}`, { signal }),
  fetchHospitals: (signal?: AbortSignal) => apiRequest<string[]>('/doctors/hospitals', { signal }),
  createDoctor: (input: CreateDoctorRequest, idempotencyKey: string) =>
    apiRequest<Doctor>('/doctors', { method: 'POST', body: input, idempotencyKey }),
};
