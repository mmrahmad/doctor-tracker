import type { PatientCondition } from '@doctor-tracker/contracts';
import { Badge } from '@/components/ui/badge';
import { CONDITION_TONES, getConditionLabel } from '../patient-condition';

export function ConditionBadge({ condition }: { condition: PatientCondition }) {
  return (
    <Badge tone={CONDITION_TONES[condition]} withDot>
      {getConditionLabel(condition)}
    </Badge>
  );
}
