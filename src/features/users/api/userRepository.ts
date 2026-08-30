import { httpClient } from '@/shared/api/httpClient'
import { buildFormData } from '@/shared/lib/buildFormData'
import type {
  AppNotification,
  CreateUserInput,
  OpenAccountInput,
  UpdateUserInput,
  User,
} from '@/features/users/types'

/**
 * Every call the UI makes against `api/users`.
 *
 * Create and update are `multipart/form-data` because both actions accept an
 * optional photo alongside the record; the rest are plain JSON. The nested
 * `employment` object is flattened into `Employment.Field` keys, which is how
 * ASP.NET model binding reconstructs a nested record from a form post.
 */
export const userRepository = {
  async getAll(): Promise<User[]> {
    const { data } = await httpClient.get<User[]>('/api/users')
    return data
  },

  async getById(id: string): Promise<User> {
    const { data } = await httpClient.get<User>(`/api/users/${id}`)
    return data
  },

  async create(input: CreateUserInput, photo: File | null): Promise<User> {
    const { data } = await httpClient.post<User>('/api/users', toUserFormData(input, photo))
    return data
  },

  async update(id: string, input: UpdateUserInput, photo: File | null): Promise<User> {
    const { data } = await httpClient.put<User>(`/api/users/${id}`, toUserFormData(input, photo))
    return data
  },

  async changePassword(id: string, newPassword: string): Promise<void> {
    await httpClient.put(`/api/users/${id}/password`, { newPassword })
  },

  /** Opens a sign-in account on an employee record that has none. */
  async openAccount(id: string, input: OpenAccountInput): Promise<User> {
    const { data } = await httpClient.post<User>(`/api/users/${id}/account`, input)
    return data
  },

  /** Activates a pending account so the user can sign in. */
  async activate(id: string): Promise<void> {
    await httpClient.post(`/api/users/${id}/activation`)
  },

  /** Withdraws sign-in rights while keeping the employee record. */
  async revokeAccount(id: string): Promise<void> {
    await httpClient.delete(`/api/users/${id}/account`)
  },

  /** Hides the user from listings; the row is retained for audit. */
  async softDelete(id: string): Promise<void> {
    await httpClient.delete(`/api/users/${id}`)
  },

  async getMyNotifications(): Promise<AppNotification[]> {
    const { data } = await httpClient.get<AppNotification[]>('/api/users/me/notifications')
    return data
  },
}

function toUserFormData(input: CreateUserInput | UpdateUserInput, photo: File | null): FormData {
  const { employment, ...rest } = input

  return buildFormData(
    {
      ...rest,
      'Employment.HiringDate': employment.hiringDate,
      'Employment.Status': employment.status,
      'Employment.ContractType': employment.contractType,
      'Employment.Position': employment.position,
      'Employment.LocalJobTitle': employment.localJobTitle,
      'Employment.SiteCode': employment.siteCode,
      'Employment.Site': employment.site,
      'Employment.Department': employment.department,
      'Employment.BusinessUnit': employment.businessUnit,
      'Employment.Segment': employment.segment,
    },
    { photo },
  )
}
