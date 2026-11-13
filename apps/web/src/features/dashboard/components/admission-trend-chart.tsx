'use client';

import type { TrendBucketUnit, TrendPoint } from '@doctor-tracker/contracts';
import { format, parseISO } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInteger } from '@/lib/formatters';

const AXIS_LABEL_FORMATS: Record<TrendBucketUnit, string> = { day: 'MMM d', week: 'MMM d', month: 'MMM' };
const TOOLTIP_LABEL_FORMATS: Record<TrendBucketUnit, string> = {
  day: 'EEE, MMM d, yyyy',
  week: "'Week of' MMM d, yyyy",
  month: 'MMMM yyyy',
};
const CHART_HEIGHT_PX = 280;
const AXIS_TICK_STYLE = { fill: 'var(--subtle-foreground)', fontSize: 12 };

interface AdmissionTrendChartProps {
  points: TrendPoint[] | undefined;
  bucketUnit: TrendBucketUnit;
}

interface TrendTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value?: number }>;
  bucketUnit: TrendBucketUnit;
}

/** Value leads (strong), the date follows (secondary); keyed with a short line, not a box. */
function TrendTooltip({ active, label, payload, bucketUnit }: TrendTooltipProps) {
  if (!active || !label || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-overlay">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground tabular-nums">
        <span className="h-0.5 w-3 rounded-full bg-chart-series" aria-hidden />
        {formatInteger(payload[0]?.value ?? 0)} admitted
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{format(parseISO(label), TOOLTIP_LABEL_FORMATS[bucketUnit])}</p>
    </div>
  );
}

export function AdmissionTrendChart({ points, bucketUnit }: AdmissionTrendChartProps) {
  if (!points) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <>
      <div style={{ height: CHART_HEIGHT_PX }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="admission-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-series)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--chart-series)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="bucketStart"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK_STYLE}
              tickMargin={10}
              minTickGap={24}
              tickFormatter={(bucketStart: string) => format(parseISO(bucketStart), AXIS_LABEL_FORMATS[bucketUnit])}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK_STYLE}
              allowDecimals={false}
              width={44}
              tickFormatter={(value: number) => formatInteger(value)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
              content={<TrendTooltip bucketUnit={bucketUnit} />}
            />
            <Area
              type="monotone"
              dataKey="patientsAdmitted"
              stroke="var(--chart-series)"
              strokeWidth={2}
              fill="url(#admission-trend-fill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--chart-series)' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table view of the same data for screen readers. */}
      <table className="sr-only">
        <caption>Patients admitted per {bucketUnit}</caption>
        <thead>
          <tr>
            <th scope="col">Period starting</th>
            <th scope="col">Patients admitted</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.bucketStart}>
              <td>{point.bucketStart}</td>
              <td>{point.patientsAdmitted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
