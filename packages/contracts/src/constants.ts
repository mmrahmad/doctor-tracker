export const DOCTOR_SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Urology',
] as const;
export type DoctorSpecialization = (typeof DOCTOR_SPECIALIZATIONS)[number];

export const PATIENT_CONDITIONS = [
  'stable',
  'under_observation',
  'critical',
  'recovering',
  'discharged',
] as const;
export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];

export const PATIENT_CONDITION_LABELS: Record<PatientCondition, string> = {
  stable: 'Stable',
  under_observation: 'Under observation',
  critical: 'Critical',
  recovering: 'Recovering',
  discharged: 'Discharged',
};

export const GENDERS = ['female', 'male', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
};

export const USER_ROLES = ['admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ANALYTICS_RANGES = ['7d', '30d', '90d', '12m'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const ANALYTICS_RANGE_LABELS: Record<AnalyticsRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
};

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const DOCTOR_SORT_FIELDS = ['createdAt', 'fullName', 'patientCount'] as const;
export type DoctorSortField = (typeof DOCTOR_SORT_FIELDS)[number];

export const PATIENT_SORT_FIELDS = ['admittedAt', 'fullName', 'createdAt'] as const;
export type PatientSortField = (typeof PATIENT_SORT_FIELDS)[number];

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 10,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50],
} as const;

export const SEARCH_TERM_MAX_LENGTH = 80;

export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

/** Cookie names are shared so the web app's route guard and the API agree on them. */
export const SESSION_COOKIE_NAMES = {
  accessToken: 'dt_access',
  refreshToken: 'dt_refresh',
  /** Carries no secret; tells the web route guard a refreshable session exists. */
  sessionHint: 'dt_session',
} as const;
