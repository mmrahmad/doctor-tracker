import type { PatientDetails, UpdatePatientRequest } from '@doctor-tracker/contracts';
import { Types } from 'mongoose';
import { calendarDateToUtcDate } from '../../common/query/date-range';
import { derivePatientSearchFields, type PatientRecord } from './patient.model';

export type NewPatientDocument = Omit<PatientRecord, '_id' | 'createdAt' | 'updatedAt' | 'version'>;
export type PatientChanges = Partial<NewPatientDocument>;

/** Maps validated API input to the stored document shape, including derived search fields. */
export function toNewPatientDocument(details: PatientDetails, doctorId: string): NewPatientDocument {
  return {
    fullName: details.fullName,
    email: details.email,
    phone: details.phone,
    gender: details.gender,
    condition: details.condition,
    diagnosis: details.diagnosis,
    dateOfBirth: calendarDateToUtcDate(details.dateOfBirth),
    admittedAt: calendarDateToUtcDate(details.admittedAt),
    doctor: new Types.ObjectId(doctorId),
    ...derivePatientSearchFields(details.fullName, details.email, details.phone),
  };
}

/** Builds a `$set` payload containing only the fields the client actually changed. */
export function toPatientChanges(current: PatientRecord, request: UpdatePatientRequest): PatientChanges {
  const { version: _expectedVersion, doctorId, dateOfBirth, admittedAt, ...plainFields } = request;
  const changes: PatientChanges = { ...plainFields };

  if (dateOfBirth) changes.dateOfBirth = calendarDateToUtcDate(dateOfBirth);
  if (admittedAt) changes.admittedAt = calendarDateToUtcDate(admittedAt);
  if (doctorId) changes.doctor = new Types.ObjectId(doctorId);

  const searchableFieldChanged = Boolean(request.fullName || request.email || request.phone);
  if (searchableFieldChanged) {
    Object.assign(
      changes,
      derivePatientSearchFields(
        request.fullName ?? current.fullName,
        request.email ?? current.email,
        request.phone ?? current.phone,
      ),
    );
  }
  return changes;
}
