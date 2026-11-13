'use client';

import { ANALYTICS_RANGE_LABELS, ANALYTICS_RANGES, type AnalyticsOverview } from '@doctor-tracker/contracts';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity, HeartPulse, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/feedback-states';
import { PageHeader } from '@/components/ui/page-header';
import { ConditionBadge } from '@/features/patients/components/condition-badge';
import { cn } from '@/lib/class-names';
import { calculatePercentageChange, formatInteger } from '@/lib/formatters';
import { getErrorMessage } from '@/lib/http/api-request-error';
import { useAnalyticsOverview } from '../hooks/use-analytics-overview';
import { AdmissionTrendChart } from './admission-trend-chart';
import { BarList, type BarListItem } from './bar-list';
import { RangeSelector } from './range-selector';
import { StatTile } from './stat-tile';

const MAX_SPECIALIZATION_ROWS = 6;

function toBusiestDoctorItems(overview: AnalyticsOverview): BarListItem[] {
  return overview.busiestDoctors.map((doctor) => ({
    key: doctor.doctorId,
    label: (
      <Link href={`/doctors/${doctor.doctorId}`} className="hover:text-primary hover:underline underline-offset-4">
        {doctor.fullName}
      </Link>
    ),
    secondaryText: doctor.specialization,
    value: doctor.patientCount,
  }));
}

function toConditionItems(overview: AnalyticsOverview): BarListItem[] {
  return [...overview.conditionShares]
    .sort((left, right) => right.patientCount - left.patientCount)
    .map((share) => ({ key: share.condition, label: <ConditionBadge condition={share.condition} />, value: share.patientCount }));
}

/** Top specializations, with the long tail folded into "Other" instead of more rows. */
function toSpecializationItems(overview: AnalyticsOverview): BarListItem[] {
  const shares = overview.specializationShares;
  const topShares = shares.slice(0, MAX_SPECIALIZATION_ROWS);
  const remainingShares = shares.slice(MAX_SPECIALIZATION_ROWS);
  const items: BarListItem[] = topShares.map((share) => ({
    key: share.specialization,
    label: share.specialization,
    secondaryText: `${formatInteger(share.doctorCount)} doctors`,
    value: share.patientCount,
  }));
  if (remainingShares.length > 0) {
    items.push({
      key: 'other',
      label: `Other (${remainingShares.length})`,
      secondaryText: `${formatInteger(remainingShares.reduce((total, share) => total + share.doctorCount, 0))} doctors`,
      value: remainingShares.reduce((total, share) => total + share.patientCount, 0),
    });
  }
  return items;
}

export function DashboardView() {
  const [selectedRange, setSelectedRange] = useQueryState(
    'range',
    parseAsStringLiteral(ANALYTICS_RANGES).withDefault('30d').withOptions({ history: 'replace', clearOnDefault: true }),
  );
  const overviewQuery = useAnalyticsOverview(selectedRange);
  const overview = overviewQuery.data;
  const totals = overview?.totals;
  const rangeLabel = ANALYTICS_RANGE_LABELS[selectedRange].toLowerCase();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          overview
            ? `Care activity across your network · updated ${formatDistanceToNow(parseISO(overview.generatedAt), { addSuffix: true })}`
            : 'Care activity across your network'
        }
        actions={<RangeSelector selectedRange={selectedRange} onRangeChange={(range) => void setSelectedRange(range)} />}
      />

      {overviewQuery.isError && !overview ? (
        <Card>
          <ErrorState message={getErrorMessage(overviewQuery.error)} onRetry={() => void overviewQuery.refetch()} />
        </Card>
      ) : (
        // While a new range loads, the previous one stays rendered at reduced opacity (no layout jump).
        <div className={cn('space-y-6 transition-opacity duration-200', overviewQuery.isPlaceholderData && 'opacity-60')}>
          <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Total doctors"
              icon={Stethoscope}
              value={totals?.doctors}
              caption={totals ? `+${formatInteger(totals.doctorsJoinedInRange)} joined ${rangeLabel}` : undefined}
            />
            <StatTile
              label="Total patients"
              icon={Users}
              value={totals?.patients}
              caption={totals ? `${totals.averagePatientsPerDoctor} per doctor on average` : undefined}
            />
            <StatTile
              label={`Admitted · ${ANALYTICS_RANGE_LABELS[selectedRange]}`}
              icon={Activity}
              value={totals?.patientsAdmittedInRange}
              percentageChange={
                totals ? calculatePercentageChange(totals.patientsAdmittedInRange, totals.patientsAdmittedInPreviousRange) : null
              }
              caption="vs previous period"
            />
            <StatTile
              label="Critical patients"
              icon={HeartPulse}
              value={totals?.criticalPatients}
              caption={
                totals && totals.patients > 0
                  ? `${Math.round((totals.criticalPatients / totals.patients) * 1000) / 10}% of all patients`
                  : undefined
              }
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Patient admissions"
                description={`Patients admitted per ${overview?.bucketUnit ?? 'day'} · ${rangeLabel}`}
              />
              <CardBody>
                <AdmissionTrendChart points={overview?.admissionTrend} bucketUnit={overview?.bucketUnit ?? 'day'} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Patients by condition" description="Current status of every patient" />
              <CardBody>
                <BarList
                  items={overview && toConditionItems(overview)}
                  valueLabel="patients"
                  emptyMessage="No patients yet."
                  skeletonRowCount={5}
                />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Patients per doctor" description="Doctors with the largest patient lists" />
              <CardBody>
                <BarList
                  items={overview && toBusiestDoctorItems(overview)}
                  valueLabel="patients"
                  emptyMessage="No doctors have patients yet."
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Patients by specialization" description="Where care demand is concentrated" />
              <CardBody>
                <BarList
                  items={overview && toSpecializationItems(overview)}
                  valueLabel="patients"
                  emptyMessage="No specializations yet."
                />
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
