import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/class-names';

interface BrandMarkProps {
  /** `inverse` is used on the colored login panel. */
  appearance?: 'default' | 'inverse';
  className?: string;
}

export function BrandMark({ appearance = 'default', className }: BrandMarkProps) {
  const isInverse = appearance === 'inverse';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl',
          isInverse ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-primary text-primary-foreground shadow-card',
        )}
      >
        <HeartPulse className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn('text-[15px] font-semibold', isInverse ? 'text-white' : 'text-foreground')}>
          Doctor Tracker
        </span>
        <span className={cn('text-xs', isInverse ? 'text-white/70' : 'text-muted-foreground')}>Admin console</span>
      </span>
    </div>
  );
}
