import type { Role } from '@/shared/config/roles'

export interface LoginCredentials {
  /** Either a matriculation number or an email address; the form accepts both. */
  identifier: string
  password: string
}

export interface RegisterInput {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  cin: string | null
  phoneNumber: string | null
  address: string | null
}

/** Mirrors the API's `AuthenticationResponse`. */
export interface AuthenticationResult {
  token: string
  expiresOn: string
  userId: string
  displayName: string
  role: Role
  photoPath: string | null
}

/**
 * Mirrors `RegistrationResponse`. No token is issued: accounts are created
 * `Pending` and an administrator must activate them before first sign-in.
 */
export interface RegistrationResult {
  userId: string
  displayName: string
  awaitingActivation: boolean
}
