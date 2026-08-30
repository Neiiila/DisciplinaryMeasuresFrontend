import { format, parseISO, isValid } from 'date-fns'
import type { SanctionRequestSummary } from '@/features/sanctions/types'
import { STATE_LABELS, stateOf, type RequestState } from '@/features/sanctions/lib/sanctionStatus'

export interface DashboardSummary {
  total: number
  inProgress: number
  approved: number
  refused: number
  cancelled: number
}

/**
 * The current API exposes no statistics endpoints — the legacy one had five,
 * none of which survived the backend rewrite. Rather than leave the landing
 * page empty or invent endpoints that do not exist, the figures shown are
 * derived from the request list the user is already entitled to see.
 *
 * Keeping the arithmetic in pure functions here (rather than inline in the
 * page) is what makes it directly unit-testable.
 */
export function summarise(requests: SanctionRequestSummary[]): DashboardSummary {
  const counts: Record<RequestState, number> = {
    inProgress: 0,
    approved: 0,
    refused: 0,
    cancelled: 0,
  }

  for (const request of requests) {
    counts[stateOf(request)] += 1
  }

  return {
    total: requests.length,
    inProgress: counts.inProgress,
    approved: counts.approved,
    refused: counts.refused,
    cancelled: counts.cancelled,
  }
}

export interface StateSlice {
  label: string
  value: number
}

/** Donut input: one slice per state, empty states omitted so the chart stays readable. */
export function toStateBreakdown(requests: SanctionRequestSummary[]): StateSlice[] {
  const summary = summarise(requests)

  return (
    [
      { label: STATE_LABELS.inProgress, value: summary.inProgress },
      { label: STATE_LABELS.approved, value: summary.approved },
      { label: STATE_LABELS.refused, value: summary.refused },
      { label: STATE_LABELS.cancelled, value: summary.cancelled },
    ] satisfies StateSlice[]
  ).filter((slice) => slice.value > 0)
}

export interface MonthlyPoint {
  month: string
  count: number
}

/**
 * Requests grouped by the month they were raised, oldest first, limited to
 * the most recent `monthsToShow` months that actually contain data.
 */
export function toMonthlyTrend(requests: SanctionRequestSummary[], monthsToShow = 6): MonthlyPoint[] {
  const buckets = new Map<string, number>()

  for (const request of requests) {
    const date = parseISO(request.requestedOn)
    if (!isValid(date)) continue

    const key = format(date, 'yyyy-MM')
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-monthsToShow)
    .map(([key, count]) => ({ month: format(parseISO(`${key}-01`), 'MMM yyyy'), count }))
}
