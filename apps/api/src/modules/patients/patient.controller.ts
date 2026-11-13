import {
  createPatientRequestSchema,
  patientListQuerySchema,
  updatePatientRequestSchema,
} from '@doctor-tracker/contracts';
import type { Request, Response } from 'express';
import { parseWithSchema } from '../../common/http/parse-with-schema';
import { readObjectIdParam } from '../../common/http/route-params';
import { sendData, sendNoContent } from '../../common/http/send-response';
import type { PatientService } from './patient.service';

export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  listPatients = async (request: Request, response: Response): Promise<void> => {
    const query = parseWithSchema(patientListQuerySchema, request.query);
    sendData(response, await this.patientService.listPatients(query));
  };

  updatePatient = async (request: Request, response: Response): Promise<void> => {
    const patientId = readObjectIdParam(request, 'patientId');
    const changes = parseWithSchema(updatePatientRequestSchema, request.body);
    sendData(response, await this.patientService.updatePatient(patientId, changes));
  };

  deletePatient = async (request: Request, response: Response): Promise<void> => {
    await this.patientService.deletePatient(readObjectIdParam(request, 'patientId'));
    sendNoContent(response);
  };

  listDoctorPatients = async (request: Request, response: Response): Promise<void> => {
    const doctorId = readObjectIdParam(request, 'doctorId');
    const query = parseWithSchema(patientListQuerySchema, request.query);
    sendData(response, await this.patientService.listDoctorPatients(doctorId, query));
  };

  addPatientToDoctor = async (request: Request, response: Response): Promise<void> => {
    const doctorId = readObjectIdParam(request, 'doctorId');
    const details = parseWithSchema(createPatientRequestSchema, request.body);
    sendData(response, await this.patientService.addPatientToDoctor(doctorId, details), 201);
  };

  removePatientFromDoctor = async (request: Request, response: Response): Promise<void> => {
    const doctorId = readObjectIdParam(request, 'doctorId');
    const patientId = readObjectIdParam(request, 'patientId');
    await this.patientService.deletePatient(patientId, doctorId);
    sendNoContent(response);
  };
}
