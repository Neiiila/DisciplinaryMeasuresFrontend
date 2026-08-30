/**
 * Roles exactly as the backend's `UserRole` enum serialises them.
 *
 * The API is configured with `JsonStringEnumConverter`, so enums travel as
 * their names ("Administrator"), never as ordinals. Matching that spelling
 * here means a role string from a token or a payload can be compared
 * directly, with no translation table.
 */
export const ROLES = {
  GUEST: 'Guest',
  EMPLOYEE: 'Employee',
  ADMINISTRATOR: 'Administrator',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.GUEST]: 'Guest',
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.ADMINISTRATOR]: 'Administrator',
}

/** Account lifecycle, mirroring the backend's `AccountStatus` enum. */
export const ACCOUNT_STATUSES = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
} as const

export type AccountStatus = (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES]

/** A supervisor's answer on a request, mirroring `ValidationDecision`. */
export const VALIDATION_DECISIONS = {
  MISSED: 'Missed',
  APPROVED: 'Approved',
  REFUSED: 'Refused',
} as const

export type ValidationDecision = (typeof VALIDATION_DECISIONS)[keyof typeof VALIDATION_DECISIONS]

export function isRole(value: string): value is Role {
  return Object.values(ROLES).includes(value as Role)
}
