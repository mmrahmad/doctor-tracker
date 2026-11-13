'use client';

import { DOCTOR_SORT_FIELDS, DOCTOR_SPECIALIZATIONS, type DoctorSortField } from '@doctor-tracker/contracts';
import { Plus } from 'lucide-react';
import { parseAsString, parseAsStringLiteral } from 'nuqs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { ErrorState } from '@/components/ui/feedback-states';
import { FilterToolbar } from '@/components/ui/filter-toolbar';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { SelectInput, toSelectOptions } from '@/components/ui/select-input';
import { SortSelect, type SortOption } from '@/components/ui/sort-select';
import { useListUrlState } from '@/hooks/use-list-url-state';
import { getErrorMessage } from '@/lib/http/api-request-error';
import { pluralize } from '@/lib/formatters';
import { useDoctorList, useHospitals } from '../hooks/use-doctors';
import { CreateDoctorDialog } from './create-doctor-dialog';
import { DoctorsTable } from './doctors-table';

const doctorFilterParsers = {
  specialization: parseAsStringLiteral(DOCTOR_SPECIALIZATIONS),
  hospital: parseAsString.withDefault(''),
  sortBy: parseAsStringLiteral(DOCTOR_SORT_FIELDS).withDefault('createdAt'),
};

const DOCTOR_SORT_OPTIONS: SortOption<DoctorSortField>[] = [
  { label: 'Newest first', sortBy: 'createdAt', sortDirection: 'desc' },
  { label: 'Oldest first', sortBy: 'createdAt', sortDirection: 'asc' },
  { label: 'Name A–Z', sortBy: 'fullName', sortDirection: 'asc' },
  { label: 'Name Z–A', sortBy: 'fullName', sortDirection: 'desc' },
  { label: 'Most patients', sortBy: 'patientCount', sortDirection: 'desc' },
];

const SPECIALIZATION_OPTIONS = toSelectOptions(DOCTOR_SPECIALIZATIONS);

export function DoctorsView() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { listState, updateFilters, setPage, setPageSize, clearFilters, activeFilterCount } =
    useListUrlState(doctorFilterParsers);
  const doctorList = useDoctorList({ ...listState, specialization: listState.specialization ?? undefined });
  const { data: hospitals = [] } = useHospitals();

  const addDoctorButton = (
    <Button onClick={() => setIsCreateDialogOpen(true)}>
      <Plus />
      Add doctor
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Doctors"
        description={
          doctorList.data
            ? `${pluralize(doctorList.data.pagination.totalItems, 'doctor')} ${activeFilterCount ? 'match your filters' : 'in your network'}`
            : 'Manage doctors and their patients.'
        }
        actions={addDoctorButton}
      />

      <Card className="overflow-hidden">
        <FilterToolbar
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          primaryControl={
            <SearchInput
              value={listState.search}
              onValueChange={(search) => updateFilters({ search })}
              placeholder="Search name or email"
            />
          }
        >
          <SelectInput
            aria-label="Specialization"
            value={listState.specialization ?? ''}
            onValueChange={(specialization) =>
              updateFilters({ specialization: (specialization || null) as typeof listState.specialization })
            }
            options={SPECIALIZATION_OPTIONS}
            emptyOptionLabel="All specializations"
            className="lg:w-48"
          />
          <SelectInput
            aria-label="Hospital"
            value={listState.hospital}
            onValueChange={(hospital) => updateFilters({ hospital })}
            options={toSelectOptions(hospitals)}
            emptyOptionLabel="All hospitals"
            className="lg:w-48"
          />
          <DateRangeFilter
            label="Joined"
            dateFrom={listState.dateFrom}
            dateTo={listState.dateTo}
            onChange={(dateRange) => updateFilters(dateRange)}
            className="sm:col-span-2 lg:w-80"
          />
          <SortSelect
            options={DOCTOR_SORT_OPTIONS}
            sortBy={listState.sortBy}
            sortDirection={listState.sortDirection}
            onSortChange={(sort) => updateFilters(sort)}
            className="lg:w-40"
          />
        </FilterToolbar>

        {doctorList.isError ? (
          <ErrorState message={getErrorMessage(doctorList.error)} onRetry={() => void doctorList.refetch()} />
        ) : (
          <>
            <DoctorsTable
              doctors={doctorList.data?.items}
              isLoading={doctorList.isLoading}
              isRefreshing={doctorList.isPlaceholderData}
              hasActiveFilters={activeFilterCount > 0}
              emptyAction={
                activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  addDoctorButton
                )
              }
            />
            {doctorList.data && doctorList.data.pagination.totalItems > 0 && (
              <Pagination
                pagination={doctorList.data.pagination}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="doctors"
              />
            )}
          </>
        )}
      </Card>

      <CreateDoctorDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  );
}
