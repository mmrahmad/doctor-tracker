import { Router } from 'express';
import type { PatientController } from './patient.controller';

export function createPatientRouter(patientController: PatientController): Router {
  const router = Router();
  router.get('/', patientController.listPatients);
  router.patch('/:patientId', patientController.updatePatient);
  router.delete('/:patientId', patientController.deletePatient);
  return router;
}
