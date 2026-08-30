import { describe, expect, it } from 'vitest'
import { isAwaiting, progressPercent, stateOf } from '@/features/sanctions/lib/sanctionStatus'
import { aRequestSummary } from '@/test/factories'

describe('stateOf', () => {
  it('reports an open request as in progress', () => {
    expect(stateOf(aRequestSummary())).toBe('inProgress')
  })

  it('reports a closed request as approved', () => {
    expect(stateOf(aRequestSummary({ isClosed: true }))).toBe('approved')
  })

  it('reports a refused request as refused', () => {
    expect(stateOf(aRequestSummary({ isRefused: true, isClosed: true }))).toBe('refused')
  })

  // The API can return isRefused and isClosed together, since refusing also
  // closes the circuit. "Refused" is the more informative of the two.
  it('prefers refused over approved when both flags are set', () => {
    expect(stateOf(aRequestSummary({ isRefused: true, isClosed: true }))).toBe('refused')
  })

  it('prefers cancelled over every other flag', () => {
    const request = aRequestSummary({ isCancelled: true, isRefused: true, isClosed: true })
    expect(stateOf(request)).toBe('cancelled')
  })
})

describe('progressPercent', () => {
  it('converts completed/required into a percentage', () => {
    expect(progressPercent({ completed: 1, required: 2, display: '1/2' })).toBe(50)
    expect(progressPercent({ completed: 3, required: 3, display: '3/3' })).toBe(100)
  })

  it('rounds to the nearest whole percent', () => {
    expect(progressPercent({ completed: 1, required: 3, display: '1/3' })).toBe(33)
  })

  // Guards the progress bar against a divide-by-zero when a request has no
  // validators configured, which would otherwise render NaN.
  it('returns zero when nothing is required', () => {
    expect(progressPercent({ completed: 0, required: 0, display: '0/0' })).toBe(0)
  })
})

describe('isAwaiting', () => {
  it('is true for the current validator on an open request', () => {
    const request = aRequestSummary({ currentValidatorId: 'EMP500' })
    expect(isAwaiting(request, 'EMP500')).toBe(true)
  })

  it('is false for anyone else', () => {
    const request = aRequestSummary({ currentValidatorId: 'EMP500' })
    expect(isAwaiting(request, 'EMP001')).toBe(false)
  })

  // A settled request must never offer Approve/Refuse buttons, even to the
  // person who was the last validator on it.
  it('is false once the request is closed, refused or cancelled', () => {
    for (const settled of [{ isClosed: true }, { isRefused: true }, { isCancelled: true }]) {
      const request = aRequestSummary({ currentValidatorId: 'EMP500', ...settled })
      expect(isAwaiting(request, 'EMP500')).toBe(false)
    }
  })

  it('is false when no validator is assigned', () => {
    expect(isAwaiting(aRequestSummary({ currentValidatorId: null }), 'EMP500')).toBe(false)
  })
})
