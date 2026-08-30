import { VALIDATION_DECISIONS, type ValidationDecision } from '@/shared/config/roles'
import type { Progress, SanctionRequestSummary } from '@/features/sanctions/types'

export type RequestState = 'cancelled' | 'refused' | 'approved' | 'inProgress'

/**
 * Collapses the three independent booleans the API returns (`isCancelled`,
 * `isRefused`, `isClosed`) into the single state a row actually displays.
 *
 * Order matters: a request can be both closed and refused, and "Refused" is
 * the more informative label. The legacy client rendered these from a
 * `bool?` whose meaning was documented only in a trailing comment, and each
 * of its four list screens re-implemented the mapping slightly differently.
 */
export function stateOf(request: Pick<SanctionRequestSummary, 'isCancelled' | 'isRefused' | 'isClosed'>): RequestState {
  if (request.isCancelled) return 'cancelled'
  if (request.isRefused) return 'refused'
  if (request.isClosed) return 'approved'
  return 'inProgress'
}

export const STATE_LABELS: Record<RequestState, string> = {
  cancelled: 'Cancelled',
  refused: 'Refused',
  approved: 'Approved',
  inProgress: 'In progress',
}

export const STATE_SEVERITY: Record<RequestState, 'success' | 'danger' | 'warning' | 'secondary'> = {
  cancelled: 'secondary',
  refused: 'danger',
  approved: 'success',
  inProgress: 'warning',
}

export const DECISION_LABELS: Record<ValidationDecision, string> = {
  [VALIDATION_DECISIONS.MISSED]: 'No answer',
  [VALIDATION_DECISIONS.APPROVED]: 'Approved',
  [VALIDATION_DECISIONS.REFUSED]: 'Refused',
}

export const DECISION_SEVERITY: Record<ValidationDecision, 'success' | 'danger' | 'secondary'> = {
  [VALIDATION_DECISIONS.MISSED]: 'secondary',
  [VALIDATION_DECISIONS.APPROVED]: 'success',
  [VALIDATION_DECISIONS.REFUSED]: 'danger',
}

/** Approval progress as a 0-100 percentage, for the progress bar. */
export function progressPercent(progress: Progress): number {
  if (progress.required <= 0) return 0
  return Math.round((progress.completed / progress.required) * 100)
}

/** Whether the given user is the one this request is currently waiting on. */
export function isAwaiting(
  request: Pick<SanctionRequestSummary, 'currentValidatorId' | 'isCancelled' | 'isRefused' | 'isClosed'>,
  userId: string,
): boolean {
  return stateOf(request) === 'inProgress' && request.currentValidatorId === userId
}
