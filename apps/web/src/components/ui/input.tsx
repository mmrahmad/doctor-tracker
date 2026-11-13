import type { ComponentProps } from 'react';
import { cn } from '@/lib/class-names';

/** Shared field chrome — also used by the select trigger so every control looks identical. */
export const fieldControlClassName = cn(
  'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-card',
  'placeholder:text-subtle-foreground transition-[border-color,box-shadow] duration-150',
  'hover:border-border-strong focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

export function Input({ className, type = 'text', ...inputProps }: ComponentProps<'input'>) {
  return <input type={type} className={cn(fieldControlClassName, className)} {...inputProps} />;
}
