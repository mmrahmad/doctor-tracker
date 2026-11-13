import { Router, type RequestHandler } from 'express';
import type { PatientController } from '../patients/patient.controller';
import type { DoctorController } from './doctor.controller';

export interface DoctorRouterDependencies {
  doctorController: DoctorController;
  patientController: PatientController;
  idempotency: RequestHandler;
}

export function createDoctorRouter({
  doctorController,
  patientController,
  idempotency,
}: DoctorRouterDependencies): Router {
  const router = Router();
  router.get('/', doctorController.listDoctors);
  router.post('/', idempotency, doctorController.createDoctor);
  // Static segment registered before `/:doctorId` so it is not captured as an id.
  router.get('/hospitals', doctorController.listHospitals);
  router.get('/:doctorId', doctorController.getDoctor);

  router.get('/:doctorId/patients', patientController.listDoctorPatients);
  router.post('/:doctorId/patients', idempotency, patientController.addPatientToDoctor);
  router.delete('/:doctorId/patients/:patientId', patientController.removePatientFromDoctor);
  return router;
}
