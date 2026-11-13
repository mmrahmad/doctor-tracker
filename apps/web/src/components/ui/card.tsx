import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/class-names';

export function Card({ className, ...cardProps }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-2xl border border-border bg-surface shadow-card', className)}
      {...cardProps}
    />
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function CardBody({ className, ...bodyProps }: ComponentProps<'div'>) {
  return <div className={cn('px-5 pt-4 pb-5 sm:px-6', className)} {...bodyProps} />;
}
