import type {
  DoctorSpecialization,
  PatientCondition,
  SpecializationShare,
  TrendBucketUnit,
} from '@doctor-tracker/contracts';
import type { Model } from 'mongoose';
import { DoctorModel, type DoctorRecord } from '../doctors/doctor.model';
import { PatientModel } from '../patients/patient.model';

export interface DateWindow {
  from: Date;
  to: Date;
}

export interface AnalyticsRepository {
  countDoctors(): Promise<number>;
  countPatients(): Promise<number>;
  countPatientsWithCondition(condition: PatientCondition): Promise<number>;
  countPatientsAdmittedWithin(window: DateWindow): Promise<number>;
  countDoctorsJoinedWithin(window: DateWindow): Promise<number>;
  countAdmissionsPerBucket(window: DateWindow, bucketUnit: TrendBucketUnit): Promise<Map<string, number>>;
  countDoctorJoinsPerBucket(window: DateWindow, bucketUnit: TrendBucketUnit): Promise<Map<string, number>>;
  findBusiestDoctors(limit: number): Promise<DoctorRecord[]>;
  summarizeSpecializations(): Promise<SpecializationShare[]>;
}

interface BucketCountRow {
  _id: Date;
  count: number;
}

/**
 * All queries are index-backed:
 * - totals use collection metadata (`estimatedDocumentCount`), O(1);
 * - per-condition and date-window counts are `COUNT_SCAN`s over `{condition, admittedAt}` /
 *   `{admittedAt}` / `{createdAt}` indexes;
 * - "patients per doctor" reads the denormalized `patientCount` through its index.
 */
export class MongoAnalyticsRepository implements AnalyticsRepository {
  countDoctors(): Promise<number> {
    return DoctorModel.estimatedDocumentCount().exec();
  }

  countPatients(): Promise<number> {
    return PatientModel.estimatedDocumentCount().exec();
  }

  countPatientsWithCondition(condition: PatientCondition): Promise<number> {
    return PatientModel.countDocuments({ condition }).exec();
  }

  countPatientsAdmittedWithin(window: DateWindow): Promise<number> {
    return PatientModel.countDocuments(buildWindowFilter('admittedAt', window)).exec();
  }

  countDoctorsJoinedWithin(window: DateWindow): Promise<number> {
    return DoctorModel.countDocuments(buildWindowFilter('createdAt', window)).exec();
  }

  countAdmissionsPerBucket(window: DateWindow, bucketUnit: TrendBucketUnit): Promise<Map<string, number>> {
    return countPerBucket(PatientModel, 'admittedAt', window, bucketUnit);
  }

  countDoctorJoinsPerBucket(window: DateWindow, bucketUnit: TrendBucketUnit): Promise<Map<string, number>> {
    return countPerBucket(DoctorModel, 'createdAt', window, bucketUnit);
  }

  findBusiestDoctors(limit: number): Promise<DoctorRecord[]> {
    return DoctorModel.find({ patientCount: { $gt: 0 } }, { fullName: 1, specialization: 1, patientCount: 1 })
      .sort({ patientCount: -1, _id: -1 })
      .limit(limit)
      .lean<DoctorRecord[]>()
      .exec();
  }

  async summarizeSpecializations(): Promise<SpecializationShare[]> {
    const rows = await DoctorModel.aggregate<{
      _id: DoctorSpecialization;
      doctorCount: number;
      patientCount: number;
    }>([
      {
        $group: {
          _id: '$specialization',
          doctorCount: { $sum: 1 },
          patientCount: { $sum: '$patientCount' },
        },
      },
      { $sort: { patientCount: -1 } },
    ]).exec();
    return rows.map(({ _id, doctorCount, patientCount }) => ({
      specialization: _id,
      doctorCount,
      patientCount,
    }));
  }
}

function buildWindowFilter(dateField: string, window: DateWindow) {
  return { [dateField]: { $gte: window.from, $lt: window.to } };
}

async function countPerBucket(
  model: Model<any>,
  dateField: string,
  window: DateWindow,
  bucketUnit: TrendBucketUnit,
): Promise<Map<string, number>> {
  const rows = await model
    .aggregate<BucketCountRow>([
      { $match: buildWindowFilter(dateField, window) },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: `$${dateField}`,
              unit: bucketUnit,
              timezone: 'UTC',
              ...(bucketUnit === 'week' ? { startOfWeek: 'monday' } : {}),
            },
          },
          count: { $sum: 1 },
        },
      },
    ])
    .exec();
  return new Map(rows.map((row) => [row._id.toISOString(), row.count]));
}
