import type { SanctionDecisionCode } from '@/features/sanctions/types'

export const DECISION_LABELS: Record<SanctionDecisionCode, { fr: string; ar: string }> = {
  avertissement: { fr: 'Avertissement', ar: 'إنذار' },
  blame1: { fr: 'Blâme 1', ar: 'توبيخ 1' },
  blame2: { fr: 'Blâme 2', ar: 'توبيخ 2' },
  blame3: { fr: 'Blâme 3', ar: 'توبيخ 3' },
  ep: { fr: 'Entretien préalable', ar: 'معاينة مسبقة' },
}
