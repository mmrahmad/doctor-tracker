'use client';

import {
  GENDER_LABELS,
  GENDERS,
  PATIENT_CONDITION_LABELS,
  PATIENT_CONDITIONS,
  PATIENT_SORT_FIELDS,
  type Patient,
  type PatientSortField,
} from '@doctor-tracker/contracts';
import { UserRound } from 'lucide-react';
import { parseAsString, parseAsStringLiteral } from 'nuqs';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { EmptyState, ErrorState } from '@/components/ui/feedback-states';
import { FilterToolbar } from '@/components/ui/filter-toolbar';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { SelectInput, toSelectOptions } from '@/components/ui/select-input';
import { SortSelect, type SortOption } from '@/components/ui/sort-select';
import { DoctorPicker } from '@/features/doctors/components/doctor-picker';
import { useListUrlState } from '@/hooks/use-list-url-state';
import { getErrorMessage } from '@/lib/http/api-request-error';
import { useDeletePatient, usePatientList } from '../hooks/use-patients';
import { PatientFormDialog } from './patient-form-dialog';
import { PatientsTable } from './patients-table';

const patientFilterParsers = {
  condition: parseAsStringLiteral(PATIENT_CONDITIONS),
  gender: parseAsStringLiteral(GENDERS),
  doctorId: parseAsString.withDefault(''),
  sortBy: parseAsStringLiteral(PATIENT_SORT_FIELDS).withDefault('admittedAt'),
};

const PATIENT_SORT_OPTIONS: SortOption<PatientSortField>[] = [
  { label: 'Recently admitted', sortBy: 'admittedAt', sortDirection: 'desc' },
  { label: 'Earliest admitted', sortBy: 'admittedAt', sortDirection: 'asc' },
  { label: 'Name A–Z', sortBy: 'fullName', sortDirection: 'asc' },
  { label: 'Name Z–A', sortBy: 'fullName', sortDirection: 'desc' },
  { label: 'Recently added', sortBy: 'createdAt', sortDirection: 'desc' },
];

const CONDITION_OPTIONS = toSelectOptions(PATIENT_CONDITIONS, PATIENT_CONDITION_LABELS);
const GENDER_OPTIONS = toSelectOptions(GENDERS, GENDER_LABELS);

interface PatientDirectoryProps {
  /** Scopes the directory to one doctor: hides the doctor filter/column and deletes via that doctor. */
  doctorId?: string;
  /** Rendered in the empty state when there are no patients at all. */
  emptyAction?: ReactNode;
}

/** Searchable, filterable, paginated patient list with edit and delete — shared by both patient views. */
export function PatientDirectory({ doctorId, emptyAction }: PatientDirectoryProps) {
  const isScopedToDoctor = Boolean(doctorId);
  const { listState, updateFilters, setPage, setPageSize, clearFilters, activeFilterCount } =
    useListUrlState(patientFilterParsers);
  const patientList = usePatientList({
    ...listState,
    condition: listState.condition ?? undefined,
    gender: listState.gender ?? undefined,
    doctorId: doctorId ?? (listState.doctorId || undefined),
  });
  const deletePatientMutation = useDeletePatient();

  const [patientBeingEdited, setPatientBeingEdited] = useState<Patient | null>(null);
  const [patientPendingDeletion, setPatientPendingDeletion] = useState<Patient | null>(null);

  const confirmDeletion = () => {
    if (!patientPendingDeletion) return;
    const patient = patientPendingDeletion;
    setPatientPendingDeletion(null);
    deletePatientMutation.mutate(
      { patient, doctorId },
      {
        onSuccess: () => toast.success(`${patient.fullName} was deleted`),
        onError: (error) => toast.error(`Could not delete ${patient.fullName}: ${getErrorMessage(error)}`),
      },
    );
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <>
      <FilterToolbar
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        primaryControl={
          <SearchInput
            value={listState.search}
            onValueChange={(search) => updateFilters({ search })}
            placeholder="Search name, email or phone"
          />
        }
      >
        <SelectInput
          aria-label="Condition"
          value={listState.condition ?? ''}
          onValueChange={(condition) => updateFilters({ condition: (condition || null) as typeof listState.condition })}
          options={CONDITION_OPTIONS}
          emptyOptionLabel="All conditions"
          className="lg:w-44"
        />
        <SelectInput
          aria-label="Gender"
          value={listState.gender ?? ''}
          onValueChange={(gender) => updateFilters({ gender: (gender || null) as typeof listState.gender })}
          options={GENDER_OPTIONS}
          emptyOptionLabel="All genders"
          className="lg:w-36"
        />
        {!isScopedToDoctor && (
          <DoctorPicker
            selectedDoctorId={listState.doctorId}
            onSelectedDoctorIdChange={(selectedDoctorId) => updateFilters({ doctorId: selectedDoctorId })}
            placeholder="All doctors"
            isClearable
            className="lg:w-52"
          />
        )}
        <DateRangeFilter
          label="Admitted"
          dateFrom={listState.dateFrom}
          dateTo={listState.dateTo}
          onChange={(dateRange) => updateFilters(dateRange)}
          className="sm:col-span-2 lg:w-80"
        />
        <SortSelect
          options={PATIENT_SORT_OPTIONS}
          sortBy={listState.sortBy}
          sortDirection={listState.sortDirection}
          onSortChange={(sort) => updateFilters(sort)}
          className="lg:w-44"
        />
      </FilterToolbar>

      {patientList.isError ? (
        <ErrorState message={getErrorMessage(patientList.error)} onRetry={() => void patientList.refetch()} />
      ) : (
        <>
          <PatientsTable
            patients={patientList.data?.items}
            isLoading={patientList.isLoading}
            isRefreshing={patientList.isPlaceholderData}
            showDoctorColumn={!isScopedToDoctor}
            onEditPatient={setPatientBeingEdited}
            onDeletePatient={setPatientPendingDeletion}
            emptyState={
              <EmptyState
                icon={UserRound}
                title={hasActiveFilters ? 'No patients match these filters' : 'No patients yet'}
                description={
                  hasActiveFilters
                    ? 'Try a different search term or clear the filters.'
                    : isScopedToDoctor
                      ? 'Patients assigned to this doctor will appear here.'
                      : 'Patients appear here once they are added to a doctor.'
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : (
                    emptyAction
                  )
                }
              />
            }
          />
          {patientList.data && patientList.data.pagination.totalItems > 0 && (
            <Pagination
              pagination={patientList.data.pagination}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="patients"
            />
          )}
        </>
      )}

      <PatientFormDialog
        key={patientBeingEdited?.id ?? 'none'}
        open={Boolean(patientBeingEdited)}
        onOpenChange={(isOpen) => !isOpen && setPatientBeingEdited(null)}
        patient={patientBeingEdited ?? undefined}
      />

      <ConfirmDialog
        open={Boolean(patientPendingDeletion)}
        onOpenChange={(isOpen) => !isOpen && setPatientPendingDeletion(null)}
        title="Delete patient?"
        description={`${patientPendingDeletion?.fullName ?? 'This patient'} will be permanently removed${
          patientPendingDeletion?.doctor ? ` from ${patientPendingDeletion.doctor.fullName}’s list` : ''
        }. This cannot be undone.`}
        confirmLabel="Delete patient"
        onConfirm={confirmDeletion}
      />
    </>
  );
}
