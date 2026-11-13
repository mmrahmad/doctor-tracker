import { z } from 'zod';
import {
  GENDERS,
  PATIENT_CONDITIONS,
  PATIENT_SORT_FIELDS,
  type DoctorSpecialization,
  type Gender,
  type PatientCondition,
} from '../constants';
import {
  calendarDateSchema,
  dateRangeQuerySchema,
  emailSchema,
  objectIdSchema,
  optionalQueryValue,
  paginationQuerySchema,
  personNameSchema,
  phoneSchema,
  searchQuerySchema,
  sortDirectionSchema,
  withOrderedDateRange,
} from './common';

export const patientConditionSchema = z.enum(PATIENT_CONDITIONS, { error: 'Select a condition' });
export const genderSchema = z.enum(GENDERS, { error: 'Select a gender' });

const isNotInFuture = (calendarDate: string) =>
  calendarDate <= new Date().toISOString().slice(0, 10);

/** Fields an admin enters for a patient; shared by "add under doctor" and "edit". */
export const patientDetailsSchema = z.object({
  fullName: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  gender: genderSchema,
  dateOfBirth: calendarDateSchema.refine(isNotInFuture, 'Date of birth cannot be in the future'),
  condition: patientConditionSchema,
  diagnosis: z.string().trim().min(2, 'Must be at least 2 characters').max(200),
  admittedAt: calendarDateSchema.refine(isNotInFuture, 'Admission date cannot be in the future'),
});

export const createPatientRequestSchema = patientDetailsSchema;

export const updatePatientRequestSchema = patientDetailsSchema.partial().extend({
  doctorId: objectIdSchema.optional(),
  /** Version the client last saw; the update is rejected if the record changed since. */
  version: z.number().int().min(0),
});

export const patientListQuerySchema = withOrderedDateRange(
  paginationQuerySchema
    .extend(searchQuerySchema.shape)
    .extend(dateRangeQuerySchema.shape)
    .extend({
      condition: optionalQueryValue(patientConditionSchema),
      gender: optionalQueryValue(genderSchema),
      doctorId: optionalQueryValue(objectIdSchema),
      sortBy: z.enum(PATIENT_SORT_FIELDS).default('admittedAt'),
      sortDirection: sortDirectionSchema,
    }),
);

export type PatientDetails = z.infer<typeof patientDetailsSchema>;
export type CreatePatientRequest = z.infer<typeof createPatientRequestSchema>;
export type UpdatePatientRequest = z.infer<typeof updatePatientRequestSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;

export interface PatientDoctorSummary {
  id: string;
  fullName: string;
  specialization: DoctorSpecialization;
}

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  condition: PatientCondition;
  diagnosis: string;
  admittedAt: string;
  doctor: PatientDoctorSummary | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
