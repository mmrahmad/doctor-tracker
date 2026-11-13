'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/class-names';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: string;
  /** Sticky footer, typically the action buttons. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const DIALOG_WIDTHS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export function Dialog({ open, onOpenChange, title, description, footer, size = 'md', children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0a111d]/50 backdrop-blur-[2px] animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-2xl border border-border bg-surface shadow-overlay animate-scale-in focus:outline-none',
            DIALOG_WIDTHS[size],
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 pt-5 pb-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-2" aria-label="Close dialog">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </header>

          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}

          {footer && (
            <footer className="flex flex-col-reverse gap-2 border-t border-border bg-surface-muted/40 px-6 py-4 sm:flex-row sm:justify-end rounded-b-2xl">
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
