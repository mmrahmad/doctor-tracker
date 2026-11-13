import { GENDERS, PATIENT_CONDITIONS, type DoctorSpecialization } from '@doctor-tracker/contracts';
import { model, Schema, type InferSchemaType, type Types } from 'mongoose';
import { buildSearchKeywords, normalizeSearchText } from '../../common/query/text-search';

const patientSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    searchKeywords: { type: [String], required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, enum: GENDERS, required: true },
    dateOfBirth: { type: Date, required: true },
    condition: { type: String, enum: PATIENT_CONDITIONS, required: true },
    diagnosis: { type: String, required: true, trim: true },
    admittedAt: { type: Date, required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    /** Optimistic-concurrency counter; incremented on every update. */
    version: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false, collection: 'patients' },
);

// Every index below backs a concrete query shape (filter → sort) used by the patients list,
// the doctor detail page and the analytics dashboard.
patientSchema.index({ admittedAt: -1, _id: -1 });
patientSchema.index({ doctor: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ condition: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ gender: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ normalizedName: 1, _id: 1 });
patientSchema.index({ createdAt: -1, _id: -1 });
patientSchema.index({ searchKeywords: 1 });

export type PatientRecord = InferSchemaType<typeof patientSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export interface PopulatedDoctorSummary {
  _id: Types.ObjectId;
  fullName: string;
  specialization: DoctorSpecialization;
}

/** A patient whose `doctor` reference has been populated (or is `null` if the doctor is gone). */
export type PatientRecordWithDoctor = Omit<PatientRecord, 'doctor'> & {
  doctor: PopulatedDoctorSummary | null;
};

export const PatientModel = model('Patient', patientSchema);

export function derivePatientSearchFields(fullName: string, email: string, phone: string) {
  return {
    normalizedName: normalizeSearchText(fullName),
    searchKeywords: buildSearchKeywords(fullName, email, phone.replace(/\D/g, '')),
  };
}
