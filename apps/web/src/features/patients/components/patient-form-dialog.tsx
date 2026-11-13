'use client';

import {
  GENDER_LABELS,
  GENDERS,
  PATIENT_CONDITION_LABELS,
  PATIENT_CONDITIONS,
  patientDetailsSchema,
  type Patient,
  type UpdatePatientRequest,
} from '@doctor-tracker/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { describeFieldControl, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SelectInput, toSelectOptions } from '@/components/ui/select-input';
import { DoctorPicker } from '@/features/doctors/components/doctor-picker';
import { useIdempotencyKey } from '@/hooks/use-idempotency-key';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { ApiRequestError, getErrorMessage } from '@/lib/http/api-request-error';
import { useAddPatientToDoctor, useUpdatePatient } from '../hooks/use-patients';

const patientFormSchema = patientDetailsSchema.extend({
  doctorId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a doctor'),
});
type PatientFormValues = z.input<typeof patientFormSchema>;
type PatientFormOutput = z.output<typeof patientFormSchema>;

const PATIENT_FIELD_NAMES = Object.keys(patientFormSchema.shape);
const GENDER_OPTIONS = toSelectOptions(GENDERS, GENDER_LABELS);
const CONDITION_OPTIONS = toSelectOptions(PATIENT_CONDITIONS, PATIENT_CONDITION_LABELS);
const FORM_ID = 'patient-form';

function buildInitialValues(patient: Patient | undefined, doctorId: string | undefined): PatientFormValues {
  return {
    fullName: patient?.fullName ?? '',
    email: patient?.email ?? '',
    phone: patient?.phone ?? '',
    gender: patient?.gender ?? ('' as PatientFormValues['gender']),
    dateOfBirth: patient?.dateOfBirth ?? '',
    condition: patient?.condition ?? ('' as PatientFormValues['condition']),
    diagnosis: patient?.diagnosis ?? '',
    admittedAt: patient?.admittedAt ?? new Date().toISOString().slice(0, 10),
    doctorId: patient?.doctor?.id ?? doctorId ?? '',
  };
}

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Present when editing; absent when adding a new patient. */
  patient?: Patient;
  /** Locks the doctor (e.g. when adding from a doctor's page). */
  fixedDoctorId?: string;
}

/**
 * Add/edit patient form. Render with `key={patient?.id ?? 'new'}` so each open starts from fresh
 * values. Edits send only changed fields plus the version the user saw (optimistic concurrency).
 */
export function PatientFormDialog({ open, onOpenChange, patient, fixedDoctorId }: PatientFormDialogProps) {
  const isEditing = Boolean(patient);
  const addPatientMutation = useAddPatientToDoctor();
  const updatePatientMutation = useUpdatePatient();
  const [idempotencyKey, renewIdempotencyKey] = useIdempotencyKey();
  const isSaving = addPatientMutation.isPending || updatePatientMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<PatientFormValues, unknown, PatientFormOutput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: buildInitialValues(patient, fixedDoctorId),
  });

  const closeDialog = () => {
    onOpenChange(false);
    reset(buildInitialValues(patient, fixedDoctorId));
  };

  const handleSaveError = (error: unknown) => {
    if (error instanceof ApiRequestError && error.code === 'STALE_VERSION') {
      toast.error(error.message);
      closeDialog();
      return;
    }
    if (!applyServerFieldErrors(error, setError, PATIENT_FIELD_NAMES)) toast.error(getErrorMessage(error));
  };

  const savePatient = handleSubmit(({ doctorId, ...details }) => {
    if (!patient) {
      addPatientMutation.mutate(
        { doctorId, details, idempotencyKey },
        {
          onSuccess: (createdPatient) => {
            toast.success(`${createdPatient.fullName} was added`);
            renewIdempotencyKey();
            closeDialog();
          },
          onError: handleSaveError,
        },
      );
      return;
    }

    const changedFieldNames = Object.keys(dirtyFields) as Array<keyof PatientFormOutput>;
    if (changedFieldNames.length === 0) {
      closeDialog();
      return;
    }
    const submittedValues: PatientFormOutput = { doctorId, ...details };
    const changes = Object.fromEntries(
      changedFieldNames.map((fieldName) => [fieldName, submittedValues[fieldName]]),
    ) as Partial<UpdatePatientRequest>;

    updatePatientMutation.mutate(
      { patientId: patient.id, changes: { ...changes, version: patient.version } },
      {
        onSuccess: (updatedPatient) => {
          toast.success(`${updatedPatient.fullName} was updated`);
          closeDialog();
        },
        onError: handleSaveError,
      },
    );
  });

  const fieldError = (fieldName: keyof PatientFormValues) => errors[fieldName]?.message;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? onOpenChange(true) : closeDialog())}
      title={isEditing ? 'Edit patient' : 'Add patient'}
      description={
        isEditing ? 'Changes are saved for everyone immediately.' : 'The patient will appear in the doctor’s list right away.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSaving}>
            {isEditing ? 'Save changes' : 'Add patient'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={savePatient} noValidate className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="patient-full-name" error={fieldError('fullName')} isRequired className="sm:col-span-2">
          <Input {...describeFieldControl('patient-full-name', fieldError('fullName'))} {...register('fullName')} placeholder="Jordan Smith" autoComplete="off" />
        </FormField>

        <FormField label="Email" htmlFor="patient-email" error={fieldError('email')} isRequired>
          <Input {...describeFieldControl('patient-email', fieldError('email'))} {...register('email')} type="email" placeholder="jordan@example.com" autoComplete="off" />
        </FormField>

        <FormField label="Phone" htmlFor="patient-phone" error={fieldError('phone')} isRequired>
          <Input {...describeFieldControl('patient-phone', fieldError('phone'))} {...register('phone')} type="tel" placeholder="+1 (555) 010-2030" autoComplete="off" />
        </FormField>

        <FormField label="Gender" htmlFor="patient-gender" error={fieldError('gender')} isRequired>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <SelectInput
                {...describeFieldControl('patient-gender', fieldError('gender'))}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={GENDER_OPTIONS}
                placeholder="Select gender"
              />
            )}
          />
        </FormField>

        <FormField label="Date of birth" htmlFor="patient-date-of-birth" error={fieldError('dateOfBirth')} isRequired>
          <Input
            {...describeFieldControl('patient-date-of-birth', fieldError('dateOfBirth'))}
            {...register('dateOfBirth')}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
          />
        </FormField>

        <FormField label="Condition" htmlFor="patient-condition" error={fieldError('condition')} isRequired>
          <Controller
            control={control}
            name="condition"
            render={({ field }) => (
              <SelectInput
                {...describeFieldControl('patient-condition', fieldError('condition'))}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={CONDITION_OPTIONS}
                placeholder="Select condition"
              />
            )}
          />
        </FormField>

        <FormField label="Admission date" htmlFor="patient-admitted-at" error={fieldError('admittedAt')} isRequired>
          <Input
            {...describeFieldControl('patient-admitted-at', fieldError('admittedAt'))}
            {...register('admittedAt')}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
          />
        </FormField>

        <FormField label="Diagnosis" htmlFor="patient-diagnosis" error={fieldError('diagnosis')} isRequired className="sm:col-span-2">
          <Input {...describeFieldControl('patient-diagnosis', fieldError('diagnosis'))} {...register('diagnosis')} placeholder="e.g. Hypertension" autoComplete="off" />
        </FormField>

        {!fixedDoctorId && (
          <FormField
            label={isEditing ? 'Assigned doctor' : 'Doctor'}
            htmlFor="patient-doctor"
            error={fieldError('doctorId')}
            hint={isEditing ? 'Reassigning moves the patient to the selected doctor’s list.' : undefined}
            isRequired
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="doctorId"
              render={({ field }) => (
                <DoctorPicker
                  {...describeFieldControl('patient-doctor', fieldError('doctorId'))}
                  selectedDoctorId={field.value}
                  onSelectedDoctorIdChange={field.onChange}
                />
              )}
            />
          </FormField>
        )}
      </form>
    </Dialog>
  );
}
