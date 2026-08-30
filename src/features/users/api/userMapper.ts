import { toEmployee, toEmployeeDto } from '@/features/employees/api/employeeMapper'
import type { UserAccount, UserAccountDto } from '@/features/users/types'

export function toUserAccount(dto: UserAccountDto): UserAccount {
  return {
    ...toEmployee(dto),
    accountStatus: dto.account_Status,
    role: dto.role,
  }
}

export function toUserAccountDto(user: UserAccount): UserAccountDto {
  return {
    ...toEmployeeDto(user),
    account_Status: user.accountStatus,
    role: user.role,
  }
}
