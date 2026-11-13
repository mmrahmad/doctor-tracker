import type { Patient } from '@doctor-tracker/contracts';
import { utcDateToCalendarDate } from '../../common/query/date-range';
import type { PatientRecordWithDoctor } from './patient.model';

export function toPatient(record: PatientRecordWithDoctor): Patient {
  return {
    id: record._id.toString(),
    fullName: record.fullName,
    email: record.email,
    phone: record.phone,
    gender: record.gender,
    dateOfBirth: utcDateToCalendarDate(record.dateOfBirth),
    condition: record.condition,
    diagnosis: record.diagnosis,
    admittedAt: utcDateToCalendarDate(record.admittedAt),
    doctor: record.doctor
      ? {
          id: record.doctor._id.toString(),
          fullName: record.doctor.fullName,
          specialization: record.doctor.specialization,
        }
      : null,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
