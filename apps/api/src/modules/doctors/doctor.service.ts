import type {
  CreateDoctorRequest,
  Doctor,
  DoctorListQuery,
  PaginatedResult,
} from '@doctor-tracker/contracts';
import { NotFoundError } from '../../common/errors/application-errors';
import { buildPaginatedResult } from '../../common/query/pagination';
import type { ReadThroughCache } from '../../infrastructure/cache/read-through-cache';
import { toDoctor } from './doctor.mapper';
import type { DoctorRepository } from './doctor.repository';

const CACHE_TTL_SECONDS = {
  list: 30,
  detail: 60,
  hospitals: 300,
} as const;

export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly readThroughCache: ReadThroughCache,
  ) {}

  listDoctors(query: DoctorListQuery): Promise<PaginatedResult<Doctor>> {
    return this.readThroughCache.getOrLoad('doctors', ['list', query], CACHE_TTL_SECONDS.list, async () => {
      const { records, totalItems } = await this.doctorRepository.findPage(query);
      return buildPaginatedResult(records.map(toDoctor), totalItems, query);
    });
  }

  async getDoctor(doctorId: string): Promise<Doctor> {
    const doctor = await this.readThroughCache.getOrLoad(
      'doctors',
      ['detail', doctorId],
      CACHE_TTL_SECONDS.detail,
      async () => {
        const record = await this.doctorRepository.findById(doctorId);
        return record ? toDoctor(record) : null;
      },
    );
    if (!doctor) throw new NotFoundError('Doctor');
    return doctor;
  }

  listHospitals(): Promise<string[]> {
    return this.readThroughCache.getOrLoad('doctors', ['hospitals'], CACHE_TTL_SECONDS.hospitals, () =>
      this.doctorRepository.listHospitals(),
    );
  }

  async createDoctor(input: CreateDoctorRequest): Promise<Doctor> {
    const createdRecord = await this.doctorRepository.create(input);
    await this.readThroughCache.invalidate('doctors', 'analytics');
    return toDoctor(createdRecord);
  }
}
