import type { AccountStatus, Role } from '@/shared/config/roles'

/**
 * These mirror the API contracts one-for-one (`UserResponse`,
 * `CreateUserRequest`, ...). The backend serialises with .NET's default
 * camelCase policy, so no field renaming is needed — unlike the legacy API,
 * whose `first_Name`/`business_Unit` spellings had to be mapped.
 */

/** HR attributes, nested under `employment` on every user payload. */
export interface Employment {
  hiringDate: string | null
  status: string | null
  contractType: string | null
  position: string | null
  localJobTitle: string | null
  siteCode: string | null
  site: string | null
  department: string | null
  businessUnit: string | null
  segment: string | null
}

export interface ArabicProfile {
  firstName: string | null
  lastName: string | null
  address: string | null
}

export interface User {
  id: string
  firstName: string
  lastName: string
  fullName: string
  cin: string | null
  email: string | null
  address: string | null
  phoneNumber: string | null
  gender: string | null
  photoPath: string | null
  employment: Employment
  accountStatus: AccountStatus
  role: Role
  supervisorId: string | null
  supervisorName: string | null
  hasAccount: boolean
  createdOn: string
  arabicProfile: ArabicProfile | null
}

/** Trimmed projection returned by the employee directory, for pickers and lists. */
export interface UserSummary {
  id: string
  fullName: string
  email: string | null
  position: string | null
  department: string | null
  photoPath: string | null
}

export interface CreateUserInput {
  id: string
  firstName: string
  lastName: string
  cin: string | null
  email: string | null
  password: string | null
  address: string | null
  phoneNumber: string | null
  gender: string | null
  supervisorId: string | null
  role: Role
  employment: Employment
}

export type UpdateUserInput = Omit<CreateUserInput, 'id' | 'password'>

export interface OpenAccountInput {
  email: string
  password: string
  role: Role
}

export const EMPTY_EMPLOYMENT: Employment = {
  hiringDate: null,
  status: null,
  contractType: null,
  position: null,
  localJobTitle: null,
  siteCode: null,
  site: null,
  department: null,
  businessUnit: null,
  segment: null,
}

export interface AppNotification {
  id: number
  message: string
  raisedOn: string
  isRead: boolean
}
