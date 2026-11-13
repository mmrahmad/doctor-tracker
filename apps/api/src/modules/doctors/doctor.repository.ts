import type { CreateDoctorRequest, DoctorListQuery, DoctorSortField } from '@doctor-tracker/contracts';
import type { ClientSession } from 'mongoose';
import { buildDateRangeFilter } from '../../common/query/date-range';
import {
  buildStableSort,
  hasActiveFilters,
  toPageWindow,
  type RecordPage,
} from '../../common/query/pagination';
import { buildKeywordPrefixFilter } from '../../common/query/text-search';
import { deriveDoctorSearchFields, DoctorModel, type DoctorRecord } from './doctor.model';

export interface DoctorRepository {
  create(input: CreateDoctorRequest): Promise<DoctorRecord>;
  findById(doctorId: string, session?: ClientSession): Promise<DoctorRecord | null>;
  findPage(query: DoctorListQuery): Promise<RecordPage<DoctorRecord>>;
  listHospitals(): Promise<string[]>;
  /** Returns `false` when the doctor does not exist. */
  adjustPatientCount(doctorId: string, delta: number, session: ClientSession): Promise<boolean>;
}

const SORT_FIELD_TO_COLUMN: Record<DoctorSortField, string> = {
  createdAt: 'createdAt',
  fullName: 'normalizedName',
  patientCount: 'patientCount',
};

/** Columns returned by list queries — internal search fields are never sent over the wire. */
const LIST_PROJECTION = { normalizedName: 0, searchKeywords: 0 } as const;

export class MongoDoctorRepository implements DoctorRepository {
  async create(input: CreateDoctorRequest): Promise<DoctorRecord> {
    const createdDoctor = await DoctorModel.create({
      ...input,
      ...deriveDoctorSearchFields(input.fullName, input.email),
    });
    return createdDoctor.toObject() as DoctorRecord;
  }

  findById(doctorId: string, session?: ClientSession): Promise<DoctorRecord | null> {
    return DoctorModel.findById(doctorId, LIST_PROJECTION)
      .session(session ?? null)
      .lean<DoctorRecord>()
      .exec();
  }

  async findPage(query: DoctorListQuery): Promise<RecordPage<DoctorRecord>> {
    const filter = buildDoctorFilter(query);
    const { skip, limit } = toPageWindow(query);

    const [records, totalItems] = await Promise.all([
      DoctorModel.find(filter, LIST_PROJECTION)
        .sort(buildStableSort(SORT_FIELD_TO_COLUMN[query.sortBy], query.sortDirection))
        .skip(skip)
        .limit(limit)
        .lean<DoctorRecord[]>()
        .exec(),
      // Unfiltered totals come from collection metadata (O(1)) instead of counting every document.
      hasActiveFilters(filter)
        ? DoctorModel.countDocuments(filter).exec()
        : DoctorModel.estimatedDocumentCount().exec(),
    ]);
    return { records, totalItems };
  }

  async listHospitals(): Promise<string[]> {
    const hospitals = await DoctorModel.distinct('hospital').exec();
    return hospitals.sort((left, right) => left.localeCompare(right));
  }

  async adjustPatientCount(doctorId: string, delta: number, session: ClientSession): Promise<boolean> {
    const updateResult = await DoctorModel.updateOne(
      { _id: doctorId },
      { $inc: { patientCount: delta } },
      { session },
    ).exec();
    return updateResult.matchedCount === 1;
  }
}

function buildDoctorFilter(query: DoctorListQuery): Record<string, unknown> {
  return {
    ...buildKeywordPrefixFilter(query.search),
    ...buildDateRangeFilter('createdAt', query.dateFrom, query.dateTo),
    ...(query.specialization ? { specialization: query.specialization } : {}),
    ...(query.hospital ? { hospital: query.hospital } : {}),
  };
}
