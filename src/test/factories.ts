import type {
  Fault,
  SanctionRequestDetail,
  SanctionRequestSummary,
  Validation,
} from '@/features/sanctions/types'
import type { AppNotification, User, UserSummary } from '@/features/users/types'
import { ACCOUNT_STATUSES, ROLES, VALIDATION_DECISIONS } from '@/shared/config/roles'
import { EMPTY_EMPLOYMENT } from '@/features/users/types'

/**
 * Builders for API-shaped fixtures.
 *
 * Each takes an override patch so a test states only the fields it cares
 * about — which keeps the assertion visible instead of buried in twenty
 * lines of irrelevant setup.
 */

export function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'EMP001',
    firstName: 'Amina',
    lastName: 'Haddad',
    fullName: 'Amina Haddad',
    cin: 'AB12345',
    email: 'amina.haddad@company.com',
    address: null,
    phoneNumber: null,
    gender: null,
    photoPath: null,
    employment: { ...EMPTY_EMPLOYMENT, position: 'Operator', department: 'Assembly' },
    accountStatus: ACCOUNT_STATUSES.ACTIVE,
    role: ROLES.EMPLOYEE,
    supervisorId: null,
    supervisorName: null,
    hasAccount: true,
    createdOn: '2026-01-15T09:00:00Z',
    arabicProfile: null,
    ...overrides,
  }
}

export function anEmployee(overrides: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'EMP001',
    fullName: 'Amina Haddad',
    email: 'amina.haddad@company.com',
    position: 'Operator',
    department: 'Assembly',
    photoPath: null,
    ...overrides,
  }
}

export function aFault(overrides: Partial<Fault> = {}): Fault {
  return {
    id: 1,
    title: 'Unexcused absence',
    category: 'Attendance',
    isValidated: true,
    ...overrides,
  }
}

export function aRequestSummary(
  overrides: Partial<SanctionRequestSummary> = {},
): SanctionRequestSummary {
  return {
    id: 100,
    description: 'Absent without notice',
    requestedOn: '2026-03-02T08:30:00Z',
    employeeId: 'EMP001',
    employeeName: 'Amina Haddad',
    requesterId: 'EMP900',
    requesterName: 'Karim Belhaj',
    faultTitle: 'Unexcused absence',
    progress: { completed: 1, required: 2, display: '1/2' },
    currentValidatorId: 'EMP500',
    isCancelled: false,
    isRefused: false,
    isClosed: false,
    ...overrides,
  }
}

export function aValidation(overrides: Partial<Validation> = {}): Validation {
  return {
    validatorId: 'EMP400',
    validatorName: 'Nadia Alaoui',
    decision: VALIDATION_DECISIONS.APPROVED,
    note: null,
    decidedOn: '2026-03-03T10:00:00Z',
    ...overrides,
  }
}

export function aRequestDetail(
  overrides: Partial<SanctionRequestDetail> = {},
): SanctionRequestDetail {
  const { faultTitle: _ignored, ...summary } = aRequestSummary()

  return {
    ...summary,
    details: 'Third occurrence this quarter.',
    fault: aFault(),
    attachmentPath: null,
    currentValidatorName: 'Youssef Idrissi',
    validations: [aValidation()],
    ...overrides,
  }
}

export function aNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 1,
    message: 'A request is awaiting your decision.',
    raisedOn: '2026-03-04T12:00:00Z',
    isRead: false,
    ...overrides,
  }
}
