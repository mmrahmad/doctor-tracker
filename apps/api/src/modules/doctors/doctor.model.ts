import { DOCTOR_SPECIALIZATIONS } from '@doctor-tracker/contracts';
import { model, Schema, type InferSchemaType, type Types } from 'mongoose';
import { buildSearchKeywords, normalizeSearchText } from '../../common/query/text-search';

const doctorSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    /** Lower-cased, accent-free name used for case-insensitive sorting. */
    normalizedName: { type: String, required: true },
    /** Word prefixes of name + email; see `common/query/text-search.ts`. */
    searchKeywords: { type: [String], required: true },
    specialization: { type: String, enum: DOCTOR_SPECIALIZATIONS, required: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Denormalized count, maintained transactionally with patient writes. */
    patientCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false, collection: 'doctors' },
);

// Every index below backs a concrete query shape (filter → sort) used by the doctors list.
doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ normalizedName: 1, _id: 1 });
doctorSchema.index({ patientCount: -1, _id: -1 });
doctorSchema.index({ searchKeywords: 1 });

export type DoctorRecord = InferSchemaType<typeof doctorSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const DoctorModel = model('Doctor', doctorSchema);

export function deriveDoctorSearchFields(fullName: string, email: string) {
  return {
    normalizedName: normalizeSearchText(fullName),
    searchKeywords: buildSearchKeywords(fullName, email),
  };
}
