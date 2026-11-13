'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { fieldControlClassName } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/class-names';
import { useDoctor, useDoctorList } from '../hooks/use-doctors';

const PICKER_RESULT_LIMIT = 8;

interface DoctorPickerProps {
  selectedDoctorId: string;
  onSelectedDoctorIdChange: (doctorId: string) => void;
  placeholder?: string;
  /** Shows a clear button (used in filters, not in required form fields). */
  isClearable?: boolean;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Server-side searchable doctor picker. Scales to any number of doctors because it only ever
 * loads one small page of matches, reusing the doctors list endpoint and its cache.
 */
export function DoctorPicker({
  selectedDoctorId,
  onSelectedDoctorIdChange,
  placeholder = 'Select doctor',
  isClearable = false,
  className,
  ...triggerProps
}: DoctorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: selectedDoctor } = useDoctor(selectedDoctorId || undefined);
  const matchingDoctors = useDoctorList(
    { page: 1, pageSize: PICKER_RESULT_LIMIT, search: searchTerm, sortBy: 'fullName', sortDirection: 'asc' },
    { enabled: isOpen },
  );

  const chooseDoctor = (doctorId: string) => {
    onSelectedDoctorIdChange(doctorId);
    setIsOpen(false);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn('relative', className)}>
        <Popover.Trigger
          {...triggerProps}
          className={cn(fieldControlClassName, 'flex items-center gap-2 text-left', isClearable && selectedDoctorId && 'pr-9')}
        >
          <span className={cn('flex-1 truncate', !selectedDoctorId && 'text-subtle-foreground')}>
            {selectedDoctorId ? (selectedDoctor?.fullName ?? 'Loading…') : placeholder}
          </span>
          {!(isClearable && selectedDoctorId) && (
            <ChevronDown className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
          )}
        </Popover.Trigger>
        {isClearable && selectedDoctorId && (
          <button
            type="button"
            onClick={() => onSelectedDoctorIdChange('')}
            aria-label="Clear doctor filter"
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-72 rounded-xl border border-border bg-surface p-2 shadow-overlay animate-fade-in"
        >
          <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search doctors…" />
          <ul role="listbox" aria-label="Doctors" className="mt-2 max-h-72 overflow-y-auto">
            {matchingDoctors.isLoading && (
              <li className="flex items-center justify-center py-6 text-subtle-foreground">
                <LoaderCircle className="size-4 animate-spin" aria-label="Loading doctors" />
              </li>
            )}
            {matchingDoctors.data?.items.length === 0 && (
              <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">No doctors match “{searchTerm}”.</li>
            )}
            {matchingDoctors.data?.items.map((doctor) => {
              const isSelected = doctor.id === selectedDoctorId;
              return (
                <li key={doctor.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => chooseDoctor(doctor.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
                  >
                    <Avatar fullName={doctor.fullName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">{doctor.fullName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{doctor.specialization}</span>
                    </span>
                    {isSelected && <Check className="size-4 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
