import type { PatientListQuery, PatientSortField } from '@doctor-tracker/contracts';
import type { ClientSession } from 'mongoose';
import { buildDateRangeFilter } from '../../common/query/date-range';
import {
  buildStableSort,
  hasActiveFilters,
  toPageWindow,
  type RecordPage,
} from '../../common/query/pagination';
import { buildKeywordPrefixFilter } from '../../common/query/text-search';
import { PatientModel, type PatientRecord, type PatientRecordWithDoctor } from './patient.model';
import type { NewPatientDocument, PatientChanges } from './patient-persistence';

export interface PatientRepository {
  findPage(query: PatientListQuery): Promise<RecordPage<PatientRecordWithDoctor>>;
  findById(patientId: string, session?: ClientSession): Promise<PatientRecord | null>;
  findByIdWithDoctor(patientId: string): Promise<PatientRecordWithDoctor | null>;
  create(document: NewPatientDocument, session: ClientSession): Promise<PatientRecord>;
  /** Applies changes only if the stored version still matches; returns `null` on a version clash. */
  updateIfVersionMatches(
    patientId: string,
    expectedVersion: number,
    changes: PatientChanges,
    session: ClientSession,
  ): Promise<PatientRecord | null>;
  /** Deletes the patient (optionally only when assigned to `doctorId`) and returns what was removed. */
  deleteById(
    patientId: string,
    session: ClientSession,
    doctorId?: string,
  ): Promise<PatientRecord | null>;
}

const SORT_FIELD_TO_COLUMN: Record<PatientSortField, string> = {
  admittedAt: 'admittedAt',
  fullName: 'normalizedName',
  createdAt: 'createdAt',
};

const LIST_PROJECTION = { normalizedName: 0, searchKeywords: 0 } as const;
const DOCTOR_SUMMARY_POPULATION = { path: 'doctor', select: 'fullName specialization' } as const;

export class MongoPatientRepository implements PatientRepository {
  async findPage(query: PatientListQuery): Promise<RecordPage<PatientRecordWithDoctor>> {
    const filter = buildPatientFilter(query);
    const { skip, limit } = toPageWindow(query);

    const [records, totalItems] = await Promise.all([
      PatientModel.find(filter, LIST_PROJECTION)
        .sort(buildStableSort(SORT_FIELD_TO_COLUMN[query.sortBy], query.sortDirection))
        .skip(skip)
        .limit(limit)
        // One batched `$in` lookup by _id for the whole page, not one query per row.
        .populate(DOCTOR_SUMMARY_POPULATION)
        .lean<PatientRecordWithDoctor[]>()
        .exec(),
      hasActiveFilters(filter)
        ? PatientModel.countDocuments(filter).exec()
        : PatientModel.estimatedDocumentCount().exec(),
    ]);
    return { records, totalItems };
  }

  findById(patientId: string, session?: ClientSession): Promise<PatientRecord | null> {
    return PatientModel.findById(patientId).session(session ?? null).lean<PatientRecord>().exec();
  }

  findByIdWithDoctor(patientId: string): Promise<PatientRecordWithDoctor | null> {
    return PatientModel.findById(patientId, LIST_PROJECTION)
      .populate(DOCTOR_SUMMARY_POPULATION)
      .lean<PatientRecordWithDoctor>()
      .exec();
  }

  async create(document: NewPatientDocument, session: ClientSession): Promise<PatientRecord> {
    const [createdPatient] = await PatientModel.create([document], { session });
    return createdPatient!.toObject() as PatientRecord;
  }

  updateIfVersionMatches(
    patientId: string,
    expectedVersion: number,
    changes: PatientChanges,
    session: ClientSession,
  ): Promise<PatientRecord | null> {
    return PatientModel.findOneAndUpdate(
      { _id: patientId, version: expectedVersion },
      { $set: changes, $inc: { version: 1 } },
      { new: true, session, runValidators: true },
    )
      .lean<PatientRecord>()
      .exec();
  }

  deleteById(patientId: string, session: ClientSession, doctorId?: string): Promise<PatientRecord | null> {
    return PatientModel.findOneAndDelete(
      { _id: patientId, ...(doctorId ? { doctor: doctorId } : {}) },
      { session },
    )
      .lean<PatientRecord>()
      .exec();
  }
}

function buildPatientFilter(query: PatientListQuery): Record<string, unknown> {
  return {
    ...buildKeywordPrefixFilter(query.search),
    ...buildDateRangeFilter('admittedAt', query.dateFrom, query.dateTo),
    ...(query.condition ? { condition: query.condition } : {}),
    ...(query.gender ? { gender: query.gender } : {}),
    ...(query.doctorId ? { doctor: query.doctorId } : {}),
  };
}
