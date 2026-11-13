import type {
  CreatePatientRequest,
  PaginatedResult,
  Patient,
  PatientListQuery,
  UpdatePatientRequest,
} from '@doctor-tracker/contracts';
import { apiRequest } from '@/lib/http/api-client';

const doctorPatientsPath = (doctorId: string) => `/doctors/${encodeURIComponent(doctorId)}/patients`;
const patientPath = (patientId: string) => `/patients/${encodeURIComponent(patientId)}`;

export const patientsApi = {
  /** Lists all patients, or a single doctor's patients when `doctorId` is set. */
  fetchPatients: ({ doctorId, ...query }: Partial<PatientListQuery>, signal?: AbortSignal) =>
    apiRequest<PaginatedResult<Patient>>(doctorId ? doctorPatientsPath(doctorId) : '/patients', { query, signal }),
  addPatientToDoctor: (doctorId: string, details: CreatePatientRequest, idempotencyKey: string) =>
    apiRequest<Patient>(doctorPatientsPath(doctorId), { method: 'POST', body: details, idempotencyKey }),
  updatePatient: (patientId: string, changes: UpdatePatientRequest) =>
    apiRequest<Patient>(patientPath(patientId), { method: 'PATCH', body: changes }),
  /** With `doctorId`, the API only deletes the patient if it belongs to that doctor. */
  deletePatient: (patientId: string, doctorId?: string) =>
    apiRequest<void>(doctorId ? `${doctorPatientsPath(doctorId)}/${encodeURIComponent(patientId)}` : patientPath(patientId), {
      method: 'DELETE',
    }),
};
