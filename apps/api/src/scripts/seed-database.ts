/**
 * Seeds an admin account and realistic demo data, and syncs every index.
 * Idempotent for the admin; demo data is only generated when the doctors collection is empty.
 *
 *   pnpm seed
 */
import { faker } from '@faker-js/faker';
import {
  DOCTOR_SPECIALIZATIONS,
  GENDERS,
  PATIENT_CONDITIONS,
  type PatientCondition,
} from '@doctor-tracker/contracts';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { connectMongo } from '../infrastructure/database/mongo-connection';
import { createLogger } from '../infrastructure/logger';
import { Argon2PasswordHasher } from '../modules/auth/password-hasher';
import { RefreshSessionModel } from '../modules/auth/refresh-session.model';
import { UserModel } from '../modules/auth/user.model';
import { deriveDoctorSearchFields, DoctorModel } from '../modules/doctors/doctor.model';
import { derivePatientSearchFields, PatientModel } from '../modules/patients/patient.model';

const seedSettingsSchema = z.object({
  MONGODB_URI: z.string().min(1),
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(10, 'SEED_ADMIN_PASSWORD must be at least 10 characters'),
  SEED_ADMIN_FULL_NAME: z.string().min(2).default('Avery Admin'),
  SEED_DOCTOR_COUNT: z.coerce.number().int().min(0).max(100_000).default(60),
  SEED_PATIENT_COUNT: z.coerce.number().int().min(0).max(5_000_000).default(2_400),
});

const HOSPITALS = [
  'St. Mary Medical Center',
  'Riverside General Hospital',
  'Northview Clinic',
  'Lakeside Children’s Hospital',
  'Harborview Health',
  'Summit Heart Institute',
  'Greenfield University Hospital',
  'Westbrook Community Hospital',
];

/** Realistic skew: most patients are stable or recovering, few are critical. */
const CONDITION_WEIGHTS: Array<{ value: PatientCondition; weight: number }> = [
  { value: 'stable', weight: 38 },
  { value: 'recovering', weight: 24 },
  { value: 'under_observation', weight: 18 },
  { value: 'discharged', weight: 13 },
  { value: 'critical', weight: 7 },
];

const DIAGNOSES = [
  'Hypertension',
  'Type 2 diabetes',
  'Asthma',
  'Migraine',
  'Fractured radius',
  'Pneumonia',
  'Atrial fibrillation',
  'Gastritis',
  'Anemia',
  'Osteoarthritis',
  'Hypothyroidism',
  'Seasonal allergies',
  'Lower back pain',
  'Anxiety disorder',
  'Dermatitis',
];

const INSERT_BATCH_SIZE = 5_000;
const DAY_IN_MS = 86_400_000;

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Biases dates towards the present so the dashboard shows growth. */
function recentDateWithinDays(maximumDaysAgo: number): Date {
  const recencyBias = Math.pow(Math.random(), 1.6);
  return new Date(Date.now() - recencyBias * maximumDaysAgo * DAY_IN_MS);
}

async function seedAdministrator(settings: z.infer<typeof seedSettingsSchema>): Promise<void> {
  const passwordHash = await new Argon2PasswordHasher().hash(settings.SEED_ADMIN_PASSWORD);
  await UserModel.updateOne(
    { email: settings.SEED_ADMIN_EMAIL.toLowerCase() },
    {
      $set: { fullName: settings.SEED_ADMIN_FULL_NAME, role: 'admin', passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    },
    { upsert: true },
  );
}

function buildDoctorDocuments(doctorCount: number) {
  const usedEmails = new Set<string>();
  return Array.from({ length: doctorCount }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `Dr. ${firstName} ${lastName}`;
    let email = faker.internet.email({ firstName, lastName, provider: 'doctortracker.dev' }).toLowerCase();
    while (usedEmails.has(email)) email = `${faker.string.alphanumeric(4).toLowerCase()}.${email}`;
    usedEmails.add(email);
    const createdAt = recentDateWithinDays(540);

    return {
      _id: new Types.ObjectId(),
      fullName,
      specialization: faker.helpers.arrayElement(DOCTOR_SPECIALIZATIONS),
      hospital: faker.helpers.arrayElement(HOSPITALS),
      phone: faker.helpers.replaceSymbols('+1 (###) ###-####'),
      email,
      patientCount: 0,
      createdAt,
      updatedAt: createdAt,
      ...deriveDoctorSearchFields(fullName, email),
    };
  });
}

async function seedDoctorsAndPatients(settings: z.infer<typeof seedSettingsSchema>): Promise<void> {
  const doctors = buildDoctorDocuments(settings.SEED_DOCTOR_COUNT);
  if (doctors.length === 0) return;
  // Some doctors are busier than others, which makes "patients per doctor" meaningful.
  const doctorPopularity = doctors.map(() => 0.3 + Math.random() * 2);

  let patientBatch: Record<string, unknown>[] = [];
  for (let patientIndex = 0; patientIndex < settings.SEED_PATIENT_COUNT; patientIndex += 1) {
    const doctorIndex = faker.helpers.weightedArrayElement(
      doctors.map((_, index) => ({ value: index, weight: doctorPopularity[index]! })),
    );
    const assignedDoctor = doctors[doctorIndex]!;
    assignedDoctor.patientCount += 1;

    const gender = faker.helpers.arrayElement(GENDERS);
    const firstName = faker.person.firstName(gender === 'other' ? undefined : gender);
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const phone = faker.helpers.replaceSymbols('+1 (###) ###-####');
    const earliestAdmission = Math.max(assignedDoctor.createdAt.getTime(), Date.now() - 420 * DAY_IN_MS);
    const admittedAt = utcMidnight(faker.date.between({ from: earliestAdmission, to: Date.now() }));

    patientBatch.push({
      fullName,
      email,
      phone,
      gender,
      dateOfBirth: utcMidnight(faker.date.birthdate({ mode: 'age', min: 1, max: 92 })),
      condition: faker.helpers.weightedArrayElement(CONDITION_WEIGHTS),
      diagnosis: faker.helpers.arrayElement(DIAGNOSES),
      admittedAt,
      doctor: assignedDoctor._id,
      version: 0,
      createdAt: admittedAt,
      updatedAt: admittedAt,
      ...derivePatientSearchFields(fullName, email, phone),
    });

    if (patientBatch.length === INSERT_BATCH_SIZE) {
      await PatientModel.collection.insertMany(patientBatch, { ordered: false });
      patientBatch = [];
    }
  }
  if (patientBatch.length > 0) await PatientModel.collection.insertMany(patientBatch, { ordered: false });
  // Doctors are inserted last so their denormalized counts match the patients exactly.
  await DoctorModel.collection.insertMany(doctors, { ordered: false });
}

async function seedDatabase(): Promise<void> {
  const logger = createLogger({ level: 'info', prettyPrint: true });
  const settings = seedSettingsSchema.parse(process.env);
  await connectMongo(settings.MONGODB_URI, { autoIndex: false, logger });

  for (const model of [UserModel, RefreshSessionModel, DoctorModel, PatientModel]) {
    await model.syncIndexes();
  }
  logger.info('Indexes synced');

  await seedAdministrator(settings);
  logger.info({ email: settings.SEED_ADMIN_EMAIL }, 'Admin account ready');

  if ((await DoctorModel.estimatedDocumentCount()) > 0) {
    logger.info('Doctors already exist — skipping demo data');
  } else {
    await seedDoctorsAndPatients(settings);
    logger.info(
      { doctors: settings.SEED_DOCTOR_COUNT, patients: settings.SEED_PATIENT_COUNT },
      'Demo data inserted',
    );
  }
  await mongoose.disconnect();
}

seedDatabase().catch(async (error: unknown) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
