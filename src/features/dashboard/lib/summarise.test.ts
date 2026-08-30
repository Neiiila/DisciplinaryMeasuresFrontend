import { describe, expect, it } from 'vitest'
import { summarise, toMonthlyTrend, toStateBreakdown } from '@/features/dashboard/lib/summarise'
import { aRequestSummary } from '@/test/factories'

describe('summarise', () => {
  it('counts each request under exactly one state', () => {
    const summary = summarise([
      aRequestSummary({ id: 1 }),
      aRequestSummary({ id: 2, isClosed: true }),
      aRequestSummary({ id: 3, isRefused: true, isClosed: true }),
      aRequestSummary({ id: 4, isCancelled: true }),
    ])

    expect(summary).toEqual({ total: 4, inProgress: 1, approved: 1, refused: 1, cancelled: 1 })
    expect(summary.inProgress + summary.approved + summary.refused + summary.cancelled).toBe(summary.total)
  })

  it('returns zeroes for an empty list', () => {
    expect(summarise([])).toEqual({ total: 0, inProgress: 0, approved: 0, refused: 0, cancelled: 0 })
  })
})

describe('toStateBreakdown', () => {
  it('omits states with no requests so the donut stays readable', () => {
    const slices = toStateBreakdown([aRequestSummary({ id: 1 }), aRequestSummary({ id: 2 })])

    expect(slices).toEqual([{ label: 'In progress', value: 2 }])
  })

  it('produces no slices for an empty list', () => {
    expect(toStateBreakdown([])).toEqual([])
  })
})

describe('toMonthlyTrend', () => {
  it('groups requests by the month they were raised, oldest first', () => {
    const trend = toMonthlyTrend([
      aRequestSummary({ id: 1, requestedOn: '2026-02-10T09:00:00Z' }),
      aRequestSummary({ id: 2, requestedOn: '2026-01-05T09:00:00Z' }),
      aRequestSummary({ id: 3, requestedOn: '2026-02-20T09:00:00Z' }),
    ])

    expect(trend).toEqual([
      { month: 'Jan 2026', count: 1 },
      { month: 'Feb 2026', count: 2 },
    ])
  })

  it('keeps only the most recent months requested', () => {
    const requests = ['2026-01', '2026-02', '2026-03', '2026-04'].map((month, index) =>
      aRequestSummary({ id: index, requestedOn: `${month}-01T00:00:00Z` }),
    )

    expect(toMonthlyTrend(requests, 2).map((point) => point.month)).toEqual(['Mar 2026', 'Apr 2026'])
  })

  // A malformed timestamp must not take the whole chart down with it.
  it('skips requests with an unparseable timestamp', () => {
    const trend = toMonthlyTrend([
      aRequestSummary({ id: 1, requestedOn: 'not-a-date' }),
      aRequestSummary({ id: 2, requestedOn: '2026-05-01T00:00:00Z' }),
    ])

    expect(trend).toEqual([{ month: 'May 2026', count: 1 }])
  })
})
