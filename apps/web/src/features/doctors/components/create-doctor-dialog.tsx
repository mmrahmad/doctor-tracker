'use client';

import {
  createDoctorRequestSchema,
  DOCTOR_SPECIALIZATIONS,
  type CreateDoctorRequest,
} from '@doctor-tracker/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { describeFieldControl, FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { SelectInput, toSelectOptions } from '@/components/ui/select-input';
import { useIdempotencyKey } from '@/hooks/use-idempotency-key';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { getErrorMessage } from '@/lib/http/api-request-error';
import { useCreateDoctor, useHospitals } from '../hooks/use-doctors';

const EMPTY_DOCTOR_FORM = { fullName: '', specialization: '', hospital: '', phone: '', email: '' };
const DOCTOR_FIELD_NAMES = Object.keys(EMPTY_DOCTOR_FORM);
const SPECIALIZATION_OPTIONS = toSelectOptions(DOCTOR_SPECIALIZATIONS);
const FORM_ID = 'create-doctor-form';

interface CreateDoctorDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateDoctorDialog({ open, onOpenChange }: CreateDoctorDialogProps) {
  const createDoctorMutation = useCreateDoctor();
  const { data: knownHospitals = [] } = useHospitals();
  const [idempotencyKey, renewIdempotencyKey] = useIdempotencyKey();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDoctorRequestSchema),
    defaultValues: EMPTY_DOCTOR_FORM as unknown as CreateDoctorRequest,
  });

  const closeDialog = () => {
    onOpenChange(false);
    reset();
    createDoctorMutation.reset();
  };

  const submitDoctor = handleSubmit((input) =>
    createDoctorMutation.mutate(
      { input, idempotencyKey },
      {
        onSuccess: (createdDoctor) => {
          toast.success(`${createdDoctor.fullName} was added`);
          renewIdempotencyKey();
          closeDialog();
        },
        onError: (error) => {
          if (!applyServerFieldErrors(error, setError, DOCTOR_FIELD_NAMES)) toast.error(getErrorMessage(error));
        },
      },
    ),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => (isOpen ? onOpenChange(true) : closeDialog())}
      title="Add doctor"
      description="Doctors can be assigned patients right after they are added."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={closeDialog} disabled={createDoctorMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={createDoctorMutation.isPending}>
            Add doctor
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submitDoctor} noValidate className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="doctor-full-name" error={errors.fullName?.message} isRequired className="sm:col-span-2">
          <Input
            {...describeFieldControl('doctor-full-name', errors.fullName?.message)}
            {...register('fullName')}
            placeholder="Dr. Jane Cooper"
            autoComplete="off"
          />
        </FormField>

        <FormField label="Specialization" htmlFor="doctor-specialization" error={errors.specialization?.message} isRequired>
          <Controller
            control={control}
            name="specialization"
            render={({ field }) => (
              <SelectInput
                {...describeFieldControl('doctor-specialization', errors.specialization?.message)}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                options={SPECIALIZATION_OPTIONS}
                placeholder="Select specialization"
              />
            )}
          />
        </FormField>

        <FormField label="Hospital" htmlFor="doctor-hospital" error={errors.hospital?.message} isRequired>
          <Input
            {...describeFieldControl('doctor-hospital', errors.hospital?.message)}
            {...register('hospital')}
            list="known-hospitals"
            placeholder="Riverside General Hospital"
            autoComplete="off"
          />
          <datalist id="known-hospitals">
            {knownHospitals.map((hospital) => (
              <option key={hospital} value={hospital} />
            ))}
          </datalist>
        </FormField>

        <FormField label="Email" htmlFor="doctor-email" error={errors.email?.message} isRequired>
          <Input
            {...describeFieldControl('doctor-email', errors.email?.message)}
            {...register('email')}
            type="email"
            placeholder="jane.cooper@hospital.org"
            autoComplete="off"
          />
        </FormField>

        <FormField label="Phone" htmlFor="doctor-phone" error={errors.phone?.message} isRequired>
          <Input
            {...describeFieldControl('doctor-phone', errors.phone?.message)}
            {...register('phone')}
            type="tel"
            placeholder="+1 (555) 010-2030"
            autoComplete="off"
          />
        </FormField>
      </form>
    </Dialog>
  );
}
