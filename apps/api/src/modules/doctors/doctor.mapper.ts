import type { Doctor } from '@doctor-tracker/contracts';
import type { DoctorRecord } from './doctor.model';

export function toDoctor(record: DoctorRecord): Doctor {
  return {
    id: record._id.toString(),
    fullName: record.fullName,
    specialization: record.specialization,
    hospital: record.hospital,
    phone: record.phone,
    email: record.email,
    patientCount: record.patientCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
