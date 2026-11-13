import { z } from 'zod';
import {
  ANALYTICS_RANGES,
  type DoctorSpecialization,
  type PatientCondition,
} from '../constants';

export const analyticsOverviewQuerySchema = z.object({
  range: z.enum(ANALYTICS_RANGES).default('30d'),
});

export type AnalyticsOverviewQuery = z.infer<typeof analyticsOverviewQuerySchema>;

export type TrendBucketUnit = 'day' | 'week' | 'month';

export interface AnalyticsTotals {
  doctors: number;
  patients: number;
  criticalPatients: number;
  averagePatientsPerDoctor: number;
  patientsAdmittedInRange: number;
  patientsAdmittedInPreviousRange: number;
  doctorsJoinedInRange: number;
}

export interface TrendPoint {
  /** Start of the bucket, ISO date (`YYYY-MM-DD`). */
  bucketStart: string;
  patientsAdmitted: number;
  doctorsJoined: number;
}

export interface DoctorWorkload {
  doctorId: string;
  fullName: string;
  specialization: DoctorSpecialization;
  patientCount: number;
}

export interface ConditionShare {
  condition: PatientCondition;
  patientCount: number;
}

export interface SpecializationShare {
  specialization: DoctorSpecialization;
  doctorCount: number;
  patientCount: number;
}

export interface AnalyticsOverview {
  range: AnalyticsOverviewQuery['range'];
  bucketUnit: TrendBucketUnit;
  totals: AnalyticsTotals;
  admissionTrend: TrendPoint[];
  busiestDoctors: DoctorWorkload[];
  conditionShares: ConditionShare[];
  specializationShares: SpecializationShare[];
  generatedAt: string;
}
