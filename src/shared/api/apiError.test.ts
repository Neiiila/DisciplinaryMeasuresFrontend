import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { toApiError } from '@/shared/api/apiError'

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  } as never)
}

describe('toApiError', () => {
  /**
   * The API renders failures as RFC 7807 problem details: `title` is display
   * text and `code` is the stable identifier it documents for branching.
   */
  it('reads the title and code out of problem details', () => {
    const error = toApiError(axiosErrorWith(409, { title: 'That email is taken.', code: 'user.email_taken' }))

    expect(error).toEqual({ message: 'That email is taken.', code: 'user.email_taken', status: 409 })
  })

  it('falls back to detail when no title is present', () => {
    expect(toApiError(axiosErrorWith(400, { detail: 'Cite a fault.' })).message).toBe('Cite a fault.')
  })

  it('distinguishes an unreachable server from a rejected request', () => {
    const networkError = new AxiosError('Network Error', 'ERR_NETWORK')

    expect(toApiError(networkError)).toEqual({
      message: 'Could not reach the server. Check that the API is running.',
      code: null,
      status: null,
    })
  })

  // A bare status with no body still has to produce something a user can
  // act on, rather than the generic fallback.
  it('explains common statuses that arrive with an empty body', () => {
    expect(toApiError(axiosErrorWith(401, '')).message).toMatch(/session has expired/i)
    expect(toApiError(axiosErrorWith(403, '')).message).toMatch(/do not have permission/i)
    expect(toApiError(axiosErrorWith(404, '')).message).toMatch(/no longer exists/i)
  })

  it('passes through a plain-text error body', () => {
    expect(toApiError(axiosErrorWith(400, 'Nope.')).message).toBe('Nope.')
  })

  it('handles a plain Error and an unknown throw', () => {
    expect(toApiError(new Error('boom')).message).toBe('boom')
    expect(toApiError('a string', 'fallback used').message).toBe('fallback used')
  })
})
