import { httpClient } from '@/shared/api/httpClient'
import { buildFormData } from '@/shared/lib/buildFormData'
import { ROLES, type Role } from '@/shared/config/roles'
import { toUserAccount } from '@/features/users/api/userMapper'
import type {
  AttachAccountInput,
  CreateUserInput,
  UpdateAccountInput,
  UserAccount,
  UserAccountDto,
} from '@/features/users/types'

export const userRepository = {
  async getAll(): Promise<UserAccount[]> {
    const { data } = await httpClient.get<UserAccountDto[]>('/api/User')
    return data.map(toUserAccount)
  },

  async getByBusinessUnit(businessUnit: string): Promise<UserAccount[]> {
    const { data } = await httpClient.get<UserAccountDto[]>('/api/User/BU', { params: { bu: businessUnit } })
    return data.map(toUserAccount)
  },

  async getForRole(role: Role, businessUnit: string | null): Promise<UserAccount[]> {
    if (role === ROLES.SUPER_ADMIN || !businessUnit) {
      return this.getAll()
    }
    return this.getByBusinessUnit(businessUnit)
  },

  async getById(id: string): Promise<UserAccount> {
    const { data } = await httpClient.get<UserAccountDto>(`/api/User/${id}`)
    return toUserAccount(data)
  },

  async create(input: CreateUserInput): Promise<void> {
    const { employee, account, photo, sendCredentials } = input
    const formData = buildFormData(
      {
        Id: employee.id,
        Cin: employee.cin,
        Gender: employee.gender,
        First_Name: employee.firstName,
        Last_Name: employee.lastName,
        Address: employee.address,
        Tel: employee.phone,
        Status: employee.status,
        Position: employee.position,
        Site: employee.site,
        Department: employee.department,
        Business_Unit: employee.businessUnit,
        Segment: employee.segment,
        Local_Job_Title: employee.localJobTitle,
        Hiring_Date: employee.hiringDate,
        Supervisor: employee.supervisor,
        Email: account?.email ?? null,
        Account_Status: account?.accountStatus ?? null,
        Password: account?.password ?? null,
        Role: account?.role ?? null,
      },
      { Photo: photo },
    )
    await httpClient.post(`/api/User?send=${sendCredentials}`, formData)
  },

  async update(id: string, input: { employee: UserAccount; photo: File | null }): Promise<void> {
    const { employee, photo } = input
    const formData = buildFormData(
      {
        Id: employee.id,
        Cin: employee.cin,
        Gender: employee.gender,
        First_Name: employee.firstName,
        Last_Name: employee.lastName,
        Address: employee.address,
        Tel: employee.phone,
        Status: employee.status,
        Position: employee.position,
        Site: employee.site,
        Department: employee.department,
        Business_Unit: employee.businessUnit,
        Segment: employee.segment,
        Local_Job_Title: employee.localJobTitle,
        Hiring_Date: employee.hiringDate,
        Supervisor: employee.supervisor,
      },
      { Photo: photo },
    )
    await httpClient.put(`/api/User/${id}`, formData)
  },

  async updateAccount(id: string, input: UpdateAccountInput): Promise<void> {
    await httpClient.put(`/api/User/updateAccount/${id}`, {
      email: input.email,
      account_Status: input.accountStatus,
      password: input.password,
      role: input.role,
      send: input.sendCredentials,
    })
  },

  async attachAccount(input: AttachAccountInput): Promise<void> {
    await httpClient.put(`/api/User/addAccount/${input.employeeId}?send=${input.sendCredentials}`, {
      email: input.email,
      account_Status: input.accountStatus,
      password: input.password,
      role: input.role,
    })
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/api/User/${id}`)
  },

  /** Soft-remove: deactivates the account without deleting the employee record. */
  async softRemove(id: string): Promise<void> {
    await httpClient.delete(`/api/User/removeUser/${id}`)
  },

  async verifyAccount(id: string): Promise<void> {
    await httpClient.post(`/api/User/verifyAccount/${id}`)
  },

  async createMany(users: CreateUserInput[]): Promise<void> {
    for (const user of users) {
      await this.create(user)
    }
  },
}
