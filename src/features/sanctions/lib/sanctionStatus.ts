import type { SanctionRequest } from '@/features/sanctions/types'

export type SanctionOutcome = 'validated' | 'rejected' | 'pending'

/** `true` = validated, `false` = rejected, `null`/undefined = still pending. */
export function outcomeOf(status: boolean | null | undefined): SanctionOutcome {
  if (status === true) return 'validated'
  if (status === false) return 'rejected'
  return 'pending'
}

export const OUTCOME_LABELS: Record<SanctionOutcome, string> = {
  validated: 'Validated',
  rejected: 'Rejected',
  pending: 'Pending',
}

export const OUTCOME_SEVERITY: Record<SanctionOutcome, 'success' | 'danger' | 'warning'> = {
  validated: 'success',
  rejected: 'danger',
  pending: 'warning',
}

/** Parses a "2/3" validation-level string into a 0-100 percentage. */
export function progressPercent(validationLevel: string): number {
  const [done, total] = validationLevel.split('/').map(Number)
  if (!total) return 0
  return Math.round((done / total) * 100)
}

export function isFullyValidated(request: SanctionRequest): boolean {
  return progressPercent(request.validationLevel) >= 100
}
