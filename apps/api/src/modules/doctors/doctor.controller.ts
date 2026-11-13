import { createDoctorRequestSchema, doctorListQuerySchema } from '@doctor-tracker/contracts';
import type { Request, Response } from 'express';
import { parseWithSchema } from '../../common/http/parse-with-schema';
import { readObjectIdParam } from '../../common/http/route-params';
import { sendData } from '../../common/http/send-response';
import type { DoctorService } from './doctor.service';

export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  listDoctors = async (request: Request, response: Response): Promise<void> => {
    const query = parseWithSchema(doctorListQuerySchema, request.query);
    sendData(response, await this.doctorService.listDoctors(query));
  };

  listHospitals = async (_request: Request, response: Response): Promise<void> => {
    sendData(response, await this.doctorService.listHospitals());
  };

  getDoctor = async (request: Request, response: Response): Promise<void> => {
    const doctorId = readObjectIdParam(request, 'doctorId');
    sendData(response, await this.doctorService.getDoctor(doctorId));
  };

  createDoctor = async (request: Request, response: Response): Promise<void> => {
    const input = parseWithSchema(createDoctorRequestSchema, request.body);
    sendData(response, await this.doctorService.createDoctor(input), 201);
  };
}
