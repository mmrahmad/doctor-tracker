'use client';

import type { Doctor } from '@doctor-tracker/contracts';
import { ArrowLeft, Building2, CalendarDays, Mail, Phone, Plus, UserRoundX, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/feedback-states';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientDirectory } from '@/features/patients/components/patient-directory';
import { PatientFormDialog } from '@/features/patients/components/patient-form-dialog';
import { formatDisplayDate, formatInteger } from '@/lib/formatters';
import { ApiRequestError, getErrorMessage } from '@/lib/http/api-request-error';
import { useDoctor } from '../hooks/use-doctors';

function ProfileDetail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-[13px] font-medium text-foreground">{children}</dd>
      </div>
    </div>
  );
}

function DoctorProfileCard({ doctor }: { doctor: Doctor }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar fullName={doctor.fullName} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{doctor.fullName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{doctor.specialization}</Badge>
              <span className="text-[13px] text-muted-foreground">{doctor.hospital}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/50 px-5 py-3.5 lg:min-w-48">
          <Users className="size-5 text-primary" aria-hidden />
          <div>
            <p className="text-2xl leading-7 font-semibold text-foreground tabular-nums">{formatInteger(doctor.patientCount)}</p>
            <p className="text-xs text-muted-foreground">Assigned patients</p>
          </div>
        </div>
      </div>
      <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4">
        <ProfileDetail icon={Mail} label="Email">
          <a href={`mailto:${doctor.email}`} className="hover:text-primary">
            {doctor.email}
          </a>
        </ProfileDetail>
        <ProfileDetail icon={Phone} label="Phone">
          <a href={`tel:${doctor.phone.replace(/[^\d+]/g, '')}`} className="tabular-nums hover:text-primary">
            {doctor.phone}
          </a>
        </ProfileDetail>
        <ProfileDetail icon={Building2} label="Hospital">
          {doctor.hospital}
        </ProfileDetail>
        <ProfileDetail icon={CalendarDays} label="Joined">
          {formatDisplayDate(doctor.createdAt)}
        </ProfileDetail>
      </dl>
    </Card>
  );
}

function DoctorProfileSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-9" />
        ))}
      </div>
    </Card>
  );
}

const backToDoctorsLink = (
  <Link href="/doctors" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
    <ArrowLeft className="size-4" aria-hidden />
    All doctors
  </Link>
);

export function DoctorDetailView({ doctorId }: { doctorId: string }) {
  const doctorQuery = useDoctor(doctorId);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  if (doctorQuery.error instanceof ApiRequestError && doctorQuery.error.httpStatus === 404) {
    return (
      <EmptyState
        icon={UserRoundX}
        title="Doctor not found"
        description="This doctor may have been removed, or the link is incorrect."
        action={
          <Button asChild variant="outline">
            <Link href="/doctors">Back to doctors</Link>
          </Button>
        }
      />
    );
  }

  const addPatientButton = (
    <Button onClick={() => setIsAddPatientOpen(true)} disabled={!doctorQuery.data}>
      <Plus />
      Add patient
    </Button>
  );

  return (
    <div className="space-y-6">
      {backToDoctorsLink}

      {doctorQuery.isError ? (
        <Card>
          <ErrorState message={getErrorMessage(doctorQuery.error)} onRetry={() => void doctorQuery.refetch()} />
        </Card>
      ) : doctorQuery.data ? (
        <DoctorProfileCard doctor={doctorQuery.data} />
      ) : (
        <DoctorProfileSkeleton />
      )}

      <Card className="overflow-hidden">
        <CardHeader
          title="Patients"
          description="Everyone currently under this doctor’s care."
          action={addPatientButton}
          className="pb-5"
        />
        <div className="border-t border-border">
          <PatientDirectory doctorId={doctorId} emptyAction={addPatientButton} />
        </div>
      </Card>

      <PatientFormDialog
        key={String(isAddPatientOpen)}
        open={isAddPatientOpen}
        onOpenChange={setIsAddPatientOpen}
        fixedDoctorId={doctorId}
      />
    </div>
  );
}
