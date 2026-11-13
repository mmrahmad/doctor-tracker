'use client';

import { GENDER_LABELS, type Patient } from '@doctor-tracker/contracts';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { formatAge, formatDisplayDate } from '@/lib/formatters';
import { ConditionBadge } from './condition-badge';

interface PatientRowActions {
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patient: Patient) => void;
}

function PatientIdentity({ patient }: { patient: Patient }) {
  return (
    <div className="flex max-w-64 min-w-0 items-center gap-3">
      <Avatar fullName={patient.fullName} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{patient.fullName}</p>
        <p className="truncate text-[13px] text-muted-foreground">{patient.email}</p>
      </div>
    </div>
  );
}

function AssignedDoctorLink({ patient }: { patient: Patient }) {
  if (!patient.doctor) return <span className="text-subtle-foreground">Unassigned</span>;
  return (
    <Link href={`/doctors/${patient.doctor.id}`} className="block max-w-52 min-w-0 hover:text-primary">
      <span className="block truncate font-medium">{patient.doctor.fullName}</span>
      <span className="block truncate text-xs text-muted-foreground">{patient.doctor.specialization}</span>
    </Link>
  );
}

function RowActionButtons({ patient, onEditPatient, onDeletePatient }: PatientRowActions & { patient: Patient }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" onClick={() => onEditPatient(patient)} aria-label={`Edit ${patient.fullName}`}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDeletePatient(patient)}
        aria-label={`Delete ${patient.fullName}`}
        className="hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function buildPatientColumns(showDoctorColumn: boolean, rowActions: PatientRowActions): DataTableColumn<Patient>[] {
  const columns: Array<DataTableColumn<Patient> | false> = [
    { id: 'patient', header: 'Patient', renderCell: (patient) => <PatientIdentity patient={patient} />, },
    {
      id: 'demographics',
      header: 'Age · Gender',
      className: 'hidden xl:table-cell',
      renderCell: (patient) => (
        <span className="text-muted-foreground tabular-nums">
          {formatAge(patient.dateOfBirth)} · {GENDER_LABELS[patient.gender]}
        </span>
      ),
    },
    { id: 'condition', header: 'Condition', renderCell: (patient) => <ConditionBadge condition={patient.condition} /> },
    {
      id: 'diagnosis',
      header: 'Diagnosis',
      className: 'hidden 2xl:table-cell',
      renderCell: (patient) => <span className="text-muted-foreground">{patient.diagnosis}</span>,
    },
    showDoctorColumn && {
      id: 'doctor',
      header: 'Doctor',
      renderCell: (patient) => <AssignedDoctorLink patient={patient} />,
    },
    {
      id: 'admitted',
      header: 'Admitted',
      renderCell: (patient) => <span className="text-muted-foreground tabular-nums">{formatDisplayDate(patient.admittedAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'end',
      className: 'w-24',
      renderCell: (patient) => <RowActionButtons patient={patient} {...rowActions} />,
    },
  ];
  return columns.filter((column): column is DataTableColumn<Patient> => Boolean(column));
}

interface PatientsTableProps extends PatientRowActions {
  patients: Patient[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  showDoctorColumn: boolean;
  emptyState: ReactNode;
}

export function PatientsTable({
  patients,
  isLoading,
  isRefreshing,
  showDoctorColumn,
  emptyState,
  onEditPatient,
  onDeletePatient,
}: PatientsTableProps) {
  const rowActions = { onEditPatient, onDeletePatient };
  return (
    <DataTable
      caption="Patients"
      columns={buildPatientColumns(showDoctorColumn, rowActions)}
      rows={patients}
      getRowKey={(patient) => patient.id}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      emptyState={emptyState}
      renderMobileCard={(patient) => (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <PatientIdentity patient={patient} />
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 pl-[52px] text-xs text-muted-foreground">
              <ConditionBadge condition={patient.condition} />
              <span>Admitted {formatDisplayDate(patient.admittedAt)}</span>
              {showDoctorColumn && patient.doctor && <span className="truncate">{patient.doctor.fullName}</span>}
            </div>
          </div>
          <RowActionButtons patient={patient} {...rowActions} />
        </div>
      )}
    />
  );
}
