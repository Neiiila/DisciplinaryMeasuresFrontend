import { jwtDecode } from 'jwt-decode'
import type { Role } from '@/shared/config/roles'

// The backend issues standard WS-Federation style claim URIs instead of the
// short `role`/`sub` names, so decoding is centralized here rather than
// repeated (and re-decoded on every call, as the legacy app did) elsewhere.
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const CLAIM_USER_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'

interface RawTokenClaims {
  [CLAIM_ROLE]?: string
  [CLAIM_USER_ID]?: string
  photo?: string
  BU?: string
  exp?: number
}

export interface AuthenticatedUser {
  userId: string
  role: Role
  businessUnit: string | null
  photo: string | null
}

export function decodeToken(token: string): AuthenticatedUser | null {
  try {
    const claims = jwtDecode<RawTokenClaims>(token)
    if (!claims[CLAIM_USER_ID] || !claims[CLAIM_ROLE]) return null

    return {
      userId: claims[CLAIM_USER_ID],
      role: claims[CLAIM_ROLE] as Role,
      businessUnit: claims.BU ?? null,
      photo: claims.photo ?? null,
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
