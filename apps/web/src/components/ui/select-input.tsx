'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/class-names';
import { fieldControlClassName } from './input';

export interface SelectOption {
  value: string;
  label: string;
}

/** Radix forbids empty-string item values, so "no selection" is represented by this sentinel. */
const EMPTY_OPTION_VALUE = '__empty__';

interface SelectInputProps {
  value: string;
  onValueChange: (nextValue: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  /** When set, adds a first option that clears the selection (e.g. "All specializations"). */
  emptyOptionLabel?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export function SelectInput({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  emptyOptionLabel,
  className,
  ...triggerProps
}: SelectInputProps) {
  const selectedValue = value || (emptyOptionLabel ? EMPTY_OPTION_VALUE : '');

  return (
    <SelectPrimitive.Root
      value={selectedValue}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_OPTION_VALUE ? '' : nextValue)}
    >
      <SelectPrimitive.Trigger
        className={cn(
          fieldControlClassName,
          'flex items-center justify-between gap-2 text-left data-[placeholder]:text-subtle-foreground',
          className,
        )}
        {...triggerProps}
      >
        <span className="truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-50 max-h-[min(var(--radix-select-content-available-height),320px)] min-w-[var(--radix-select-trigger-width)]',
            'overflow-hidden rounded-xl border border-border bg-surface shadow-overlay animate-fade-in',
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {emptyOptionLabel && <SelectOptionItem value={EMPTY_OPTION_VALUE} label={emptyOptionLabel} />}
            {options.map((option) => (
              <SelectOptionItem key={option.value} value={option.value} label={option.label} />
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectOptionItem({ value, label }: SelectOption) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'relative flex h-9 cursor-pointer items-center rounded-lg pr-8 pl-3 text-sm text-foreground outline-none select-none',
        'data-[highlighted]:bg-surface-muted data-[state=checked]:font-medium',
      )}
    >
      <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
        <Check className="size-4 text-primary" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

/** Builds select options from a list of string values with an optional label lookup. */
export function toSelectOptions<TValue extends string>(
  values: readonly TValue[],
  labels?: Record<TValue, string>,
): SelectOption[] {
  return values.map((value) => ({ value, label: labels?.[value] ?? value }));
}
