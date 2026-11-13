import { cn } from '@/lib/class-names';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} aria-hidden />;
}
