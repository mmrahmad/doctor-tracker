'use client';

import type { Doctor } from '@doctor-tracker/contracts';
import { ChevronRight, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/feedback-states';
import { formatDisplayDate, formatInteger, pluralize } from '@/lib/formatters';

const doctorDetailHref = (doctor: Doctor) => `/doctors/${doctor.id}`;

function DoctorIdentity({ doctor }: { doctor: Doctor }) {
  return (
    <Link href={doctorDetailHref(doctor)} className="group/identity flex max-w-72 min-w-0 items-center gap-3 focus-visible:outline-none">
      <Avatar fullName={doctor.fullName} />
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground group-hover/identity:text-primary group-focus-visible/identity:underline">
          {doctor.fullName}
        </span>
        <span className="block truncate text-[13px] text-muted-foreground">{doctor.email}</span>
      </span>
    </Link>
  );
}

const DOCTOR_COLUMNS: DataTableColumn<Doctor>[] = [
  { id: 'doctor', header: 'Doctor', renderCell: (doctor) => <DoctorIdentity doctor={doctor} />, },
  {
    id: 'specialization',
    header: 'Specialization',
    renderCell: (doctor) => <Badge tone="primary">{doctor.specialization}</Badge>,
  },
  {
    id: 'hospital',
    header: 'Hospital',
    renderCell: (doctor) => <span className="text-muted-foreground">{doctor.hospital}</span>,
    className: 'hidden xl:table-cell',
  },
  {
    id: 'phone',
    header: 'Phone',
    renderCell: (doctor) => <span className="text-muted-foreground tabular-nums">{doctor.phone}</span>,
    className: 'hidden 2xl:table-cell',
  },
  {
    id: 'patients',
    header: 'Patients',
    align: 'end',
    renderCell: (doctor) => <span className="font-medium tabular-nums">{formatInteger(doctor.patientCount)}</span>,
  },
  {
    id: 'joined',
    header: 'Joined',
    renderCell: (doctor) => <span className="text-muted-foreground tabular-nums">{formatDisplayDate(doctor.createdAt)}</span>,
  },
  {
    id: 'open',
    header: '',
    align: 'end',
    className: 'w-12',
    renderCell: (doctor) => (
      <Link
        href={doctorDetailHref(doctor)}
        aria-label={`Open ${doctor.fullName}`}
        className="inline-flex size-8 items-center justify-center rounded-lg text-subtle-foreground hover:bg-surface-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
      </Link>
    ),
  },
];

function DoctorMobileCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <DoctorIdentity doctor={doctor} />
        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-[52px]">
          <Badge tone="primary">{doctor.specialization}</Badge>
          <span className="text-xs text-muted-foreground">{pluralize(doctor.patientCount, 'patient')}</span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
    </div>
  );
}

interface DoctorsTableProps {
  doctors: Doctor[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  hasActiveFilters: boolean;
  emptyAction: ReactNode;
}

export function DoctorsTable({ doctors, isLoading, isRefreshing, hasActiveFilters, emptyAction }: DoctorsTableProps) {
  return (
    <DataTable
      caption="Doctors"
      columns={DOCTOR_COLUMNS}
      rows={doctors}
      getRowKey={(doctor) => doctor.id}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      renderMobileCard={(doctor) => <DoctorMobileCard doctor={doctor} />}
      emptyState={
        <EmptyState
          icon={Stethoscope}
          title={hasActiveFilters ? 'No doctors match these filters' : 'No doctors yet'}
          description={
            hasActiveFilters
              ? 'Try a different search term or clear the filters.'
              : 'Add your first doctor to start assigning patients.'
          }
          action={emptyAction}
        />
      }
    />
  );
}
