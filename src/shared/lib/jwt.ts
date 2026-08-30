import { jwtDecode } from 'jwt-decode'
import { isRole, type Role } from '@/shared/config/roles'

/**
 * The API signs tokens with .NET's `ClaimTypes` constants, which expand to
 * these WS-Federation claim URIs. Decoding lives here so the shape of the
 * token is asserted in exactly one place.
 *
 * Note there is no `photo` or business-unit claim: the backend deliberately
 * dropped both from the token (they are display data that inflated every
 * request header), so the UI reads the photo from the login response and
 * from `GET /api/users/{id}` instead.
 */
const CLAIM_USER_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

interface RawTokenClaims {
  [CLAIM_USER_ID]?: string
  [CLAIM_NAME]?: string
  [CLAIM_ROLE]?: string
  sub?: string
  email?: string
  exp?: number
}

export interface AuthenticatedUser {
  userId: string
  displayName: string
  role: Role
  email: string | null
}

export function decodeToken(token: string): AuthenticatedUser | null {
  try {
    const claims = jwtDecode<RawTokenClaims>(token)

    const userId = claims[CLAIM_USER_ID] ?? claims.sub
    const role = claims[CLAIM_ROLE]

    if (!userId || !role || !isRole(role)) return null

    return {
      userId,
      displayName: claims[CLAIM_NAME] ?? userId,
      role,
      email: claims.email ?? null,
    }
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<RawTokenClaims>(token)
    if (!exp) return false
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}
