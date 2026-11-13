import type { ReactNode } from 'react';
import { cn } from '@/lib/class-names';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  isRequired?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + message, with ids wired for screen readers (`aria-describedby`). */
export function FormField({ label, htmlFor, error, hint, isRequired, className, children }: FormFieldProps) {
  const message = error ?? hint;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
        {isRequired && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {message && (
        <p
          id={`${htmlFor}-message`}
          role={error ? 'alert' : undefined}
          className={cn('text-xs', error ? 'text-danger' : 'text-muted-foreground')}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/** Accessibility props for a control rendered inside `FormField`. */
export function describeFieldControl(fieldId: string, error: string | undefined) {
  return {
    id: fieldId,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${fieldId}-message` : undefined,
  };
}
