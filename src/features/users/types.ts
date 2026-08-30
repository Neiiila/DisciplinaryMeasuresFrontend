import type { Employee, EmployeeDto } from '@/features/employees/types'

export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'Blocked', 'Deleted'] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

/** A user account is an employee record augmented with login/account fields. */
export interface UserAccount extends Employee {
  accountStatus: AccountStatus
  role: string
}

export interface UserAccountDto extends EmployeeDto {
  account_Status: AccountStatus
  role: string
}

export interface CreateUserInput {
  employee: Employee
  account: {
    email: string
    accountStatus: AccountStatus
    password: string
    role: string
  } | null
  photo: File | null
  sendCredentials: boolean
}

export interface UpdateAccountInput {
  email: string
  accountStatus: AccountStatus
  password: string
  role: string
  sendCredentials: boolean
}

export interface AttachAccountInput {
  employeeId: string
  email: string
  accountStatus: AccountStatus
  password: string
  role: string
  sendCredentials: boolean
}
