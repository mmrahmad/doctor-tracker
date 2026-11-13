import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/class-names';

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap',
    'transition-[background-color,color,box-shadow,opacity] duration-150 select-none',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-card hover:bg-primary-hover',
        outline:
          'border border-border bg-surface text-foreground shadow-card hover:border-border-strong hover:bg-surface-hover',
        ghost: 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
        danger: 'bg-danger text-white shadow-card hover:bg-danger-hover',
        link: 'h-auto px-0 text-primary hover:underline underline-offset-4',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Renders the child element (e.g. a `Link`) with button styling instead of a `<button>`. */
  asChild?: boolean;
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  disabled,
  children,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size }), className)} {...buttonProps}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...buttonProps}
    >
      {isLoading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
