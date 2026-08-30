import { ROLES, type Role } from '@/shared/config/roles'

const CLAIM_USER_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function base64Url(value: object): string {
  const json = JSON.stringify(value)
  const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Builds an unsigned JWT with the same claim URIs the backend emits.
 *
 * The signature is never verified client-side, so a placeholder is enough to
 * exercise decoding, expiry handling and the guards.
 */
export function makeToken({
  userId = 'EMP001',
  displayName = 'Amina Haddad',
  role = ROLES.EMPLOYEE as Role,
  expiresInSeconds = 3600,
}: {
  userId?: string
  displayName?: string
  role?: Role
  expiresInSeconds?: number
} = {}): string {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64Url({
    [CLAIM_USER_ID]: userId,
    [CLAIM_NAME]: displayName,
    [CLAIM_ROLE]: role,
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })

  return `${header}.${payload}.signature-not-verified-client-side`
}
