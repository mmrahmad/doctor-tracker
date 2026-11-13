import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/class-names';

const badgeVariants = cva(
  'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        primary: 'bg-primary-soft text-primary',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        info: 'bg-info-soft text-info',
        neutral: 'bg-neutral-soft text-neutral',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  /** Shows a small status dot before the label. */
  withDot?: boolean;
  className?: string;
}

export function Badge({ tone, withDot = false, className, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {withDot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
