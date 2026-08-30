import { describe, expect, it } from 'vitest'
import { decodeToken, isTokenExpired } from '@/shared/lib/jwt'
import { ROLES } from '@/shared/config/roles'
import { makeToken } from '@/test/tokens'

describe('decodeToken', () => {
  it('reads the id, name and role from the backend claim URIs', () => {
    const token = makeToken({ userId: 'EMP007', displayName: 'Sara Amrani', role: ROLES.ADMINISTRATOR })

    expect(decodeToken(token)).toMatchObject({
      userId: 'EMP007',
      displayName: 'Sara Amrani',
      role: ROLES.ADMINISTRATOR,
    })
  })

  it('returns null for a malformed token', () => {
    expect(decodeToken('not-a-jwt')).toBeNull()
  })

  // A role the client does not know about must not be trusted: treating it
  // as a valid session would let the UI make authorisation decisions on a
  // value it cannot reason about.
  it('returns null when the role claim is not a known role', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const payload = btoa(
      JSON.stringify({
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'EMP001',
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'SuperUser',
      }),
    )

    expect(decodeToken(`${header}.${payload}.sig`)).toBeNull()
  })

  it('returns null when the subject claim is missing', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }))
    const payload = btoa(
      JSON.stringify({ 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Employee' }),
    )

    expect(decodeToken(`${header}.${payload}.sig`)).toBeNull()
  })
})

describe('isTokenExpired', () => {
  it('is false for a token still in date', () => {
    expect(isTokenExpired(makeToken({ expiresInSeconds: 600 }))).toBe(false)
  })

  it('is true once the expiry has passed', () => {
    expect(isTokenExpired(makeToken({ expiresInSeconds: -1 }))).toBe(true)
  })

  // An unreadable token is treated as expired so a corrupted value in
  // storage sends the user to sign in rather than into a broken session.
  it('treats an unreadable token as expired', () => {
    expect(isTokenExpired('garbage')).toBe(true)
  })
})
