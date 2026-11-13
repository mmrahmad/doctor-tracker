import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/class-names';
import { formatInteger } from '@/lib/formatters';

interface StatTileProps {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  /** Secondary line, e.g. "+6 joined in range". */
  caption?: string;
  /** Percentage change vs the previous period; `null` hides the trend. */
  percentageChange?: number | null;
}

/** A headline number needs no chart: one big value, a label and an optional trend. */
export function StatTile({ label, value, icon: Icon, caption, percentageChange }: StatTileProps) {
  const hasTrend = percentageChange !== undefined && percentageChange !== null;
  const isIncrease = hasTrend && percentageChange >= 0;
  const TrendIcon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      {value === undefined ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2 text-[28px] leading-9 font-semibold tracking-tight text-foreground tabular-nums">
          {formatInteger(value)}
        </p>
      )}
      <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {hasTrend && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', isIncrease ? 'text-success' : 'text-danger')}>
            <TrendIcon className="size-3.5" aria-hidden />
            {isIncrease ? '+' : ''}
            {percentageChange}%<span className="sr-only">{isIncrease ? ' increase' : ' decrease'}</span>
          </span>
        )}
        {caption && <span>{caption}</span>}
      </div>
    </Card>
  );
}
