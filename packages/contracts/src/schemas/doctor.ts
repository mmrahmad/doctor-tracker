import { z } from 'zod';
import { DOCTOR_SORT_FIELDS, DOCTOR_SPECIALIZATIONS, type DoctorSpecialization } from '../constants';
import {
  dateRangeQuerySchema,
  emailSchema,
  optionalQueryValue,
  paginationQuerySchema,
  personNameSchema,
  phoneSchema,
  searchQuerySchema,
  sortDirectionSchema,
  withOrderedDateRange,
} from './common';

export const doctorSpecializationSchema = z.enum(DOCTOR_SPECIALIZATIONS, {
  error: 'Select a specialization',
});

export const createDoctorRequestSchema = z.object({
  fullName: personNameSchema,
  specialization: doctorSpecializationSchema,
  hospital: z.string().trim().min(2, 'Must be at least 2 characters').max(120),
  phone: phoneSchema,
  email: emailSchema,
});

export const doctorListQuerySchema = withOrderedDateRange(
  paginationQuerySchema
    .extend(searchQuerySchema.shape)
    .extend(dateRangeQuerySchema.shape)
    .extend({
      specialization: optionalQueryValue(doctorSpecializationSchema),
      hospital: optionalQueryValue(z.string().trim().max(120)),
      sortBy: z.enum(DOCTOR_SORT_FIELDS).default('createdAt'),
      sortDirection: sortDirectionSchema,
    }),
);

export type CreateDoctorRequest = z.infer<typeof createDoctorRequestSchema>;
export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;

export interface Doctor {
  id: string;
  fullName: string;
  specialization: DoctorSpecialization;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorOption {
  id: string;
  fullName: string;
  specialization: DoctorSpecialization;
}
