import {
  PATIENT_CONDITIONS,
  type AnalyticsOverview,
  type AnalyticsRange,
  type ConditionShare,
} from '@doctor-tracker/contracts';
import { utcDateToCalendarDate } from '../../common/query/date-range';
import type { ReadThroughCache } from '../../infrastructure/cache/read-through-cache';
import { resolveAnalyticsWindow } from './analytics-window';
import type { AnalyticsRepository } from './analytics.repository';

const OVERVIEW_CACHE_TTL_SECONDS = 120;
const BUSIEST_DOCTORS_LIMIT = 8;

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly readThroughCache: ReadThroughCache,
  ) {}

  getOverview(range: AnalyticsRange): Promise<AnalyticsOverview> {
    return this.readThroughCache.getOrLoad('analytics', ['overview', range], OVERVIEW_CACHE_TTL_SECONDS, () =>
      this.computeOverview(range),
    );
  }

  private async computeOverview(range: AnalyticsRange): Promise<AnalyticsOverview> {
    const analyticsWindow = resolveAnalyticsWindow(range);
    const currentWindow = { from: analyticsWindow.windowStart, to: analyticsWindow.windowEnd };
    const previousWindow = { from: analyticsWindow.previousWindowStart, to: analyticsWindow.windowStart };
    const repository = this.analyticsRepository;

    // Independent, index-backed queries run concurrently.
    const [
      doctorCount,
      patientCount,
      patientsAdmittedInRange,
      patientsAdmittedInPreviousRange,
      doctorsJoinedInRange,
      admissionsPerBucket,
      doctorJoinsPerBucket,
      busiestDoctors,
      specializationShares,
      conditionShares,
    ] = await Promise.all([
      repository.countDoctors(),
      repository.countPatients(),
      repository.countPatientsAdmittedWithin(currentWindow),
      repository.countPatientsAdmittedWithin(previousWindow),
      repository.countDoctorsJoinedWithin(currentWindow),
      repository.countAdmissionsPerBucket(currentWindow, analyticsWindow.bucketUnit),
      repository.countDoctorJoinsPerBucket(currentWindow, analyticsWindow.bucketUnit),
      repository.findBusiestDoctors(BUSIEST_DOCTORS_LIMIT),
      repository.summarizeSpecializations(),
      this.countPatientsPerCondition(),
    ]);

    return {
      range,
      bucketUnit: analyticsWindow.bucketUnit,
      totals: {
        doctors: doctorCount,
        patients: patientCount,
        criticalPatients: conditionShares.find((share) => share.condition === 'critical')?.patientCount ?? 0,
        averagePatientsPerDoctor: doctorCount === 0 ? 0 : Math.round((patientCount / doctorCount) * 10) / 10,
        patientsAdmittedInRange,
        patientsAdmittedInPreviousRange,
        doctorsJoinedInRange,
      },
      // Buckets with no activity are filled with zeros so charts show a continuous timeline.
      admissionTrend: analyticsWindow.bucketStarts.map((bucketStart) => ({
        bucketStart: utcDateToCalendarDate(bucketStart),
        patientsAdmitted: admissionsPerBucket.get(bucketStart.toISOString()) ?? 0,
        doctorsJoined: doctorJoinsPerBucket.get(bucketStart.toISOString()) ?? 0,
      })),
      busiestDoctors: busiestDoctors.map((doctor) => ({
        doctorId: doctor._id.toString(),
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        patientCount: doctor.patientCount,
      })),
      conditionShares,
      specializationShares,
      generatedAt: new Date().toISOString(),
    };
  }

  private async countPatientsPerCondition(): Promise<ConditionShare[]> {
    const counts = await Promise.all(
      PATIENT_CONDITIONS.map((condition) => this.analyticsRepository.countPatientsWithCondition(condition)),
    );
    return PATIENT_CONDITIONS.map((condition, conditionIndex) => ({
      condition,
      patientCount: counts[conditionIndex] ?? 0,
    }));
  }
}
