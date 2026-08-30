import { httpClient } from '@/shared/api/httpClient'
import { ROLES, type Role } from '@/shared/config/roles'
import { toEmployee } from '@/features/employees/api/employeeMapper'
import type { Employee, EmployeeDto } from '@/features/employees/types'

export const employeeRepository = {
  async getAll(): Promise<Employee[]> {
    const { data } = await httpClient.get<EmployeeDto[]>('/api/Employee')
    return data.map(toEmployee)
  },

  async getByBusinessUnit(businessUnit: string): Promise<Employee[]> {
    const { data } = await httpClient.get<EmployeeDto[]>('/api/Employee/BU', { params: { bu: businessUnit } })
    return data.map(toEmployee)
  },

  /** Superadmins see every employee; admins are scoped to their business unit. */
  async getForRole(role: Role, businessUnit: string | null): Promise<Employee[]> {
    if (role === ROLES.SUPER_ADMIN || !businessUnit) {
      return this.getAll()
    }
    return this.getByBusinessUnit(businessUnit)
  },

  async getById(id: string): Promise<Employee> {
    const { data } = await httpClient.get<EmployeeDto>(`/api/User/${id}`)
    return toEmployee(data)
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/api/User/${id}`)
  },

  async getWithStatistics(employeeId: string): Promise<unknown> {
    const { data } = await httpClient.get('/api/Employee/GetEmployeeWithStatistics', {
      params: { userId: employeeId },
    })
    return data
  },
}
