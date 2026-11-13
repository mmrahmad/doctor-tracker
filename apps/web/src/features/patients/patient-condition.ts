import { PATIENT_CONDITION_LABELS, type PatientCondition } from '@doctor-tracker/contracts';
import type { BadgeTone } from '@/components/ui/badge';

/** One semantic tone per condition; always shown with a text label, never color alone. */
export const CONDITION_TONES: Record<PatientCondition, BadgeTone> = {
  stable: 'success',
  recovering: 'info',
  under_observation: 'warning',
  critical: 'danger',
  discharged: 'neutral',
};

export function getConditionLabel(condition: PatientCondition): string {
  return PATIENT_CONDITION_LABELS[condition];
}
