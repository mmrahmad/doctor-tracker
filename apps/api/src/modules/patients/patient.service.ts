import type {
  PaginatedResult,
  Patient,
  PatientDetails,
  PatientListQuery,
  UpdatePatientRequest,
} from '@doctor-tracker/contracts';
import { NotFoundError, StaleVersionError, ValidationError } from '../../common/errors/application-errors';
import { buildPaginatedResult } from '../../common/query/pagination';
import type { ReadThroughCache } from '../../infrastructure/cache/read-through-cache';
import type { TransactionRunner } from '../../infrastructure/database/mongo-connection';
import type { DoctorRepository } from '../doctors/doctor.repository';
import type { DoctorService } from '../doctors/doctor.service';
import { toPatient } from './patient.mapper';
import { toNewPatientDocument, toPatientChanges } from './patient-persistence';
import type { PatientRepository } from './patient.repository';

const LIST_CACHE_TTL_SECONDS = 30;

/**
 * Patient writes touch two collections (patients + the doctor's denormalized `patientCount`), so
 * every write runs in a MongoDB transaction: either both change or neither does.
 */
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly doctorService: DoctorService,
    private readonly transactionRunner: TransactionRunner,
    private readonly readThroughCache: ReadThroughCache,
  ) {}

  listPatients(query: PatientListQuery): Promise<PaginatedResult<Patient>> {
    return this.readThroughCache.getOrLoad('patients', ['list', query], LIST_CACHE_TTL_SECONDS, async () => {
      const { records, totalItems } = await this.patientRepository.findPage(query);
      return buildPaginatedResult(records.map(toPatient), totalItems, query);
    });
  }

  async listDoctorPatients(doctorId: string, query: PatientListQuery): Promise<PaginatedResult<Patient>> {
    await this.doctorService.getDoctor(doctorId);
    return this.listPatients({ ...query, doctorId });
  }

  async addPatientToDoctor(doctorId: string, details: PatientDetails): Promise<Patient> {
    const createdPatient = await this.transactionRunner.run(async (session) => {
      const doctor = await this.doctorRepository.findById(doctorId, session);
      if (!doctor) throw new NotFoundError('Doctor');

      const patientRecord = await this.patientRepository.create(
        toNewPatientDocument(details, doctorId),
        session,
      );
      await this.doctorRepository.adjustPatientCount(doctorId, 1, session);
      return toPatient({
        ...patientRecord,
        doctor: { _id: doctor._id, fullName: doctor.fullName, specialization: doctor.specialization },
      });
    });

    await this.invalidateAffectedCaches();
    return createdPatient;
  }

  async updatePatient(patientId: string, request: UpdatePatientRequest): Promise<Patient> {
    await this.transactionRunner.run(async (session) => {
      const currentPatient = await this.patientRepository.findById(patientId, session);
      if (!currentPatient) throw new NotFoundError('Patient');
      if (currentPatient.version !== request.version) throw new StaleVersionError('Patient');

      const previousDoctorId = currentPatient.doctor.toString();
      const isReassigning = Boolean(request.doctorId && request.doctorId !== previousDoctorId);
      if (isReassigning && !(await this.doctorRepository.findById(request.doctorId!, session))) {
        throw new ValidationError({ doctorId: ['Selected doctor no longer exists'] });
      }

      const updatedPatient = await this.patientRepository.updateIfVersionMatches(
        patientId,
        request.version,
        toPatientChanges(currentPatient, request),
        session,
      );
      if (!updatedPatient) throw new StaleVersionError('Patient');

      if (isReassigning) {
        await this.doctorRepository.adjustPatientCount(previousDoctorId, -1, session);
        await this.doctorRepository.adjustPatientCount(request.doctorId!, 1, session);
      }
    });

    await this.invalidateAffectedCaches();
    const refreshedPatient = await this.patientRepository.findByIdWithDoctor(patientId);
    if (!refreshedPatient) throw new NotFoundError('Patient');
    return toPatient(refreshedPatient);
  }

  /** When `doctorId` is given, the patient is only deleted if it belongs to that doctor. */
  async deletePatient(patientId: string, doctorId?: string): Promise<void> {
    await this.transactionRunner.run(async (session) => {
      const deletedPatient = await this.patientRepository.deleteById(patientId, session, doctorId);
      if (!deletedPatient) throw new NotFoundError('Patient');
      await this.doctorRepository.adjustPatientCount(deletedPatient.doctor.toString(), -1, session);
    });
    await this.invalidateAffectedCaches();
  }

  private invalidateAffectedCaches(): Promise<void> {
    return this.readThroughCache.invalidate('patients', 'doctors', 'analytics');
  }
}
